# HoloKai Holo

A scalable, distributed LLM proxy server built with TypeScript that provides unified access to multiple Large Language Model providers through a plugin-based architecture. The system uses RabbitMQ for distributed processing and PostgreSQL for audit logging.

## 🏗️ Architecture Overview

Holo follows a distributed microservices architecture with queue-based request/response handling and an extensible plugin system:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   RabbitMQ      │    │  Worker Servers │
│   (Express)     │◄──►│   (Message      │◄──►│   + Plugins     │
│   + Auth        │    │    Broker)      │    │   (Provider)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌────────▼────────┐
         │                       │              │     Plugins     │
         │                       │              │  Wire Adapters  │
         │                       │              │    Auditors     │
         │                       │              │     Routes      │
         │                       │              └────────┬────────┘
         │                       │                       │
         │                       │       ┌───────────────┼───────────────┐
         │                       │       │               │               │
         ▼                       ▼       ▼               ▼               ▼
┌─────────────────┐    ┌─────────────────┐  ┌─────────┐   ┌─────────┐   ┌─────────┐
│   PostgreSQL    │    │   Audit Server  │  │ OpenAI  │   │ Claude  │   │ Ollama  │
│   (Database)    │    │   (Logging)     │  │   API   │   │   API   │   │   API   │
└─────────────────┘    └─────────────────┘  └─────────┘   └─────────┘   └─────────┘
```

### Core Components

1. **API Server** (`src/app.ts`): Express.js application handling incoming requests
   - JWT authentication and app slug validation
   - Parses requests and enforces authorization guards
   - Submits requests to message queue
   - Streams responses from queue back to clients via SSE

2. **Auth Middleware** (`src/admin/services/auth.service.ts`): App-level authorization
   - Validates JWT tokens and extracts user permissions
   - Verifies user's App slug has access to requested providers, models, guards
   - Validates before request enters queue

3. **Guard System** (`src/admin/`): Policy enforcement on LLM requests
   - Runs synchronous guard checks before queueing
   - Attaches guard results to worker request
   - Smart error formatting (JSON for API calls, natural language for chat)

4. **Request Queue** (RabbitMQ): Distributed work distribution
   - API publishes to request exchange (fanout)
   - Workers and audit server consume from queue
   - Each request tagged with unique requestId and sourceId

5. **Worker Server** (`src/servers/worker.server.ts`):
   - Loads plugins at startup (providers, wire adapters, auditors)
   - Consumes requests from request queue
   - Matches provider by provider name from loaded plugins
   - Enforces guard results (blocks unauthorized requests)
   - Processes request via plugin's request handler
   - Converts provider responses to wire format via plugin's wire adapter
   - Publishes wire chunks to response exchange

6. **Audit Server** (`src/servers/audit.server.ts`): Compliance logging
   - Consumes from audit request queue (all incoming requests)
   - Consumes from audit response queue (all responses)
   - Uses plugin auditors for native logging format
   - Writes to PostgreSQL for compliance trail

7. **Response Service** (`src/services/response.service.ts`):
   - Creates async event queue per requestId
   - Subscribes to response exchange filtered by sourceId
   - Receives wire chunks from queue
   - Sets HTTP headers/status from first wire chunk
   - Pipes subsequent chunks to HTTP response stream

8. **Plugin System** (`plugins/`):
   - **Wire Adapters**: Convert provider events to wire format for HTTP streaming
   - **Auditors**: Provide native logging format for requests/responses
   - **Request Handlers**: Process requests for specific providers
   - **Routes**: Define provider-specific API endpoints
   - Loaded by both API server (for routes) and worker servers (for processing)
   - See [SDK Documentation](plugins/sdk/README.md) for plugin development

---

## 🔄 Request Lifecycle

The following diagram shows the complete request/response flow:

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. HTTP Request (POST /openai/my-app/chat/completions)
     ▼
┌────────────────────────────────────────────────┐
│          API Server (app.controller.ts)        │
├────────────────────────────────────────────────┤
│  2. App Controller extracts:                   │
│     - provider (openai)                        │
│     - appSlug (my-app)                         │
│     - Sets req.appSlug for auth                │
│     - Rewrites URL to /api/openai/...          │
└────┬───────────────────────────────────────────┘
     │ 3. Route to provider handler (from plugin routes)
     ▼
┌────────────────────────────────────────────────┐
│         Auth Middleware (jwt.middleware.ts)    │
├────────────────────────────────────────────────┤
│  4. JWT Middleware (auth.service.ts)           │
│     └─► Validates JWT token                    │
│     └─► Decodes: organizationId, userId,       │
│         appSlugs                               │
│     └─► Verifies appSlug in user's appSlugs   │
│     └─► Loads app from cache                   │
│     └─► Validates app.providerType matches     │
│     └─► Checks app has providers, models,      │
│         guards configured                      │
│     └─► Adds auth object to request            │
└────┬───────────────────────────────────────────┘
     │ 5. Parse request params
     │    Create provider-specific request
     ▼
┌────────────────────────────────────────────────┐
│         Guard Execution (admin/guards)         │
├────────────────────────────────────────────────┤
│  6. Run app guards on LLM request (if any)     │
│     └─► Execute guard prompts as sync requests │
│     └─► Validate request against app rules     │
│     └─► Attach guard results to request        │
└────┬───────────────────────────────────────────┘
     │ 7. Open response stream (response.service)
     │    Generate unique requestId, use sourceId
     ▼
┌────────────────────────────────────────────────┐
│    Queue Service (queue.service.ts)            │
├────────────────────────────────────────────────┤
│  8. Publish request to request exchange        │
│     └─► Request contains guard results         │
│     └─► Request contains unique requestId      │
│     └─► Request contains sourceId (api-server) │
└────┬───────────────────────────────────────────┘
     │
     │ RabbitMQ Request Exchange (fanout)
     │
     ├──────────────────┬─────────────────────────┐
     │                  │                         │
     ▼                  ▼                         ▼
┌─────────────────────────────────┐  ┌──────────────────────┐
│  Worker Server (worker.server)  │  │   Audit Server       │
│                                 │  │ (audit.server.ts)    │
├─────────────────────────────────┤  ├──────────────────────┤
│  9. Consume request from queue  │  │ • Listens on request │
│ 10. Load plugins at startup:    │  │   exchange (audits   │
│     - Providers                 │  │   incoming requests) │
│     - Wire adapters             │  │ • Uses plugin        │
│     - Auditors                  │  │   auditors for       │
│     - Request handlers          │  │   native logging     │
│ 11. Match provider by name      │  │ • Writes to          │
│ 12. Check guard results:        │  │   PostgreSQL         │
│     ├─► If guards FAILED:       │  └──────────────────────┘
│     │   └─► Generate error      │
│     │   └─► Block provider call │
│     └─► If guards PASSED:       │
│         └─► Process via plugin  │
│ 13. Convert events to wire      │
│     format via wire adapter     │
│ 14. Publish wire chunks to      │
│     response exchange           │
│     └─► Routing key = sourceId  │
└─────┬───────────────────────────┘
      │
      │ RabbitMQ Response Exchange (direct)
      │
      ├──────────────────┬─────────────────────────┐
      │                  │                         │
      ▼                  ▼                         ▼
┌─────────────────────────────────┐  ┌──────────────────────┐
│  API Server (response.service)  │  │   Audit Server       │
│                                 │  │ (audit.server.ts)    │
├─────────────────────────────────┤  ├──────────────────────┤
│ 15. Listen on response exchange │  │ • Listens on response│
│     (queue: responseQueue.      │  │   exchange (routing  │
│     {sourceId})                 │  │   key: audit)        │
│ 16. Filter by sourceId routing  │  │ • Logs all responses │
│ 17. Pick up wire chunks from    │  │   to PostgreSQL      │
│     queue                       │  └──────────────────────┘
│ 18. Push to async event queue   │
│     for this requestId          │
└─────┬───────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────────┐
│      Stream Service (stream.service.ts)        │
├────────────────────────────────────────────────┤
│ 19. Read from async event queue               │
│ 20. First chunk: Set HTTP status and headers  │
│ 21. Subsequent chunks: Write to HTTP response │
│ 22. On wire.done: End HTTP response           │
│ 23. Handle client disconnect                  │
└────┬───────────────────────────────────────────┘
     │ 24. Server-Sent Events (SSE)
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### Key Lifecycle Stages

1. **Request Routing**: App controller extracts provider, appSlug, and rewrites URL
2. **Authentication**: JWT middleware validates token, extracts user permissions, verifies appSlug access
3. **App Slug Validation**: Checks user's app has providers, models, guards configured
4. **Request Parsing**: Controller creates provider-specific request with metadata
5. **Authorization**: App-level guards validate request against policies
6. **Response Setup**: Response service creates async event queue and subscribes to wire chunks
7. **Request Queueing**: Request (with guard results) published to RabbitMQ request exchange (fanout)
8. **Request Auditing**: Audit server consumes request and logs to PostgreSQL
9. **Worker Processing**:
   - Worker consumes request from queue
   - Loads plugin for provider (at startup)
   - Checks guard results
   - **Guards Failed**: Generate error in wire format, send to response queue, audit, stop
   - **Guards Passed**: Process via plugin's request handler
   - Convert provider events to wire format via plugin's wire adapter
10. **Wire Publishing**: Worker publishes wire chunks to response exchange with routing key = sourceId
11. **Response Auditing**: Audit server consumes response (routing key: audit) and logs to PostgreSQL
12. **API Response Handling**: API server picks up wire chunks from queue (filtered by sourceId)
13. **Stream Piping**: Response service pipes wire chunks to HTTP response stream
    - First chunk: Sets HTTP status and headers
    - Subsequent chunks: Writes body
    - On wire.done: Ends response

### Guard System

Guards provide multi-stage authorization with execution split between API and Worker servers:

#### Guard Execution (API Server)
Guards run **after** authentication but **before** request queueing:

- **Input**: LLM request + auth object (from JWT middleware)
- **Process**: Execute guard prompts as synchronous LLM requests
- **Output**: Guard results attached to worker request and sent to queue
- **Purpose**: Pre-validate user permissions for apps/providers/models

#### Guard Enforcement (Worker Server)
Workers validate guard results **before** calling provider APIs:

- **Input**: Worker request with attached guard results from queue
- **Guard Check**:
  - **If Passed**: Forward request to plugin's request handler → provider API
  - **If Failed**: Generate provider-native error response without calling provider
- **Response Format**:
  - **API Calls** (with `response_format: json_schema|json_object`): Structured JSON errors
  - **Chat Clients**: Natural language error messages
  - Errors returned in wire format via plugin's wire adapter
- **Purpose**: Prevent unauthorized API calls while maintaining provider compatibility

This two-stage approach ensures:
1. **Early validation**: Guards execute at API server for quick feedback
2. **Enforcement at worker**: Guard results checked before expensive provider API calls
3. **Smart error formatting**: JSON for programmatic calls, natural language for chat
4. **Provider-native errors**: Failures returned in format matching the requested provider
5. **Cost savings**: Blocked requests never reach paid provider APIs

### Response Stream Coordination

The response flow uses a pub/sub pattern with requestId correlation and sourceId routing:

1. **Before queueing**: API server creates async event queue and generates unique `requestId`
2. **Request publishing**: API server publishes request to request exchange with `requestId` and `sourceId`
3. **Response listening**: API server subscribes to response exchange filtering by `sourceId` routing key
4. **Worker processing**: Worker receives request, processes via plugin, converts events to wire format
5. **Wire publishing**: Worker publishes wire chunks to response exchange with routing key = `sourceId`
6. **API picks up**: Response service consumes from queue `responseQueue.{sourceId}`
7. **Stream piping**: Pushes wire chunks to async event queue for this `requestId`
8. **HTTP delivery**: Reads from queue and pipes to HTTP response stream
9. **Stream completion**: When `wire.done === true`, response stream closed and client connection terminated

**Key Flow**: Provider → Worker (via plugin) → Wire Adapter → Response Exchange → API Server (via queue) → HTTP Stream → Client

### Audit Service

The audit server provides comprehensive logging for compliance and monitoring:

- **Dual Exchange Monitoring**: Listens on both request and response exchanges
- **Request Auditing**: Captures all incoming requests with full payload and guard results
- **Response Auditing**: Captures all provider responses including streaming chunks
- **Native Logging**: Uses plugin auditors to log in provider-specific format
- **Database Persistence**: Writes audit trails to PostgreSQL with timestamps and metadata
- **Independent Operation**: Runs as separate service for reliability and scalability

---

## 🚀 Key Features

### Plugin Architecture

Holo uses a modular plugin system where all provider integrations are loaded dynamically:

- **Plugin Discovery**: Scans `node_modules/@holokai` scope for plugin packages at startup
- **Plugin Loading**: Dynamically imports plugins and validates plugin interface
- **Plugin Registration**: Registers plugins with provider registry and route system
- **Components Provided by Plugins**:
  - **Wire Adapters**: Convert provider events to wire format for HTTP streaming
  - **Auditors**: Provide native logging format for compliance
  - **Request Handlers**: Process requests for specific providers
  - **Routes**: Define provider-specific API endpoints
- **Loaded By**: API server (routes, middleware) and worker servers (request handlers, wire adapters, auditors)
- **Extensible**: Easy to add new providers via plugin development
  - See [SDK Plugin Development Guide](plugins/sdk/README.md)

### Multi-Provider Support

- **OpenAI**: Full GPT model family support with streaming (via plugin)
- **Claude**: Anthropic's Claude models with extended thinking & tools (via plugin)
- **Ollama**: Local model hosting integration (via plugin)
- **Plugin Architecture**: Independently versioned, hot-reloadable provider plugins
- **Extensible**: Easy to add new providers via plugin development

### API Compatibility

- **OpenAI-Compatible**: `/api/openai/v1/chat/completions`
- **Claude-Compatible**: `/api/claude/v1/messages`
- **Ollama-Compatible**: `/api/tags`, `/api/generate`, `/api/chat`
- **Custom App Routes**: `/:provider/:appSlug/*` (routes to specific app configurations)

### Streaming Responses

- Server-Sent Events (SSE) for real-time streaming
- Wire format abstraction for provider-agnostic streaming
- Efficient connection pooling and routing via sourceId
- Client disconnect handling

### Horizontal Scaling

- Queue-based work distribution (fanout pattern)
- Stateless worker nodes
- Load balancing across multiple workers
- Source-based response routing (direct exchange with sourceId routing key)

### Audit & Compliance

- Complete request/response logging via separate audit server
- PostgreSQL-backed audit trails
- Plugin-based auditors for native logging format
- Provider-agnostic request translation system

### Universal Model Access

- **Provider-Agnostic Discovery**: List all available models through any provider's API format
- **Cross-Provider Usage**: Use any model (e.g., `gpt-4`, `claude-sonnet-4`, `llama3:8b`) through any endpoint
- **Automatic Translation**: Plugins handle format translation between providers seamlessly
- **Example**: Call `claude-sonnet-4` using OpenAI SDK, and Holo handles the translation automatically

---

## 📡 API Endpoints

### Custom App Routes

All custom routes follow the pattern: `/:provider/:appSlug/*`

**Example**:
```http
POST /openai/my-app/v1/chat/completions
POST /claude/my-app/v1/messages
GET /openai/my-app/v1/models
```

These routes:
1. Extract provider and appSlug from URL
2. Validate user has access to appSlug via JWT
3. Rewrite to standard provider route: `/api/{provider}/{path}`
4. Apply provider-specific middleware and authentication

### Provider Endpoints

All provider-specific routes are registered dynamically by plugins at startup. Each plugin defines its own API endpoints, request/response formats, and compatibility layers.

**Supported Providers**:
- **OpenAI**: OpenAI-compatible endpoints (chat completions, models, etc.)
  - See [OpenAI Plugin Documentation](plugins/holo-provider-openai/README.md)
- **Claude**: Anthropic-compatible endpoints (messages, models, etc.)
  - See [Claude Plugin Documentation](plugins/holo-provider-claude/README.md)
- **Ollama**: Ollama-compatible endpoints (generate, chat, tags, etc.)
  - See [Ollama Plugin Documentation](plugins/holo-provider-ollama/README.md)

**Universal Model Access**:
All model listing endpoints return **all models** the user has access to (across all providers) in the provider-specific format. This enables provider-agnostic model access through any endpoint.

### Health & Status

**Health Check**:
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 🔧 Configuration

### Environment Variables

**Important**: Environment variables must be loaded before application startup. The application uses dotenv to load variables from a `.env` file in the project root.

#### Server Configuration
```bash
# API Server
PORT=3000
NODE_ENV=production
API_SERVER_ID=api_server_001    # Used to identify the API server instance

# Worker Server
WORKER_ID=worker_001            # Used to identify the worker instance

# Audit Server
AUDIT_ID=audit_001              # Used to identify the audit server instance
```

#### Database Configuration
```bash
# PostgreSQL settings
DATABASE_URL="postgresql://user:password@localhost:5432/holo"
APP_PG_HOST=localhost
APP_PG_PORT=5432
APP_PG_DATABASE=holo
APP_PG_USER=postgres
APP_PG_PASSWORD=password
APP_PG_SSL=false
APP_PG_MAX_CONNECTIONS=20
```

#### RabbitMQ Configuration
```bash
# Message queue settings
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_REQUEST_QUEUE=llm_requests
RABBITMQ_RESPONSE_QUEUE=llm_responses
RABBITMQ_AUDIT_REQUEST_QUEUE=llm_requests_audit
RABBITMQ_AUDIT_RESPONSE_QUEUE=llm_responses_audit
```

**Queue Architecture**:
- **Request Exchange** (fanout): Distributes requests to all workers and audit server
- **Response Exchange** (direct): Routes responses by sourceId (e.g., `api_server_001`)
- **Request Queue**: Shared by all workers (load balancing)
- **Response Queues**: Per-server queues (e.g., `llm_responses.api_server_001`)
- **Audit Request Queue**: Bound to request exchange for logging all requests
- **Audit Response Queue**: Bound to response exchange with routing key `audit` for logging all responses

#### Provider Configuration
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Claude/Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60000
```

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- RabbitMQ 3.8+
- Docker & Docker Compose (optional)

### Quick Start with Docker
```bash
# Clone and navigate to project
git clone <repository>
cd holo

# Start all services
docker-compose up -d

# Scale workers as needed
docker-compose up -d --scale worker=3

# View logs
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f audit
```

### Development Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configurations

# Run database migrations
npx prisma db pull    ## to pull db changes into schema if db already updated by Flyway
npx prisma migrate deploy
npx prisma generate

# Start in development mode
npm run api:dev       # API server
npm run worker:dev    # Worker node
npm run audit:dev     # Audit service
```

### Production Deployment
```bash
# Build TypeScript
npm run build

# Start services
npm start          # API server
npm run worker     # Worker node
npm run audit      # Audit service
```

---

## 🔌 Plugin Development

### Overview

The plugin system is the core of Holo's extensibility. All provider integrations are implemented as standalone plugin packages that are loaded dynamically at startup.

**📚 Complete Plugin Development Guide**: See [plugins/sdk/README.md](plugins/sdk/README.md) for step-by-step instructions.

### Quick Start

1. **Create Plugin Package**: Follow the standardized plugin structure in `plugins/holo-provider-{name}/`
2. **Implement Plugin Interface**:
   - Plugin entrypoint with manifest
   - Provider implementation
   - Wire adapter for streaming
   - Auditor for logging
   - Request handler
   - Routes definition
3. **Register Plugin**: Export plugin from entrypoint with all required components
4. **Test**: Write integration tests with real API calls

### Plugin Components

Each plugin provides the following components:

- **Provider**: Implements request processing logic for the provider
- **Wire Adapter**: Converts provider events to wire format for HTTP streaming
- **Auditor**: Provides native logging format for audit trail
- **Request Handler**: Processes incoming requests from queue
- **Routes**: Defines provider-specific API endpoints

### Key Concepts

- **Plugin Architecture**: Independently versioned, hot-reloadable packages
- **Dynamic Loading**: Plugins discovered and loaded at startup from `node_modules/@holokai`
- **SDK Integration**: Use `@holokai/sdk` types for strict type safety
- **Lightweight Design**: Minimal dependencies for fast loading
- **Loaded By**: Both API servers (for routes) and worker servers (for processing)

### Reference Implementations

| Plugin | Purpose | Key Features |
|--------|---------|--------------|
| [Claude Plugin](plugins/holo-provider-claude/README.md) | Anthropic integration | 6-event streaming lifecycle, content blocks, thinking support |
| [OpenAI Plugin](plugins/holo-provider-openai/README.md) | OpenAI integration | Multi-choice support, dual API support, tool calling |
| [Ollama Plugin](plugins/holo-provider-ollama/README.md) | Local model hosting | Generate vs Chat endpoints, frame-based streaming |

---

## 📊 Monitoring & Observability

### Logging
The system uses Winston for structured logging:
- **API Server**: Request/response logging with Morgan
- **Workers**: Job processing and error logging
- **Audit**: Compliance and security logging

### Metrics
Key metrics to monitor:
- Request throughput and latency
- Queue depth and processing time
- Provider response times and error rates
- Active stream connections
- Database connection pool usage

### Health Checks
- `/health`: Basic application health
- Database connectivity checks
- RabbitMQ connection status
- Provider API availability

---

## 🔒 Security Considerations

### API Security
- JWT authentication with app slug validation
- Input validation and sanitization
- Rate limiting (implement as needed)
- API key management for providers
- Request/response size limits

### Authorization
- App-level guards for policy enforcement
- User permission validation (apps, providers, models, guards)
- Guard results enforced at worker level before provider calls

### Data Privacy
- Audit logging via separate audit server
- Plugin auditors for native logging format
- Request data retention policies
- SSL/TLS encryption in transit

### Infrastructure Security
- Database connection encryption
- RabbitMQ authentication
- Container security best practices
- Environment variable protection

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="Provider"
npm test -- --testNamePattern="API"
```

### Testing Endpoints

**Testing Health Check**:
```bash
# Test basic health endpoint
curl -X GET http://localhost:3000/health
```

**Testing Custom App Routes**:
```bash
# Test custom app route pattern
curl -X POST http://localhost:3000/{provider}/{appSlug}/{endpoint} \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_JWT_TOKEN" \
  -d '{...}'
```

**Testing Provider Endpoints**:
For provider-specific endpoint testing and examples, see the respective plugin documentation:
- [OpenAI Plugin - Testing Examples](plugins/holo-provider-openai/README.md#testing)
- [Claude Plugin - Testing Examples](plugins/holo-provider-claude/README.md#testing)
- [Ollama Plugin - Testing Examples](plugins/holo-provider-ollama/README.md#testing)

---

## 🚀 Performance Optimization

### Scaling Strategies
1. **Horizontal Scaling**: Add more worker nodes
   - Workers consume from shared request queue
   - Load balanced automatically via RabbitMQ
   - Responses routed back via sourceId
2. **Provider Optimization**: Implement connection pooling
3. **Caching**: Cache model lists and configurations
4. **Load Balancing**: Distribute API requests across multiple API servers

### Resource Management
- Configure appropriate queue sizes
- Monitor memory usage in workers
- Optimize database connection pools
- Implement request timeouts
- Use plugin lazy loading where appropriate

---

## 📋 Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Verify database connectivity
npx prisma db push

# Check response queue bindings
# Ensure responseQueue.{sourceId} is properly bound to responseExchange
```

#### Provider Issues
```bash
# Test provider connectivity
curl -X GET http://localhost:3000/api/openai/v1/models \
  -H "x-api-key: YOUR_JWT_TOKEN"

# Check worker logs for plugin loading
docker-compose logs worker

# Verify plugins are loaded
# Look for "plugin:loaded" events in worker logs
```

#### Performance Issues
```bash
# Monitor queue depths
# Check worker logs for processing times
# Verify database query performance
# Check for backpressure in response streaming
```

#### Authentication Issues
```bash
# Verify JWT token is valid
# Check appSlug is in user's appSlugs array
# Verify app.providerType matches requested provider
# Check app has configured providers, models, guards
```

---

## 🛠️ Development Guidelines

### Code Structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external integrations
- **Plugins**: Provider implementations (wire adapters, auditors, routes, request handlers)
- **Types**: TypeScript type definitions
- **Utils**: Shared utility functions
- **Middleware**: Authentication, authorization, validation

### Best Practices
- Use dependency injection (TSyringe)
- Implement proper error handling
- Add comprehensive logging
- Write unit and integration tests
- Follow TypeScript strict mode
- Use environment-based configuration
- Follow plugin development guide for new providers

### Plugin Development
- See [plugins/sdk/README.md](plugins/sdk/README.md) for complete guide
- Follow reference implementations (Claude, OpenAI, Ollama)
- Implement all required components (provider, wire adapter, auditor, routes)
- Write integration tests with real API calls
- Use `@holokai/sdk` types for strict type safety

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Ensure CI/CD passes

For questions or support, please refer to the project documentation or create an issue in the repository.
