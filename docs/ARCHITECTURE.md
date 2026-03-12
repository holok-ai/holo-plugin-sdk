# Architecture

Holo runs as five independent server processes connected via RabbitMQ. All servers share a unified startup lifecycle via `BaseServer` with composable mixins (DB, queue, admin, stats).

```
                        ┌─────────────────────┐
                        │      RabbitMQ        │
                        │                      │
                        │  request (fanout)     │
                        │  response (direct)    │
                        │  notifications (topic)│
                        │  evaluator (direct)   │
                        └──┬───┬───┬───┬───────┘
                           │   │   │   │
          ┌────────────────┘   │   │   └────────────────┐
          ▼                    ▼   ▼                    ▼
   ┌─────────────┐   ┌────────────────┐   ┌──────────────────┐
   │ API Server  │   │ Worker Server  │   │  Audit Server    │
   │ (Express)   │   │ (Plugins)      │   │  (Logging)       │
   │             │   │                │   │                  │
   │ Auth (JWT/  │   │ Provider Match │   │  Request Audit   │
   │  HoloToken) │   │ Guard Enforce  │   │  Response Audit  │
   │ Guard Exec  │   │ Wire Adapters  │   │  Notification Log│
   │ SSE Stream  │   │ Auditors       │   └──────────────────┘
   │ Notif SSE   │   │                │
   └─────────────┘   └────────────────┘
                              │              ┌──────────────────┐
                     ┌────────┴────────┐     │ Evaluator Server │
                     │   Providers     │     │                  │
                     │  (via Plugins)  │     │ Chained evals    │
                     │                 │     │ Context loading   │
                     │ OpenAI  Claude  │     │ Scoring pipeline │
                     │ Ollama  Gemini  │     └──────────────────┘
                     └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Postgres + Redis  │
                    └───────────────────┘
```

**API Server** (`servers/api.server.ts`) — Express HTTP entry point. Authenticates via JWT or HoloToken, executes guards, queues requests, streams responses back via SSE. Serves the notification SSE endpoint.

**Worker Server** (`servers/worker.server.ts`) — Consumes requests from queue. Resolves provider plugin, enforces guard results, processes via provider SDK, converts events to wire format, publishes response chunks back.

**Audit Server** (`servers/audit.server.ts`) — Consumes from request, response, and notification audit queues. Writes all activity to PostgreSQL.

**Batch Server** (`servers/batch.server.ts`) — Handles async batch jobs such as pricing recalculation.

**Evaluator Server** (`servers/evaluator.server.ts`) — Consumes from evaluator task queue. Runs chained evaluators on LLM responses with context loading and scoring persistence.

## Unified Server Lifecycle

All servers extend `BaseServer` with composable mixins:

```
BaseServer
  ├── withDB       → Postgres connect, server registration, heartbeat
  ├── withQueue    → RabbitMQ connect
  ├── withAdmin    → Admin command queue
  └── withStats    → Request statistics
```

Startup flow (same for all servers):
1. `BaseServer.start()` → registers process signal handlers
2. `withDB.onInit()` → connects to Postgres, registers server in `servers` table, starts periodic heartbeat
3. `withQueue.onInit()` → connects to RabbitMQ
4. `withAdmin.onInit()` → sets up admin command queue
5. Server-specific `onInit()` → plugin init, queue consumers, Express routes, etc.

DI registrations are centralized in `container/base.registry.ts` (shared) plus per-server registry files.

## Request Flow

1. Client sends HTTP request to `/:plugin/:appSlug/*`
2. API server authenticates (JWT, HoloToken, or anonymous), resolves app config from cache
3. Guards execute (parallel side-LLM calls) — results attached to request
4. Request published to RabbitMQ fanout exchange
5. Worker consumes, checks guard results, calls provider via plugin
6. Provider emits `ProviderEvent`s into an `AsyncEventQueue`
7. Wire adapter converts events to `WireChunk`s, published to response exchange
8. API server receives chunks, pipes to HTTP response stream
9. Audit server logs request + response to PostgreSQL (`provider_requests` / `provider_responses`)
10. Evaluator server runs post-hoc evaluation pipeline

## Hub-and-Spoke Translation

All providers translate to/from a universal **Holo format** (`HoloRequest`, `HoloResponse`, `HoloMessage`). This reduces the N-to-N translation problem to N-to-1 — each plugin only implements its own format to/from Holo.

## Plugin System

Plugins are standalone npm packages discovered from `node_modules/@holokai/` at startup. Each plugin is registered in the `plugins` table and its protocols in the `protocols` table.

### Plugin → Protocol → Provider

- **Plugin** — defines a wire format family (OpenAI, Claude, Ollama). Registered globally, immutable per version. One default per family.
- **Protocol** — a specific endpoint within a plugin (e.g., `openai.completions`, `claude.messages`). Each protocol has a **capability** tag (`chat`, `generate`, `embed`, `models`).
- **Provider** — an org-specific configured instance that uses a plugin (e.g., "My OpenAI" with API key). FK to plugin.

```
Plugin (OPENAI v1.0.0)
  ├── Protocol: openai.completions  (capability: chat)
  ├── Protocol: openai.responses    (capability: chat)
  ├── Protocol: openai.embeddings   (capability: embed)
  └── Protocol: openai.models       (capability: models)

Provider ("My OpenAI") → plugin_id → Plugin (OPENAI)
Provider ("LM Studio") → plugin_id → Plugin (OLLAMA)
```

### Plugin Registration

At startup, each server:
1. Discovers `@holokai/holo-provider-*` packages
2. Loads and initializes each plugin
3. Upserts the plugin into the `plugins` table
4. Registers each protocol from the plugin's route tree into the `protocols` table
5. Creates provider implementations for each configured provider that uses the plugin
6. Syncs `server_plugins` — removes stale entries for plugins no longer discovered

### What a Plugin Implements

- **Provider** — request processing, model listing, error handling
- **Wire Adapter** — `ProviderEvent` to `WireChunk` conversion for HTTP streaming
- **Auditor** — request/response mapping to audit trail format
- **Translator** — Holo universal format conversion (hub-and-spoke)
- **Routes** — declarative `RouteTree` defining endpoints, protocols, and handlers

### Protocols and Capabilities

Each route in a plugin declares a protocol and capability:

```typescript
getRoutes(): RouteTree {
    return {
        chat: {
            completions: {
                method: 'POST',
                handler: RouteHandler.REQUEST,
                protocol: { name: 'openai.completions', capability: ProtocolCapability.CHAT }
            }
        }
    }
}
```

**Capabilities** are gateway-level categories for reporting:

| Capability | Description |
|-----------|-------------|
| `chat` | Conversational LLM requests |
| `generate` | Text generation (non-chat) |
| `embed` | Embedding generation |
| `models` | Model listing |

### Available Plugins

| Plugin | Protocols | Capabilities |
|--------|-----------|-------------|
| **OpenAI** | `openai.completions`, `openai.responses`, `openai.embeddings`, `openai.models` | chat, embed, models |
| **Claude** | `claude.messages`, `claude.models` | chat, models |
| **Ollama** | `ollama.chat`, `ollama.generate`, `ollama.embeddings`, `ollama.models` | chat, generate, embed, models |

Routes are registered dynamically at startup. All model listing endpoints return models across **all** providers the user has access to.

### App Routes

All routes follow the pattern `/:plugin/:appSlug/*`:

```
POST /openai/my-app/v1/chat/completions
POST /claude/my-app/v1/messages
GET  /openai/my-app/v1/models
```

## Audit System

All LLM requests and responses are logged to `provider_requests` and `provider_responses` tables.

**Real columns** (queryable, indexable): `organization_id`, `request_id`, `application_id` (FK), `provider_id` (FK), `protocol_id` (FK), `user_id`, `client_identifier`, `access_model`, `thread_id`, `status`, token counts, timing, cost, score.

**Metadata JSONB** (extensible): `user_prompt`, `system_prompt`, `raw_request`, `headers`, `query_params`, `guard_result`, `response_raw`, `usage_raw`, `worker_id`, etc.

**Views:**
- `llm_requests` / `llm_responses` — backwards-compatible views matching the old column layout
- `v_provider_requests` / `v_provider_responses` — full views with JOINed application, provider, protocol, and plugin names

**Self-contained audit records:** The audit record on the RabbitMQ queue carries both UUIDs and human-readable names. The Postgres auditor stores FKs only (views provide names). External auditors (Snowflake) can use the full record with names.

## Server Monitoring

Servers register in the `servers` table at startup and record periodic heartbeats to `server_heartbeats` with hostname, IP address, platform, architecture, Node version, memory, CPU count, uptime, and PID.

The `server_plugins` junction table tracks which plugins each server has loaded, synced on every startup.

## Notifications

Real-time event streaming via SSE at `/holo/api/notifications/stream`:

- RabbitMQ topic exchange with routing key pattern `org.{id}.user.{id}.app.{slug}`
- Event types: `request_started`, `guard_started`, `guard_passed`, `guard_failed`, `response_completed`, `status`
- Cursor-based pagination for replay via `Last-Event-ID`
- Persisted to PostgreSQL for audit trail

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `plugins` | Global plugin registry (family, version, is_default) |
| `protocols` | Plugin-defined protocols with capability tags |
| `providers` | Org-specific provider instances (FK to plugin) |
| `applications` | App configurations with provider, models, guards |
| `servers` | Registered server instances |
| `server_plugins` | Junction: which plugins each server has loaded |
| `server_heartbeats` | Server health snapshots (hostname, IP, memory, etc.) |

### Audit Tables

| Table | Description |
|-------|-------------|
| `provider_requests` | LLM request audit log (FKs + metadata JSONB) |
| `provider_responses` | LLM response audit log (FKs + metrics + metadata JSONB) |
| `llm_requests` (view) | Backwards-compatible request view |
| `llm_responses` (view) | Backwards-compatible response view |
| `v_provider_requests` (view) | Full request view with JOINed names |
| `v_provider_responses` (view) | Full response view with JOINed names |
