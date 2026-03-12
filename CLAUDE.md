# Holo - Project Instructions

## Code Style

- Never comment unless the code is not self-explanatory
- No deprecated annotations — we are the only SDK consumers
- Use `pickDefined` from `@holokai/sdk` to strip undefined fields from objects
- Use `validate` from the `uuid` package for UUID checks — no hand-rolled regex
- Prefer FK integrity (UUID references) over loose string lookups
- Services delegate DB access to a dedicated DB class (e.g., `ApplicationService` → `ApplicationDB`). Don't put raw SQL in services.

## Project Structure

- **`app/`** — main Holo application (4 servers: API, Worker, Audit, Evaluator)
- **`plugins/types/`** — shared type definitions (`@holokai/types`), no runtime dependencies
- **`plugins/sdk/`** — plugin SDK (`@holokai/sdk`), base classes and utilities
- **`plugins/holo-provider-*/`** — provider plugins (OpenAI, Claude, Ollama)

All servers extend `BaseServer` with composable mixins (`withDB`, `withQueue`, `withAdmin`, `withStats`). DI registrations live in `app/src/container/` (base + per-server registries).

## Database

- Postgres schema managed by **Flyway** in a separate project: `/Users/alexduan/IdeaProjects/moku/api/src/main/resources/db/migration/`
- Moku is Java/Spring with **Hibernate Envers** for audit tables (audit schema: `holokai_audit`)
- DDL changes = Flyway migration. Data migrations = separate scripts run after app startup (not in Flyway).
- Migration naming: `V{YYYYMMDD}{HHMMSS}__{description}.sql`
- Tables use `holokai` schema. Audit tables use `holokai_audit` schema.

## Key Conventions

### Naming

- DB audit tables: `provider_requests` / `provider_responses` (not `llm_` or `holo_`)
- Model identifier field: `access_model` (not `model_slug`) — matches the `Model` entity's `access_model` field
- External identity: `client_identifier` (text column). Holokai identity: `user_id` (UUID FK to `app_users`)
- Plugin protocols: `{family}.{endpoint}` format (e.g., `openai.completions`, `claude.messages`, `ollama.chat`)

### Plugin System

- Plugin → Protocol → Provider hierarchy
- Plugins define protocols in their `RouteTree` with `{ name, capability }` objects
- Capabilities: `ProtocolCapability.CHAT`, `GENERATE`, `EMBED`, `MODELS`
- Providers FK to `plugin_id`. Prompts FK to `provider_id`.
- Protocol lookup is always by FK/ID, never by name string

### Audit Records

- `provider_requests`/`provider_responses` have UUID FK columns for referential integrity
- Extensible `metadata` JSONB column for raw payloads, headers, guard results, etc.
- Audit records on the RabbitMQ queue are self-contained (UUIDs + human-readable names). Postgres stores FKs only — views provide names via JOINs. External auditors (Snowflake) use the full record.
- Backwards-compatible views: `llm_requests`/`llm_responses` match the old column layout

### Auth

- Single middleware: `makeAuthMiddleware(authService, opts)` — options: `allowJwt`, `allowHoloToken`, `allowAnonymous`, `optional`, `providerFamily`
- JWT `userId` may be an email — resolved to UUID via `AccessService.getUserIdByEmail()`, original value stored as `clientIdentifier`
- HoloToken auth cached in Redis: `auth:{tokenHash}:{appSlug}`, 120s TTL

## ArkType Validator Rules

When implementing ArkType validators:
1. ALWAYS use `satisfies Type<TypeName>` on every validator — NEVER use `any` or flexible types
2. NEVER use `Record<string, unknown>` as a shortcut — always create proper validators for nested types
3. NEVER use `type('string')` for union types — look up the actual enum/literal values
4. Start with the most basic types first, then build up to complex ones
5. ALWAYS look at the ACTUAL type definition in `.d.ts` files before implementing
6. Copy the exact structure from the SDK types — don't guess or make up field types
7. Pay attention to required vs optional fields (no `?` means required)
8. When a validator doesn't satisfy the type, fix the validator to match the actual type, never change to `any`
