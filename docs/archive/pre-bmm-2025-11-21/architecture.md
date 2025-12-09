# Holo - Architecture & Project Structure

## Table of Contents

1. [Project Structure Overview](#project-structure-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [Critical Directories](#critical-directories)
4. [Entry Points & Runtime Processes](#entry-points--runtime-processes)
5. [Design Patterns](#design-patterns)
6. [Integration Points](#integration-points)
7. [Architectural Concerns Separation](#architectural-concerns-separation)
8. [Recommendations for Clean Architecture](#recommendations-for-clean-architecture)

---

## Project Structure Overview

**Holo** is a monolithic TypeScript/Node.js backend application structured as an LLM Gateway with distributed queue architecture and multi-provider support.

```
llm-proxy/
├── src/                          # Source code
│   ├── api/                      # HTTP API layer
│   │   ├── controllers/          # Request handlers
│   │   │   ├── app.controller.ts       # Custom application routing
│   │   │   ├── base.controller.ts      # Base controller class
│   │   │   ├── claude.controller.ts    # Claude API endpoints
│   │   │   ├── ollama.controller.ts    # Ollama API endpoints
│   │   │   ├── openai.controller.ts    # OpenAI API endpoints
│   │   │   └── perplexity.controller.ts # Perplexity API endpoints
│   │   ├── routes/               # Route definitions
│   │   │   ├── index.ts                # Main router (aggregates all routes)
│   │   │   ├── app.routes.ts           # Custom app routes
│   │   │   ├── claude.routes.ts        # Claude routes
│   │   │   ├── ollama.routes.ts        # Ollama routes
│   │   │   ├── openai.routes.ts        # OpenAI routes
│   │   │   └── perplexity.routes.ts    # Perplexity routes
│   │   ├── middleware/           # HTTP middleware
│   │   │   ├── auth.middleware.ts      # Authentication middleware
│   │   │   ├── jwt.middleware.ts       # JWT token validation
│   │   │   ├── error.middleware.ts     # Error handling
│   │   │   └── nocors.middleware.ts    # CORS headers
│   │   └── types/                # API type definitions
│   │
│   ├── providers/                # LLM provider integrations
│   │   ├── ai.provider.ts              # Base provider interface
│   │   ├── auditors.ts                 # Request/response auditing
│   │   ├── base.translator.ts          # Base translation logic
│   │   ├── base.stream.translator.ts   # Base streaming translation
│   │   ├── claude/               # Anthropic Claude integration
│   │   │   ├── claude.translator.ts
│   │   │   ├── claude.auditor.ts
│   │   │   ├── claude.response.factory.ts
│   │   │   ├── translators/            # Request/response translators
│   │   │   ├── types/                  # Claude type definitions
│   │   │   ├── validators/             # ArkType validators
│   │   │   └── utils/                  # Helper utilities
│   │   ├── holo/                 # Holo unified format
│   │   ├── ollama/               # Ollama integration
│   │   ├── openai/               # OpenAI integration
│   │   ├── perplexity/           # Perplexity integration
│   │   └── types/                # Shared provider types
│   │
│   ├── services/                 # Business logic services
│   │   ├── admin.service.ts            # Admin operations
│   │   ├── audit.service.ts            # Audit logging service
│   │   ├── evaluator.service.ts        # Response evaluation
│   │   ├── init.service.ts             # Application initialization
│   │   ├── queue.service.ts            # RabbitMQ queue management
│   │   ├── provider.service.ts         # Provider orchestration
│   │   ├── response.service.ts         # Response handling
│   │   └── stream.service.ts           # Streaming response handling
│   │
│   ├── servers/                  # Server processes
│   │   ├── worker.server.ts            # Worker server (processes queue requests)
│   │   ├── audit.server.ts             # Audit server (logging/auditing)
│   │   ├── analysis.server.ts          # Analysis server (analytics)
│   │   └── mixins/                     # Server mixins (shared functionality)
│   │
│   ├── admin/                    # Admin/configuration layer
│   │   ├── services/             # Admin services
│   │   ├── types/                # Admin type definitions
│   │   └── validators/           # Admin validators
│   │
│   ├── db/                       # Database layer
│   │   ├── app.db.ts                   # Database connection & query interface
│   │   ├── model.db.ts                 # Model data access
│   │   ├── provider.db.ts              # Provider data access
│   │   ├── request.db.ts               # Request data access
│   │   ├── response.db.ts              # Response data access
│   │   ├── evaluator.db.ts             # Evaluator data access
│   │   └── types/                      # Database type definitions
│   │
│   ├── cache/                    # In-memory caching layer
│   │   ├── organization.cache.ts       # Organization cache
│   │   ├── types/                      # Cache type definitions
│   │   └── validators/                 # Cache validators (ArkType)
│   │
│   ├── guards/                   # Request guards/filters
│   │   └── pipeline.ts                 # Request pipeline guards
│   │
│   ├── types/                    # Shared type definitions
│   │   └── mixin.types.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts                   # Winston logger
│   │   ├── error-messages.ts           # Error message constants
│   │   └── ...
│   │
│   ├── public/                   # Static assets
│   │
│   ├── app.ts                    # Main API server entry point
│   └── env.ts                    # Environment configuration
│
├── tests/                        # Test suites
│   └── integration/              # Integration tests
├── dist/                         # Compiled JavaScript output
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
├── logs/                         # Application logs
├── .bmad/                        # BMad Method artifacts
├── .claude/                      # Claude Code configuration
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── jest.config.cjs               # Jest test configuration
├── docker-compose.yml            # Docker Compose setup
└── Dockerfile                    # Docker image
```

---

## Architecture Analysis

### Summary

The project follows a **hybrid architecture** that mixes concerns across directories. While there are clear separations in some areas, many directories contain mixed responsibilities (pure logic + runtime dependencies).

```
src/
├── types/           ⚠️  MIXED - Core types + factories with DI
├── cache/           ⚠️  MIXED - Domain types + runtime caching
├── providers/       ✅  MOSTLY CORE - Translation logic (minimal I/O)
├── admin/           ⚠️  MIXED - Domain logic + Express dependencies
├── utils/           ✅  CORE - Pure utilities
├── guards/          ⚠️  UNKNOWN - Need analysis
├── api/             ❌  SERVER - Express routes, controllers, middleware
├── services/        ❌  SERVER - I/O operations (RabbitMQ, DB, streams)
├── db/              ❌  SERVER - PostgreSQL/Prisma queries
├── servers/         ❌  SERVER - Server instances and mixins
├── env.ts           ❌  SERVER - Environment/process.env access
└── app.ts           ❌  SERVER - Express application entry point
```

### Detailed Directory Analysis

#### 1. `/types` - ⚠️ MIXED (Core + Runtime)

**Purpose**: Central type definitions and worker request/response models

**Files**:
- `worker.types.ts` - Core interfaces (LLMWorkerRequest, LLMWorkerResponse)
- `worker.request.factory.ts` - Factory with DI (tsyringe) ❌
- `worker.response.factory.ts` - Factory with DI (tsyringe) ❌
- `worker.validators.ts` - ArkType validators ✅
- `config.types.ts` - Configuration types ✅
- `evaluator.types.ts`, `evaluator-pr.types.ts` - Domain types ✅
- `class.logger.ts` - Logger base class (logging abstraction) ⚠️
- `index.ts` - Barrel export

**Classification**:
- **Core**: Type definitions, interfaces, validators (70%)
- **Server**: Factories with DI container, logger with I/O (30%)

**Issues**:
- Factories should not be in `/types` - should be in `/services` or `/domain`
- Mixing pure types with factory implementations

---

#### 2. `/cache` - ⚠️ MIXED (Domain + Runtime)

**Purpose**: Organization, provider, application cache structures

**Subdirectories**:
- `types/` - Domain models (Organization, Provider, Application, Model, etc.) ✅
- `validators/` - ArkType validators ✅
- `organization.cache.ts` - In-memory Map-based cache (pure TS, no I/O) ✅

**Classification**:
- **Core**: Types, validators, cache data structure (90%)
- **API/Server**: Loaders (if they exist) (10%)

**Issues**:
- Good separation overall
- `/cache/types` could be `/domain/models` or `/core/models`

---

#### 3. `/providers` - ✅ MOSTLY CORE (Translation Logic)

**Purpose**: Provider abstraction layer with Holo translation system

**Structure**:
```
providers/
├── types/                  ✅ Core interfaces
├── validators.ts           ✅ Validation logic
├── base.translator.ts      ✅ Abstract translator base
├── base.stream.translator.ts ✅ Abstract stream translator
├── holo/                   ✅ Canonical format (pure types + factories)
│   ├── types/
│   ├── validators/
│   ├── holo.translator.ts
│   ├── holo.request.factory.ts
│   └── holo.response.factory.ts
├── claude/                 ⚠️ Provider impl (minimal I/O via SDK)
│   ├── types/
│   ├── validators/
│   ├── translators/
│   ├── claude.translator.ts
│   ├── claude.provider.ts       ❌ Uses @anthropic-ai/sdk
│   └── claude.auditor.ts        ⚠️ Creates audit records
├── openai/                 ⚠️ Similar to Claude
├── ollama/                 ⚠️ Similar to Claude
└── perplexity/             ⚠️ Similar to Claude
```

**Classification**:
- **Core**: Types, validators, translators, factories (85%)
- **API**: Provider SDK clients (claude.provider.ts uses Anthropic SDK) (15%)

**Key Insight**:
- **Translators are stateless and pure** - bidirectional Holo ↔ Provider mapping
- **Providers have SDK dependencies** but minimal I/O (just API calls)
- Could split into:
  - `/core/providers` - Translation logic
  - `/api/provider-clients` - SDK wrappers

---

#### 4. `/admin` - ⚠️ MIXED (Domain + Express)

**Purpose**: Organization management, guards, request processing

**Structure**:
```
admin/
├── types/              ✅ Auth, Guard, Config types
├── validators/         ✅ ArkType validators
└── services/
    ├── organization.service.ts         ⚠️ Domain logic + cache
    ├── organization.cache.service.ts   ⚠️ Domain logic + cache
    ├── guard.service.ts                ⚠️ Uses ResponseService (I/O)
    ├── request.service.ts              ❌ Uses Express Request/Response
    ├── token.service.ts                ⚠️ Domain logic
    ├── config.service.ts               ⚠️ Domain + file/queue I/O
    ├── config.file.loader.ts           ❌ fs module (file I/O)
    └── config.queue.loader.ts          ❌ RabbitMQ dependency
```

**Classification**:
- **Core**: Types, validators (40%)
- **Server**: Services with Express/RabbitMQ/file I/O (60%)

**Issues**:
- `request.service.ts` directly depends on Express `Request` and `Response` types
- Should use adapter pattern to decouple from Express
- Guard service has business logic mixed with I/O

---

#### 5. `/utils` - ✅ CORE (Pure Utilities)

**Purpose**: Pure utility functions

**Files**:
- `parsers.ts` - String/number/boolean parsing ✅
- `pick.defined.ts` - Object filtering ✅
- `error-messages.ts` - Error message builders ✅
- `chat-message-adapters.ts` - Message transformation ✅
- `logger.ts` - Winston logger setup ❌ (I/O)

**Classification**:
- **Core**: Parsers, object utilities (90%)
- **Server**: Logger with file/console I/O (10%)

**Note**: `logger.ts` should be in `/services` or `/infrastructure`

---

#### 6. `/api` - ❌ SERVER (Express Layer)

**Purpose**: HTTP layer - routes, controllers, middleware

**Structure**:
```
api/
├── types/
│   └── index.ts            ⚠️ Extends Express.Request with auth
├── middleware/
│   ├── jwt.middleware.ts   ❌ Express middleware
│   ├── auth.middleware.ts  ❌ Express middleware
│   ├── error.middleware.ts ❌ Express error handler
│   └── nocors.middleware.ts ❌ Express middleware
├── controllers/
│   ├── base.controller.ts  ❌ Express Request/Response
│   ├── openai.controller.ts ❌
│   ├── claude.controller.ts ❌
│   ├── ollama.controller.ts ❌
│   └── app.controller.ts   ❌
└── routes/
    ├── openai.routes.ts    ❌ Express Router
    ├── claude.routes.ts    ❌
    └── ...
```

**Classification**: 100% Server/Runtime

**Good Separation**: Clear HTTP boundary layer

---

#### 7. `/services` - ❌ SERVER (I/O Operations)

**Purpose**: Infrastructure services (queues, streams, DB operations)

**Files**:
- `queue.service.ts` - RabbitMQ (amqplib) ❌
- `response.service.ts` - RabbitMQ + Stream coordination ❌
- `stream.service.ts` - Node.js Transform streams ❌
- `audit.service.ts` - PostgreSQL writes ❌
- `provider.service.ts` - Provider registry (mostly core) ⚠️
- `init.service.ts` - System initialization ❌
- `admin.service.ts` - Admin operations ❌
- `evaluator.service.ts` - Evaluation processing ❌
- `evaluators/` - Evaluation implementations ⚠️

**Classification**: 95% Server (I/O-heavy)

**Note**: Some evaluator logic could be extracted to `/core`

---

#### 8. `/db` - ❌ SERVER (Database Layer)

**Purpose**: PostgreSQL query implementations

**Files**:
- `app.db.ts` - Database connection (pg) ❌
- `provider.db.ts` - Provider CRUD ❌
- `model.db.ts` - Model CRUD ❌
- `request.db.ts` - Request audit writes ❌
- `response.db.ts` - Response audit writes ❌
- `evaluator.db.ts` - Evaluator CRUD ❌
- `types/index.ts` - DB result types ⚠️

**Classification**: 100% Server/Runtime

**Good**: Clear data access layer

---

#### 9. `/servers` - ❌ SERVER (Runtime Instances)

**Purpose**: Server implementations and composition

**Files**:
- `base.server.ts` - Abstract server base class ❌
- `worker.server.ts` - Worker node implementation ❌
- `audit.server.ts` - Audit service implementation ❌
- `analysis.server.ts` - Analysis service implementation ❌
- `mixins/` - Composition mixins (withDB, withQueue, withAdmin, withStats) ❌

**Classification**: 100% Server/Runtime

**Pattern**: Mixin-based composition (interesting architectural choice)

---

## Critical Directories

### `/src/api` - HTTP API Layer
**Purpose:** Handles incoming HTTP requests, routes them to appropriate controllers, and returns responses.

**Key Files:**
- `app.ts`: Main Express application setup, middleware configuration, health endpoint
- `routes/index.ts`: Aggregates all API routes under `/api` base path
- `controllers/*.controller.ts`: Request handlers for each provider
- `middleware/jwt.middleware.ts`: JWT authentication and token validation

**Entry Points:**
- Main API Server: `src/app.ts` (PORT 3000 by default)

---

### `/src/providers` - Multi-Provider Support
**Purpose:** Translates between Holo's unified format and provider-specific APIs. Each provider has dedicated translators for bidirectional conversion.

**Providers:**
- **OpenAI**: GPT models, chat completions, streaming
- **Claude**: Anthropic Claude models, messages API
- **Ollama**: Local LLM hosting, Ollama API format
- **Perplexity**: Perplexity API integration
- **Holo**: Internal unified format

**Pattern:**
```
provider/
├── {provider}.translator.ts     # Main translator
├── {provider}.auditor.ts        # Request/response auditing
├── translators/                 # Bidirectional format conversion
│   ├── request.translators.ts
│   ├── response.translators.ts
│   └── streaming/               # Streaming event translation
├── types/                       # TypeScript types
└── validators/                  # ArkType runtime validators
```

---

### `/src/services` - Business Logic
**Purpose:** Core business logic for queue management, provider orchestration, response handling, and auditing.

**Key Services:**
- `queue.service.ts`: RabbitMQ integration, request/response queues
- `provider.service.ts`: Provider selection and orchestration
- `response.service.ts`: Response consumer, streaming handler
- `audit.service.ts`: Audit logging to PostgreSQL
- `init.service.ts`: Application startup and queue initialization

---

### `/src/servers` - Multi-Server Architecture
**Purpose:** Separate server processes for different responsibilities.

**Servers:**
1. **API Server** (`src/app.ts`): Handles HTTP requests, enqueues to RabbitMQ
2. **Worker Server** (`src/servers/worker.server.ts`): Consumes queue, calls providers, returns responses
3. **Audit Server** (`src/servers/audit.server.ts`): Logs requests/responses to database
4. **Analysis Server** (`src/servers/analysis.server.ts`): Analytics and reporting

**Mixins:**
- `withQueue`: Adds RabbitMQ queue functionality
- `withStats`: Adds statistics collection

---

### `/src/admin` - Configuration Management
**Purpose:** Handles configuration loading (file or queue-based), organization caching, and token management.

**Key Components:**
- `config.service.ts`: Central configuration manager, emits events
- `config.file.loader.ts`: Loads config from JSON file
- `config.queue.loader.ts`: Loads config from RabbitMQ queue
- `organization.cache.service.ts`: In-memory organization cache
- `token.service.ts`: JWT generation and validation

---

### `/src/db` - Database Layer
**Purpose:** PostgreSQL data access layer with type-safe queries.

**Tables:**
- `models`: Available LLM models
- `providers`: Provider configurations
- `applications`: Application configurations
- `llm_requests`: Incoming requests
- `llm_responses`: Provider responses
- `evaluators`: Response evaluators
- `evaluator_data`: Evaluation results
- `prompts`: Reusable prompts
- `analysis_results`: Analysis data

**Key Class:**
- `AppDB`: Connection pooling, query interface with type safety

---

## Entry Points & Runtime Processes

### Main API Server
**File:** `src/app.ts`
**Command:** `npm start` or `npm run api:dev`
**Port:** 3000 (configurable via `PORT` env var)

**Startup Flow:**
1. Load environment variables
2. Initialize Express app
3. Register middleware (CORS, error handling, body parser)
4. Wait for initial configuration (file or queue)
5. Initialize services (queue, response consumer)
6. Register API routes
7. Start HTTP server

---

### Worker Server
**File:** `src/servers/worker.server.ts`
**Command:** `npm run start-worker` or `npm run worker:dev`

**Responsibilities:**
- Consume requests from RabbitMQ
- Translate to provider format
- Call provider API
- Translate response back
- Send response to response queue

---

### Audit Server
**File:** `src/servers/audit.server.ts`
**Command:** `npm run start-audit` or `npm run audit:dev`

**Responsibilities:**
- Log requests to `llm_requests` table
- Log responses to `llm_responses` table
- Track usage metrics and costs

---

### Analysis Server
**File:** `src/servers/analysis.server.ts`
**Command:** `npm run start-analysis` or `npm run analysis:dev`

**Responsibilities:**
- Analytics processing
- Report generation
- Performance metrics

---

## Design Patterns

### Architectural Patterns

1. **Dependency Injection**: TSyringe used extensively
```typescript
@injectable()
export class WorkerServer extends withAdmin(withDB(withStats(BaseServer))) { ... }
```

2. **Mixin Composition**: Server functionality composed via mixins
```typescript
class WorkerServer extends withAdmin(withDB(withStats(BaseServer))) { ... }
```

3. **Factory Pattern**: Request/Response factories
```typescript
WorkerRequestFactory.fromRequest(...)
WorkerResponseFactory.create(...)
```

4. **Translator Pattern**: Bidirectional Holo ↔ Provider translation
```typescript
abstract class BaseTranslator<THolo, TProvider> {
    abstract toHolo(source: TProvider): Promise<Partial<THolo>>;
    abstract fromHolo(source: THolo): Promise<Partial<TProvider>>;
}
```

5. **Hub-and-Spoke**: Holo as universal format (N translations vs N²)

6. **Validator-First**: ArkType validators enforce contracts at runtime

7. **Repository Pattern**: Database access abstracted through `*DB` classes

8. **Observer Pattern**: ConfigService emits events (`config:initialized`, `config:updated`)

---

## Integration Points

### RabbitMQ Queues
- **Request Queue**: API server → Worker server
- **Response Queue**: Worker server → API server
- **Audit Queue**: Worker server → Audit server
- **Config Queue**: External config service → API/Worker servers

### PostgreSQL Database
- **Connection**: Managed by `AppDB` class
- **Pool Size**: Configurable via environment
- **Transaction Support**: Available via `AppDB.transaction()`

### Provider APIs
- **OpenAI**: HTTPS to OpenAI API
- **Claude**: HTTPS to Anthropic API
- **Ollama**: HTTP to local Ollama instance (default: http://localhost:11434)
- **Perplexity**: HTTPS to Perplexity API

---

## Architectural Concerns Separation

### ✅ CORE (Pure TypeScript - No Node/DOM/I/O)
```
src/
├── utils/parsers.ts
├── utils/pick.defined.ts
├── utils/error-messages.ts
├── utils/chat-message-adapters.ts
├── cache/types/**
├── cache/validators/**
├── cache/organization.cache.ts
├── providers/types/**
├── providers/validators.ts
├── providers/base.translator.ts
├── providers/base.stream.translator.ts
├── providers/holo/types/**
├── providers/holo/validators/**
├── providers/holo/*.factory.ts
├── providers/holo/holo.translator.ts
├── providers/claude/types/**
├── providers/claude/validators/**
├── providers/claude/translators/**
├── providers/claude/utils/**
├── providers/openai/types/**
├── providers/openai/validators/**
├── providers/openai/translators/**
├── providers/ollama/types/**
├── providers/ollama/validators/**
├── providers/ollama/translators/**
├── admin/types/**
├── admin/validators/**
└── types/*.types.ts (interfaces only)
```

### ⚠️ API (SDK/Clients, Serialization, Shared Contracts)
```
src/
├── providers/claude/claude.provider.ts       (uses @anthropic-ai/sdk)
├── providers/openai/openai.provider.ts       (uses openai SDK)
├── providers/ollama/ollama.provider.ts       (uses ollama SDK)
├── providers/perplexity/perplexity.provider.ts
├── providers/*/auditor.ts                    (audit record creation)
├── admin/services/organization.service.ts    (domain logic)
├── admin/services/token.service.ts           (domain logic)
└── services/provider.service.ts              (provider registry)
```

### ❌ SERVER (Runtime - Express/Node/DB/Queue/File I/O)
```
src/
├── app.ts
├── env.ts
├── api/**                  (Express routes, controllers, middleware)
├── services/**             (RabbitMQ, streams, audit, DB operations)
├── db/**                   (PostgreSQL queries)
├── servers/**              (Server instances + mixins)
├── admin/services/
│   ├── request.service.ts  (Express dependencies)
│   ├── guard.service.ts    (I/O operations)
│   ├── config.*.loader.ts  (File/queue I/O)
│   └── config.service.ts   (Mixed)
├── types/
│   ├── *.factory.ts        (DI dependencies)
│   └── class.logger.ts     (Logging I/O)
└── utils/logger.ts         (Winston setup)
```

---

## Recommendations for Clean Architecture

### Proposed Structure

```
src/
├── core/                           ✅ Pure TS (no I/O, no Node)
│   ├── domain/
│   │   ├── models/                 (Organization, Provider, Application, etc.)
│   │   ├── guards/                 (Guard logic)
│   │   └── validators/             (ArkType validators)
│   ├── providers/
│   │   ├── types/
│   │   ├── holo/                   (Universal format)
│   │   ├── translators/            (Claude, OpenAI, Ollama translators)
│   │   └── base/                   (BaseTranslator, BaseStreamTranslator)
│   ├── utils/                      (Pure utilities)
│   └── types/                      (Shared interfaces)
│
├── api/                            ⚠️ SDK clients, contracts
│   ├── contracts/                  (Request/Response DTOs)
│   ├── providers/
│   │   ├── claude.client.ts        (Anthropic SDK wrapper)
│   │   ├── openai.client.ts        (OpenAI SDK wrapper)
│   │   └── ollama.client.ts        (Ollama SDK wrapper)
│   └── serializers/                (JSON serialization)
│
├── server/                         ❌ Node runtime, I/O, Express
│   ├── http/
│   │   ├── routes/                 (Express routes)
│   │   ├── controllers/            (Request handlers)
│   │   ├── middleware/             (Express middleware)
│   │   └── app.ts                  (Express app setup)
│   ├── infrastructure/
│   │   ├── db/                     (PostgreSQL, Prisma)
│   │   ├── queue/                  (RabbitMQ)
│   │   ├── cache/                  (In-memory cache impl)
│   │   └── logging/                (Winston setup)
│   ├── services/                   (Application services)
│   │   ├── request.service.ts      (Orchestration)
│   │   ├── response.service.ts     (Response handling)
│   │   ├── stream.service.ts       (SSE streaming)
│   │   └── admin.service.ts        (Admin operations)
│   ├── servers/                    (Server instances)
│   │   ├── api.server.ts
│   │   ├── worker.server.ts
│   │   ├── audit.server.ts
│   │   └── mixins/
│   └── env.ts                      (Environment config)
│
└── shared/                         ⚠️ Boundary types
    └── adapters/                   (Domain ↔ Infrastructure adapters)
```

### Benefits of Reorganization

1. **Clear Boundaries**:
   - `/core` can be extracted as standalone library
   - `/core` has zero Node.js dependencies
   - Can be reused in browser, Deno, Bun, etc.

2. **Testability**:
   - Core logic testable without mocking I/O
   - Provider translators testable in isolation
   - HTTP layer can be swapped (Express → Fastify)

3. **Dependency Flow**:
   - `server` depends on `api` depends on `core`
   - `core` depends on nothing (pure TS)
   - Clear unidirectional dependency graph

4. **Type Safety**:
   - `/core/types` has no Express.Request/Response
   - Use DTOs/adapters at boundaries

---

## Current Pain Points

### 1. Express Leaking into Domain
```typescript
// admin/services/request.service.ts
async processRequest(
    providerType: ProviderType,
    type: RequestType,
    req: HttpApiRequest,      // ❌ Express Request
    res: Response             // ❌ Express Response
)
```

**Fix**: Use adapter pattern
```typescript
// core/domain/services/request.service.ts
async processRequest(
    request: DomainRequest,    // ✅ Domain type
    auth: AuthContext          // ✅ Domain type
): Promise<DomainResponse>

// server/http/adapters/request.adapter.ts
function toHttpResponse(domainResponse: DomainResponse, res: Response): void
```

### 2. Factories in `/types`
- `worker.request.factory.ts` uses DI (tsyringe) → should be in `/services` or `/domain/factories`

### 3. Logger in `/utils`
- `logger.ts` has file I/O → should be in `/server/infrastructure/logging`
- Core logic shouldn't depend on Winston directly

### 4. Mixed Concerns in `/admin/services`
- Some services are pure domain logic (token.service.ts)
- Others have I/O dependencies (config.file.loader.ts)
- Should split into domain services vs infrastructure services

---

## Migration Path (Incremental)

### Phase 1: Extract Pure Core
1. Move `/cache/types` → `/core/domain/models`
2. Move `/providers/types` → `/core/providers/types`
3. Move translators → `/core/providers/translators`
4. Move validators → `/core/domain/validators`
5. Move pure utils → `/core/utils`

### Phase 2: Create API Boundary
1. Extract provider SDK wrappers → `/api/providers`
2. Create DTOs → `/api/contracts`
3. Remove Express deps from domain services

### Phase 3: Organize Server
1. Move `/services` → `/server/services`
2. Move `/db` → `/server/infrastructure/db`
3. Move queue code → `/server/infrastructure/queue`
4. Keep `/api` as HTTP layer

### Phase 4: Clean Dependencies
1. Add path aliases in tsconfig.json
2. Enforce import rules (ESLint)
3. Ensure no `/core` → `/server` imports

---

## Conclusion

**Current State**: Hybrid architecture with ~40% core, 60% server mixed together

**Strengths**:
- Good translator/provider abstraction
- Clear HTTP boundary in `/api`
- Dependency injection throughout
- Validator-first approach

**Weaknesses**:
- Express leaking into domain layer
- Factories mixed with types
- No clear core/server separation
- Hard to extract reusable logic

**Recommendation**: Incremental migration to clean architecture with clear `/core`, `/api`, `/server` boundaries.
