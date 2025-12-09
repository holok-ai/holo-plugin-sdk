# Development Guide

## Prerequisites

### Required Software
- **Node.js**: >= 18.0.0
- **npm**: Included with Node.js
- **TypeScript**: 5.8.3 (installed via npm)
- **PostgreSQL**: 8.x (for audit database)
- **RabbitMQ**: Latest stable (for message queuing)

### Optional
- **Docker**: For containerized deployment
- **Docker Compose**: For orchestrating services

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd llm-proxy
```

### 2. Install Dependencies

```bash
npm install
```

This installs all dependencies and dev dependencies from `package.json`.

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Server settings
PORT=3000
NODE_ENV=development

# RabbitMQ settings
RABBITMQ_URL=amqp://localhost:5672

# LLM Provider settings
LLM_PROVIDER=mock  # Options: mock, ollama, openai, claude

# Ollama settings (if using ollama provider)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60000

# Audit service settings
AUDIT_ENABLED=true
AUDIT_PG_HOST=localhost
AUDIT_PG_PORT=5432
AUDIT_PG_DATABASE=llm_audit
AUDIT_PG_USER=postgres
AUDIT_PG_PASSWORD=postgres

# JWT TOKEN HANDLING
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-and-random
```

---

## Development Workflow

### Running Services

#### API Server (Development Mode)

```bash
npm run api:dev
```

Starts the Express API server on port 3000 with hot reload via nodemon.

**Alternative:**
```bash
npm start  # Without hot reload
```

---

#### Worker Server (Development Mode)

```bash
npm run worker:dev
```

Starts the worker server that processes LLM requests from the queue.

**Alternative:**
```bash
npm run start-worker  # Without hot reload
```

---

#### Audit Server (Development Mode)

```bash
npm run audit:dev
```

Starts the audit server for logging requests/responses to PostgreSQL.

**Alternative:**
```bash
npm run start-audit  # Without hot reload
```

---

#### Analysis Server (Development Mode)

```bash
npm run analysis:dev
```

Starts the analysis server for analytics processing.

**Alternative:**
```bash
npm run start-analysis  # Without hot reload
```

---

### Build Process

#### TypeScript Compilation

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

#### Type Checking (No Emit)

```bash
npm run type-check
```

Runs TypeScript compiler without emitting files (for checking types only).

---

## Testing

### Run All Tests

```bash
npm test
```

Runs Jest test suite.

### Integration Tests

```bash
npm run test:integration
```

Runs integration tests with 30-second timeout in serial mode.

**Note:** Integration tests connect to real providers (no mocking). Ensure you have valid API keys configured.

---

## Code Quality

### TypeScript Configuration

**File:** `tsconfig.json`

Key compiler options:
- **Target:** ESNext
- **Module:** ESNext (ES modules)
- **Strict Mode:** Enabled
- **Decorators:** Enabled (for tsyringe DI)
- **Source Maps:** Enabled
- **Declaration Files:** Generated

**Strict Checks Enabled:**
- `noImplicitAny`
- `noImplicitReturns`
- `noImplicitThis`
- `noUnusedLocals`
- `noUnusedParameters`
- `exactOptionalPropertyTypes`

---

### Coding Standards

See [CODING_STANDARDS.md](../CODING_STANDARDS.md) for detailed coding conventions.

Key principles:
- Never comment unless the code is not self-explanatory
- Use ArkType validators with `satisfies Type<TypeName>` - never use `any`
- Never use `Record<string, unknown>` as a shortcut - always create proper validators
- Start with basic types first, then build up complex ones
- Always look at actual type definitions in node_modules/.d.ts files before implementing

---

### Dependency Injection

The project uses `tsyringe` for dependency injection.

**Example:**

```typescript
import { injectable } from 'tsyringe';

@injectable()
export class MyService {
  constructor(private db: AppDB) {}

  async doSomething() {
    // Use this.db
  }
}
```

**Registration** (in `src/app.ts`):

```typescript
container
  .registerSingleton(MyService)
  .registerSingleton(AppDB);
```

---

## Project Structure

### Entry Points

1. **API Server:** `src/app.ts`
2. **Worker Server:** `src/servers/worker.server.ts`
3. **Audit Server:** `src/servers/audit.server.ts`
4. **Analysis Server:** `src/servers/analysis.server.ts`

### Key Directories

- `src/api/`: HTTP API routes, controllers, middleware
- `src/providers/`: Provider integrations (OpenAI, Claude, Ollama, Perplexity)
- `src/services/`: Business logic services
- `src/db/`: Database access layer
- `src/cache/`: In-memory caching
- `src/admin/`: Configuration and auth management
- `src/guards/`: Request pipeline guards
- `src/types/`: Shared TypeScript types
- `src/utils/`: Utility functions

---

## Configuration Management

### Configuration Modes

Holo supports two configuration loading modes:

#### 1. File-Based Configuration

Set in `.env`:
```bash
CONFIG_MODE=FILE
```

Loads configuration from a JSON file (path specified in environment).

**Use Case:** Development, single-server deployments

---

#### 2. Queue-Based Configuration

Set in `.env`:
```bash
CONFIG_MODE=QUEUE
```

Loads configuration from RabbitMQ queue.

**Use Case:** Production, multi-server deployments, dynamic configuration updates

**Key Feature:** Configuration updates are broadcast to all running instances via RabbitMQ.

---

## Database Setup

### PostgreSQL Audit Database

1. **Create Database:**

```sql
CREATE DATABASE llm_audit;
```

2. **Create User:**

```sql
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE llm_audit TO postgres;
```

3. **Run Migrations:**

Database schema is managed externally. Check with DBA for migration scripts or schema setup.

---

## RabbitMQ Setup

### Local RabbitMQ

Install and start RabbitMQ:

```bash
# macOS
brew install rabbitmq
brew services start rabbitmq

# Linux
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
```

RabbitMQ Management UI: http://localhost:15672
- Default credentials: `guest` / `guest`

### Exchanges and Queues

The application automatically creates required exchanges and queues on startup:

- **Request Exchange:** For LLM requests
- **Response Exchange:** For LLM responses
- **Config Exchange:** For configuration updates (queue mode)
- **Audit Queues:** For audit logging

---

## Provider Configuration

### Ollama (Local Models)

1. Install Ollama: https://ollama.ai
2. Pull a model:

```bash
ollama pull llama2
```

3. Set in `.env`:

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

---

### OpenAI

Configure in your organization's configuration (file or queue):

```json
{
  "providers": [
    {
      "type": "openai",
      "config": {
        "apiKey": "sk-..."
      }
    }
  ]
}
```

---

### Claude (Anthropic)

Configure in your organization's configuration:

```json
{
  "providers": [
    {
      "type": "claude",
      "config": {
        "apiKey": "sk-ant-..."
      }
    }
  ]
}
```

---

## Debugging

### Logging

The application uses Winston for structured logging.

**Log Levels:**
- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages (default)
- `debug`: Debug messages

**Set Log Level:**

```bash
LOG_LEVEL=debug npm run api:dev
```

**Log Files:**
- Located in `logs/` directory
- Separate log files per server (api, worker, audit, analysis)

---

### Debugging with VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "API Server",
      "runtimeArgs": ["--import", "./scripts/register-ts-node.mjs"],
      "args": ["src/app.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Worker Server",
      "runtimeArgs": ["--import", "./scripts/register-ts-node.mjs"],
      "args": ["src/servers/worker.server.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

---

## Common Development Tasks

### Adding a New Provider

1. Create provider directory: `src/providers/newprovider/`
2. Implement translator: `newprovider.translator.ts`
3. Create types: `types/`
4. Create validators: `validators/`
5. Add routes in `src/api/routes/`
6. Add controller in `src/api/controllers/`
7. Register routes in `src/api/routes/index.ts`

See [Provider Implementation Guide](../src/providers/IMPLEMENTATION_GUIDE.md) for details.

---

### Adding a New API Endpoint

1. Create route in `src/api/routes/`:

```typescript
export function createMyRoutes(): express.Router {
  const router = express.Router();
  const controller = container.resolve(MyController);
  const tokenService = container.resolve(TokenService);

  router.post('/my-endpoint',
    makeJwtAuthMiddleware(tokenService, {useCache: true}),
    controller.myHandler
  );

  return router;
}
```

2. Register in `src/api/routes/index.ts`:

```typescript
router.use('/my', createMyRoutes());
```

3. Create controller in `src/api/controllers/my.controller.ts`

---

### Modifying Database Schema

1. Update type definitions in `src/db/types/index.ts`
2. Create migration SQL script (if using migrations)
3. Run migration against database
4. Update corresponding `*DB` class in `src/db/`

---

## Docker Development

### Build Docker Image

```bash
docker build -t holo:latest .
```

### Run with Docker Compose

```bash
docker-compose up
```

**Services Started:**
- Holo API Server (port 3000)
- Holo configured to connect to external `holokai-network`

**Note:** RabbitMQ and PostgreSQL must be running in the external network.

---

## Hot Reload

All dev scripts use `nodemon` for automatic restart on file changes.

**Watched Files:**
- `src/**/*.ts`
- `src/**/*.js`

**Ignored:**
- `node_modules/`
- `dist/`
- `tests/`

---

## Common Issues

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:** Change `PORT` in `.env` or kill the process using port 3000.

```bash
lsof -ti:3000 | xargs kill
```

---

### RabbitMQ Connection Failed

```
Error: Failed to connect to RabbitMQ
```

**Solutions:**
1. Ensure RabbitMQ is running: `brew services list` (macOS)
2. Check `RABBITMQ_URL` in `.env`
3. Verify RabbitMQ management UI: http://localhost:15672

---

### PostgreSQL Connection Failed

```
Error: Failed to connect to PostgreSQL
```

**Solutions:**
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -l`

---

### TypeScript Errors

```
Error: Cannot find module 'xxx'
```

**Solutions:**
1. Run `npm install` to ensure all dependencies are installed
2. Check `tsconfig.json` paths
3. Restart TypeScript server in IDE

---

## Performance Tips

### Development Mode
- Use `npm run api:dev` for hot reload
- Enable debug logging: `LOG_LEVEL=debug`
- Use local Ollama for faster testing (no external API calls)

### Production Mode
- Build first: `npm run build`
- Run compiled code: `node dist/app.js`
- Use queue-based configuration for multi-server deployments
- Enable audit logging for compliance

---

## Next Steps

- Read [ARCHITECTURE.md](../ARCHITECTURE.md) for system architecture details
- Review [CODING_STANDARDS.md](../CODING_STANDARDS.md) for coding conventions
- Check [API Contracts](./api-contracts.md) for API documentation
- See [Data Models](./data-models.md) for database schema
- Review [Source Tree Analysis](./source-tree-analysis.md) for code organization
