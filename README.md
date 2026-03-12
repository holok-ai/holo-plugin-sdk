# Holo

LLM proxy with plugin-based provider routing. Routes requests through configurable applications, providers, and prompts with built-in audit logging, guard evaluation, and cost tracking.

## Servers

| Server | Description |
|---|---|
| **API** | HTTP gateway — routes LLM requests, serves management APIs |
| **Worker** | Processes queued LLM requests against provider APIs |
| **Audit** | Persists request/response audit records to Postgres |
| **Batch** | Async batch jobs (pricing recalculation, etc.) |
| **Evaluator** | Post-response evaluation pipeline |

## Project Structure

```
app/              Main application (all 5 servers)
plugins/
  types/          Shared type definitions (@holokai/types)
  sdk/            Plugin SDK and base classes (@holokai/sdk)
  holo-provider-openai/
  holo-provider-claude/
  holo-provider-ollama/
docs/             Documentation
```

## Prerequisites

- Node.js >= 18
- PostgreSQL (schema managed by Flyway via the Moku project)
- RabbitMQ
- Redis

## Quick Start

### Local Development

```sh
npm install

# Start individual servers with hot reload (each in its own terminal)
npm run api:dev
npm run worker:dev
npm run audit:dev
npm run analysis:dev
```

### Docker

```sh
docker network create holokai-network   # first time only
docker compose up                       # all services
docker compose up api worker            # specific services
```

### Environment

```sh
cp .env.example .env
# Fill in your database credentials, JWT secret, and encryption key
```

See [`.env.example`](.env.example) for all available variables. For Docker-specific config, see [docs/DOCKER.md](docs/DOCKER.md).

### Health Check

```
GET /health
```

## Testing

```sh
npm test                    # All tests
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:workspaces     # Plugin workspace tests
```

## Documentation

| Doc | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, request flow, plugin system, audit, database schema |
| [Docker](docs/DOCKER.md) | Build modes, running, publishing, full environment variable reference |
| [Authentication](docs/AUTHENTICATION.md) | Auth methods (JWT, HoloToken, anonymous), middleware, caching |
| [Encryption Setup](docs/ENCRYPTION_SETUP.md) | Generating and managing the credential encryption key |

## License

MIT
