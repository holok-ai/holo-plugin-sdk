# Holo

A distributed LLM proxy server that provides unified access to multiple LLM providers through a plugin-based architecture. Built with TypeScript, RabbitMQ, and PostgreSQL.

## Architecture

Holo runs as four independent server processes connected via RabbitMQ:

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
   │ JWT Auth    │   │ Provider Match │   │  Request Audit   │
   │ Guard Exec  │   │ Guard Enforce  │   │  Response Audit  │
   │ SSE Stream  │   │ Wire Adapters  │   │  Notification Log│
   │ Notif SSE   │   │ Auditors       │   └──────────────────┘
   └─────────────┘   └────────────────┘
                              │              ┌──────────────────┐
                     ┌────────┴────────┐     │ Evaluator Server │
                     │    Providers    │     │                  │
                     │                 │     │ Chained evals    │
                     │ OpenAI  Claude  │     │ Context loading  │
                     │ Ollama  Gemini  │     │ Scoring pipeline │
                     └─────────────────┘     └──────────────────┘
                              │
                         ┌────┴────┐
                         │ Postgres│
                         └─────────┘
```

**API Server** (`src/app.ts`) — HTTP entry point. Authenticates via JWT, executes guards, queues requests, streams responses back via SSE. Serves the notification SSE endpoint.

**Worker Server** (`src/servers/worker.server.ts`) — Consumes requests from queue. Resolves provider plugin, enforces guard results, processes via provider SDK, converts events to wire format, publishes response chunks back.

**Audit Server** (`src/servers/audit.server.ts`) — Consumes from request, response, and notification audit queues. Writes all activity to PostgreSQL via plugin auditors.

**Evaluator Server** (`src/servers/evaluator.server.ts`) — Consumes from evaluator task queue. Runs chained evaluators on LLM responses with context loading and scoring persistence.

### Request Flow

1. Client sends HTTP request to `/:provider/:appSlug/*`
2. API server authenticates JWT, resolves app config from cache
3. Guards execute (parallel side-LLM calls) — results attached to request
4. Request published to RabbitMQ fanout exchange
5. Worker consumes, checks guard results, calls provider via plugin
6. Provider emits `ProviderEvent`s into an `AsyncEventQueue`
7. Wire adapter converts events to `WireChunk`s, published to response exchange
8. API server receives chunks, pipes to HTTP response stream
9. Audit server logs request + response to PostgreSQL
10. Evaluator server runs post-hoc evaluation pipeline

### Hub-and-Spoke Translation

All providers translate to/from a universal **Holo format** (`HoloRequest`, `HoloResponse`, `HoloMessage`). This reduces the N-to-N translation problem to N-to-1 — each plugin only implements its own format to/from Holo.

## Providers

Routes are registered dynamically by plugins at startup. Each plugin defines its own endpoints:

| Provider | Endpoints | Capabilities |
|----------|-----------|--------------|
| **OpenAI** | `/chat/completions`, `/responses`, `/embeddings`, `/models` | streaming, tools, vision, function calling |
| **Claude** | `/v1/messages`, `/v1/models` | streaming, tools, vision, function calling |
| **Ollama** | `/api/chat`, `/api/generate`, `/api/embed`, `/api/tags` | streaming |
| **Gemini** | (in progress) | — |

All model listing endpoints return models across **all** providers the user has access to, enabling provider-agnostic model access through any SDK.

### App Routes

All routes follow the pattern `/:provider/:appSlug/*`:

```
POST /openai/my-app/v1/chat/completions
POST /claude/my-app/v1/messages
GET  /openai/my-app/v1/models
```

The app controller extracts provider and appSlug, validates access via JWT, and rewrites to `/api/{provider}/{path}`.

## Notifications

Real-time event streaming via SSE at `/api/notifications/stream`:

- RabbitMQ topic exchange with routing key pattern `org.{id}.user.{id}.app.{slug}`
- Event types: `request_started`, `guard_started`, `guard_passed`, `guard_failed`, `response_completed`, `provider_request_started`, `provider_response_completed`, `provider_error`, `status`
- Cursor-based pagination for replay via `Last-Event-ID`
- Persisted to PostgreSQL for audit trail

## Plugin System

Plugins are standalone packages discovered from `plugins/` at startup. Each provider plugin implements:

- **Provider** — request processing, model listing, error handling
- **Wire Adapter** — `ProviderEvent` to `WireChunk` conversion for HTTP streaming
- **Auditor** — request/response mapping to audit trail format
- **Translator** — Holo universal format conversion (hub-and-spoke)
- **Routes** — declarative `RouteTree` defining endpoints and handlers

Plugin types: `provider` | `guard` | `evaluator` | `logger` | `worker` | `notification`

See [Plugin SDK Documentation](plugins/sdk/README.md) for the development guide.

| Reference Plugin | Key Features |
|-----------------|--------------|
| [Claude](plugins/holo-provider-claude/README.md) | 6-event streaming lifecycle, content blocks, thinking support |
| [OpenAI](plugins/holo-provider-openai/README.md) | Dual wire adapters (completions vs responses), tool calling |
| [Ollama](plugins/holo-provider-ollama/README.md) | Generate vs Chat endpoints, passthrough default handler |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- RabbitMQ 3.8+

### Setup

```bash
npm install

cp .env.example .env
# Edit .env with your configuration
```

### Required Environment Variables

```bash
# Server
PORT=3000
API_SERVER_ID=api_server_001
WORKER_ID=worker_001
AUDIT_ID=audit_001
ANALYSIS_ID=evaluator_001

# PostgreSQL
APP_PG_HOST=localhost
APP_PG_PORT=5432
APP_PG_DATABASE=holokai
APP_PG_USER=holo
APP_PG_PASSWORD=holopassword

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Auth & Security (required)
JWT_SECRET=your-secret-key-at-least-32-characters
CREDENTIAL_ENCRYPTION_KEY=your-encryption-key
MOKU_URL=http://localhost:8080
```

### Run

```bash
# Development (4 terminals)
npm run api:dev
npm run worker:dev
npm run audit:dev
npm run analysis:dev

# Production
npm start              # API server
npm run start-worker   # Worker
npm run start-audit    # Audit
npm run start-analysis # Evaluator
```

### Docker

```bash
docker-compose up -d
```

### Health Check

```
GET /health
```

## Testing

```bash
npm test                    # All tests
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:workspaces     # Plugin workspace tests
```

## License

MIT
