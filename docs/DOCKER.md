# Docker

Holo ships a single Dockerfile that builds all four servers (API, Worker, Audit, Batch). `docker-compose.yml` runs them as separate services sharing the same image.

## Build Modes

The `BUILD_MODE` build arg controls how dependencies are resolved:

| Mode | What it does | Use case |
|---|---|---|
| `dev` (default) | Copies the full monorepo to `/monorepo/` and runs `npm install` with workspaces | Local development, CI |
| `prod` | Copies only `app/` to `/app/` and installs plugins from npm registry | Deployed environments |

## Building

```sh
# Dev mode (default) — includes all workspace plugins
docker compose build

# Production mode — installs plugins from npm
docker compose build --build-arg BUILD_MODE=prod

# Standalone build
docker build -t holo:latest .
docker build -t holo:latest --build-arg BUILD_MODE=prod .
```

## Running

### Local development

```sh
# Start all services (foreground, with logs)
docker compose up

# Start specific services
docker compose up api worker
docker compose up audit

# Scale workers
docker compose up --scale worker=3
```

### Deployed environments

```sh
# Pull latest images and run detached
docker compose pull && docker compose up -d

# View logs
docker compose logs -f api

# Restart a single service
docker compose restart worker
```

### All-in-one (convenience)

Run all servers in a single container:

```sh
docker run -e ENABLE_ALL=true \
  -e RABBITMQ_URL=amqp://localhost:5672 \
  -e REDIS_URL=redis://localhost:6379 \
  -p 3000:3000 \
  holo:latest
```

### Service toggles

Each server is controlled by an environment variable:

| Variable | Default | Description |
|---|---|---|
| `ENABLE_API` | `true` | Start the API server |
| `ENABLE_WORKER` | `true` | Start the Worker server |
| `ENABLE_AUDIT` | `true` | Start the Audit server |
| `ENABLE_BATCH` | `false` | Start the Batch server |
| `ENABLE_ALL` | — | When `true`, overrides all toggles to `true` |

In `docker-compose.yml`, each service explicitly sets its own toggle to `true` and the rest to `false`.

## CI/CD

**Build once, deploy everywhere.** CI builds and pushes the image; deployed environments only pull and restart. No source code, build tools, or npm on the deployment host — just Docker and the compose file.

### Branches

| Branch | Builds | Deploys to | Image tag |
|---|---|---|---|
| `development` | On push | Dev environment | `dev`, `dev-<sha>` |
| `main` | On push/merge | Production | `<version>`, `latest` |

### CI: Build and Publish

```sh
# Development branch
docker build -t registry.example.com/holo:dev \
             -t registry.example.com/holo:dev-$(git rev-parse --short HEAD) .
docker push registry.example.com/holo --all-tags

# Main branch (release)
docker build -t registry.example.com/holo:1.2.0 \
             -t registry.example.com/holo:latest .
docker push registry.example.com/holo --all-tags
```

### CD: Deploy

Each environment needs only:
1. `docker-compose.yml` (same file, committed to repo)
2. `.env` with environment-specific values

```sh
# Example .env on a deployment host
DOCKER_REGISTRY=registry.example.com/holo
IMAGE_TAG=1.2.0
NODE_ENV=production
AUDIT_PG_HOST=prod-db.internal
AUDIT_PG_DATABASE=holokai
AUDIT_PG_USER=<from-secrets-manager>
AUDIT_PG_PASSWORD=<from-secrets-manager>
CREDENTIAL_ENCRYPTION_KEY=<from-secrets-manager>
JWT_SECRET=<from-secrets-manager>
RABBITMQ_URL=amqp://prod-mq.internal:5672
REDIS_URL=redis://prod-redis.internal:6379
MOKU_URL=http://moku.internal:8080
```

```sh
docker compose pull && docker compose up -d
```

### Compose Variables

| Variable | Default | Description |
|---|---|---|
| `DOCKER_REGISTRY` | `holo` | Image name or registry path |
| `IMAGE_TAG` | `latest` | Image tag to pull/run |
| `NODE_ENV` | `development` | Node environment |

### Workflow Summary

```
push to development
  → CI: build + push :dev and :dev-<sha>
  → CD: docker compose pull && docker compose up -d  (dev host)

merge to main
  → CI: build + push :<version> and :latest
  → CD: docker compose pull && docker compose up -d  (prod host)
```

## Environment Variables

Copy [`.env.example`](../.env.example) to `.env` and fill in your values. Docker Compose reads this file automatically.

```sh
cp .env.example .env
```

### Required

| Variable | Description |
|---|---|
| `CREDENTIAL_ENCRYPTION_KEY` | AES key for encrypting stored provider credentials ([setup guide](ENCRYPTION_SETUP.md)) |
| `AUDIT_PG_USER` | Postgres user |
| `AUDIT_PG_PASSWORD` | Postgres password |
| `JWT_SECRET` | JWT signing secret (required if JWT auth is used) |

### Infrastructure

| Variable | Default | Description |
|---|---|---|
| `RABBITMQ_URL` | `amqp://localhost:5672` | RabbitMQ connection URL |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `MOKU_URL` | — | Moku API base URL (e.g., `http://host.docker.internal:8080`) |

### Database

Postgres connection can be configured with `APP_PG_*` or `AUDIT_PG_*` prefixes. The app DB falls back to `AUDIT_PG_*` vars and vice versa, so a single set works when both point to the same instance.

| Variable | Default | Description |
|---|---|---|
| `AUDIT_PG_HOST` | `localhost` | Postgres host |
| `AUDIT_PG_PORT` | `5432` | Postgres port |
| `AUDIT_PG_DATABASE` | — | Database name |
| `AUDIT_PG_USER` | — | Database user |
| `AUDIT_PG_PASSWORD` | — | Database password |
| `AUDIT_PG_SSL` | `false` | Enable SSL |
| `AUDIT_PG_MAX_CONNECTIONS` | `20` | Connection pool size |
| `AUDIT_PG_IDLE_TIMEOUT` | `30000` | Idle connection timeout (ms) |

### API Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `API_SERVER_ID` | auto-generated | Unique server identifier |
| `API_CONFIG_MODE` | `local` | Config mode (`local` or `remote`) |
| `API_CONFIG_TIMEOUT` | `60000` | Config load timeout (ms) |
| `API_PLUGINS_DIR` | `../node_modules` | Directory to scan for plugins |
| `AUDIT_ENABLED` | — | Enable audit record publishing |

### Auth

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | `1h` | JWT token expiration |

### Networking

The `docker-compose.yml` uses an external network `holokai-network`. Create it before first run:

```sh
docker network create holokai-network
```

Services use `host.docker.internal` to reach the host machine (e.g., for Moku running outside Docker).

## Volumes

| Volume | Mount | Description |
|---|---|---|
| `audit_logs` | `/app/logs` | Audit server log files |

## Health Check

The API service has a health check configured:

```
GET http://localhost:3000/health
```

Interval: 10s, timeout: 5s, retries: 5, start period: 120s.
