# LLM Proxy Server

A scalable, distributed LLM proxy server built with TypeScript that provides unified access to multiple Large Language Model providers through standardized APIs. The system uses RabbitMQ for distributed processing and PostgreSQL for audit logging.

## 🏗️ Architecture Overview

The LLM Proxy Server follows a distributed microservices architecture with queue-based request/response handling and a universal translation layer:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   RabbitMQ      │    │   Worker Nodes  │
│   (Express)     │◄──►│   (Message      │◄──►│   (Translator   │
│   + Guards      │    │    Broker)      │    │    + Provider)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌────────▼────────┐
         │                       │              │ Holo (Universal │
         │                       │              │  Translation)   │
         │                       │              └────────┬────────┘
         │                       │                       │
         │                       │       ┌───────────────┼───────────────┐
         │                       │       │               │               │
         ▼                       ▼       ▼               ▼               ▼
┌─────────────────┐    ┌─────────────────┐  ┌─────────┐   ┌─────────┐   ┌─────────┐
│   PostgreSQL    │    │   Audit Service │  │ OpenAI  │   │ Claude  │   │ Ollama  │
│   (Database)    │    │   (Logging)     │  │   API   │   │   API   │   │   API   │
└─────────────────┘    └─────────────────┘  └─────────┘   └─────────┘   └─────────┘
```

### Core Components

1. **API Server** (`src/app.ts`): Express.js application handling requests and responses
   - JWT authentication and request validation
   - Listens on response exchange for worker responses
   - Streams responses to clients via SSE
2. **Guard System** (`src/admin/`): App-level authorization guards run on LLM requests
   - Smart error formatting (JSON for API calls, natural language for chat)
3. **Worker Server** (`src/servers/worker.server.ts`):
   - Consumes requests from request queue
   - Enforces guard results and validation errors
   - Routes to provider translators or generates errors
   - Publishes responses to response exchange
4. **Audit Server** (`src/servers/audit.server.ts`): Logs all requests and responses for compliance
5. **Provider Translation System** (`src/providers/`):
   - **Holo Format**: Universal abstraction layer (hub-and-spoke architecture)
   - **Bidirectional Translators**: Convert between Holo ↔ Provider formats
   - **Streaming Support**: Real-time event translation with lossless round-tripping
   - See [Provider Documentation](src/providers/README.md) for details
6. **Queue Service** (`src/services/queue.service.ts`): RabbitMQ message handling
7. **Response Service** (`src/services/response.service.ts`):
   - Listens on response exchange, filters by request_id
   - Unified error handling with smart formatting
8. **Stream Service** (`src/services/stream.service.ts`): Formats and streams responses to client

---

## 🔄 Request Lifecycle

The following diagram shows the complete request/response flow:

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. HTTP Request
     ▼
┌────────────────────────────────────────────────┐
│          API Server (app.controller.ts)        │
├────────────────────────────────────────────────┤
│  2. JWT Middleware (jwt.middleware.ts)         │
│     └─► Validates JWT token                    │
│     └─► Adds auth object to request            │
│         (apps, providers user has access to)   │
└────┬───────────────────────────────────────────┘
     │ 3. Parse request params
     │    Create LLM-specific request
     ▼
┌────────────────────────────────────────────────┐
│         Guard Execution (admin/guards)         │
├────────────────────────────────────────────────┤
│  4. Run app guards on LLM request              │
│     └─► Check permissions from auth object     │
│     └─► Validate request against app rules     │
│     └─► Attach guard results to LLM request    │
└────┬───────────────────────────────────────────┘
     │ 5. Open response stream (response.service, stream.service)
     │    Generate unique request_id
     ▼
┌────────────────────────────────────────────────┐
│    Queue Service (queue.service.ts)            │
├────────────────────────────────────────────────┤
│  6. Publish LLM request to request exchange    │
│     └─► Request contains guard results         │
│     └─► Request contains unique request_id     │
└────┬───────────────────────────────────────────┘
     │
     │ RabbitMQ Request Exchange
     │
     ▼
┌────────────────────────────────────────────────┐
│      Worker Server (worker.server.ts)          │
├────────────────────────────────────────────────┤
│  7. Consume request from queue                 │
│  8. Check guard results on request             │
│     ├─► If guards PASSED:                      │
│     │   └─► Route to provider API              │
│     │   └─► Stream provider response           │
│     └─► If guards FAILED:                      │
│         └─► Generate provider-native error     │
│         └─► Block call to actual provider      │
│  9. Publish response chunks to exchange        │
│     └─► Each chunk tagged with request_id      │
└────┬───────────────────────────────────────────┘
     │
     │ RabbitMQ Response Exchange
     │
     ├──────────────────┬─────────────────────────┐
     │                  │                         │
     ▼                  ▼                         ▼
┌─────────────────────────────────┐  ┌──────────────────────┐
│  API Server (response.service)  │  │   Audit Server       │
│                                 │  │ (audit.server.ts)    │
├─────────────────────────────────┤  ├──────────────────────┤
│ 11. Listen on response exchange │  │ • Listens on request │
│ 12. Filter by request_id        │  │   exchange (audits   │
│ 13. Parse provider responses    │  │   incoming requests) │
│ 14. Push to response stream     │  │ • Listens on response│
│     (stream.service.ts)         │  │   exchange (audits   │
└─────┬───────────────────────────┘  │   all responses)     │
      │                              │ • Writes to          │
      ▼                              │   PostgreSQL         │
┌────────────────────────────────────────────────┐──────────┘
│      Stream Service (stream.service.ts)        │
├────────────────────────────────────────────────┤
│ 15. Format provider-specific chunks            │
│ 16. Write to HTTP response stream              │
│ 17. Handle client disconnect                   │
└────┬───────────────────────────────────────────┘
     │ 18. Server-Sent Events (SSE)
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### Key Lifecycle Stages

1. **Authentication**: JWT middleware validates token and extracts user permissions (apps, providers)
2. **Request Parsing**: Controller extracts params and creates provider-specific LLM request
3. **Authorization**: App-level guards validate request against user's app permissions
4. **Response Setup**: Response stream opened before queueing (identified by unique `request_id`)
5. **Request Queueing**: LLM request (with guard results) published to RabbitMQ request exchange
6. **Request Auditing**: Audit server listens on request exchange and logs all requests to PostgreSQL
7. **Worker Processing**: Worker consumes request and checks guard results
   - **Guards Passed**: Routes to provider API (OpenAI/Claude/Ollama) and receives streaming response
   - **Guards Failed**: Generates provider-native error response, blocks actual provider call
8. **Worker Response Publishing**: Worker pipes provider response chunks to response exchange with originating `request_id`
9. **Response Auditing**: Audit server listens on response exchange and logs all responses to PostgreSQL
10. **API Response Handling**: API server listens on response exchange, filters by `request_id`, parses provider responses
11. **Stream Piping**: Parsed chunks pushed to HTTP response stream and piped to client via SSE

### Guard System

Guards provide multi-stage authorization with execution split between API and Worker servers:

#### Guard Execution (API Server)
Guards run **after** authentication but **before** request queueing:

- **Input**: LLM request + auth object (from JWT middleware)
- **Process**: Validate request against app-specific rules and user permissions
- **Output**: Guard results attached to LLM request and sent to queue
- **Purpose**: Pre-validate user permissions for apps/providers/models

#### Guard Enforcement (Worker Server)
Workers validate guard results **before** calling provider APIs:

- **Input**: LLM request with attached guard results from queue
- **Guard Check**:
  - **If Passed**: Forward request to provider translator → provider API
  - **If Failed**: Generate provider-native error response without calling provider
- **Response Format**:
  - **API Calls** (with `response_format: json_schema|json_object`): Structured JSON errors
  - **Chat Clients**: Natural language error messages
  - Errors returned in provider-specific format (OpenAI/Claude/Ollama structure)
- **Purpose**: Prevent unauthorized API calls while maintaining provider compatibility

This two-stage approach ensures:
1. **Early validation**: Guards execute at API server for quick feedback
2. **Enforcement at worker**: Guard results checked before expensive provider API calls
3. **Smart error formatting**: JSON for programmatic calls, natural language for chat
4. **Provider-native errors**: Failures returned in format matching the requested provider
5. **Cost savings**: Blocked requests never reach paid provider APIs

### Response Stream Coordination

The response flow uses a pub/sub pattern with request_id correlation through the API server:

1. **Before queueing**: API server opens SSE stream and generates unique `request_id`
2. **Response listening**: API server's response service subscribes to response exchange filtering by `request_id`
3. **Worker response publishing**: Worker receives provider response, pipes chunks to response exchange with `request_id`
4. **API response handling**: API server picks up response from exchange, parses provider-specific format
5. **Stream piping**: Parsed chunks pushed to HTTP response stream via stream service
6. **Stream completion**: When provider signals done, response stream closed and client connection terminated

**Key Flow**: Provider → Worker → Response Exchange → API Server (parse) → Stream Service → Client

### Audit Service

The audit server provides comprehensive logging for compliance and monitoring:

- **Dual Exchange Monitoring**: Listens on both request and response exchanges
- **Request Auditing**: Captures all incoming requests with full payload and guard results
- **Response Auditing**: Captures all provider responses including streaming chunks
- **Database Persistence**: Writes audit trails to PostgreSQL with timestamps and metadata
- **Independent Operation**: Runs as separate service for reliability and scalability

## 🚀 Key Features

### Multi-Provider Support
- **OpenAI**: Full GPT model family support with streaming
- **Claude**: Anthropic's Claude models with extended thinking & tools
- **Ollama**: Local model hosting integration
- **Holo Translation Layer**: Universal abstraction for cross-provider compatibility
- **Extensible**: Easy to add new providers via translator pattern
  - See [Provider Implementation Guide](src/providers/IMPLEMENTATION_GUIDE.md)

### API Compatibility
- **OpenAI-Compatible**: `/api/openai/v1/chat/completions`
- **Claude-Compatible**: `/api/claude/v1/messages`
- **Custom Endpoints**: `/api/generate`, `/api/chat`

### Streaming Responses
- Server-Sent Events (SSE) for real-time streaming
- Efficient connection pooling and routing
- Client disconnect handling

### Horizontal Scaling
- Queue-based work distribution
- Stateless worker nodes
- Load balancing across multiple workers

### Audit & Compliance
- Complete request/response logging
- PostgreSQL-backed audit trails
- Configurable audit levels
- Provider-agnostic request translation system

### Universal Translation System
- **Holo Format**: Canonical abstraction layer for provider-agnostic requests/responses
- **Bidirectional Translators**: Convert between Holo ↔ Provider formats (N translations vs N²)
- **Streaming Support**: Real-time event translation with lossless round-tripping
- **Type Safety**: ArkType validators + TypeScript for runtime & compile-time validation
- **Stateless Design**: No shared state; orchestrator handles accumulation where needed

## 📡 API Endpoints

### Standard Endpoints

#### Generate Text
```http
POST /api/generate
Content-Type: application/json

{
  "model": "gpt-4",
  "prompt": "Write a haiku about programming",
  "stream": true,
  "options": {
    "temperature": 0.7,
    "max_tokens": 100
  }
}
```

#### Chat Completion
```http
POST /api/chat
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "stream": true,
  "options": {
    "temperature": 0.5
  }
}
```

### OpenAI-Compatible Endpoints

#### Chat Completions
```http
POST /api/openai/v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "stream": true
}
```

#### List Models
```http
GET /api/openai/v1/models
```

### Claude-Compatible Endpoints

#### Messages
```http
POST /api/claude/v1/messages
Content-Type: application/json

{
  "model": "claude-3-5-sonnet-20241022",
  "messages": [
    {
      "role": "user",
      "content": "Explain machine learning"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.7,
  "stream": true,
  "system": "You are a helpful AI assistant",
  "tools": [...],               // Optional: Tool definitions
  "tool_choice": "auto",        // Optional: Tool usage preference
  "container": "my-session",    // Optional: Session container
  "service_tier": "auto",       // Optional: 'auto' or 'standard_only'
  "thinking": {                 // Optional: Extended thinking configuration
    "enabled": true
  },
  "mcp_servers": [...],         // Optional: MCP server configurations
  "stop_sequences": ["END"],    // Optional: Custom stop sequences
  "metadata": {                 // Optional: Request metadata
    "user_id": "user123"
  }
}
```

**Supported Claude API Fields:**
- `model`, `messages`, `max_tokens` (required)
- `temperature`, `top_p`, `top_k`, `stream`, `system` (optional)
- `tools`, `tool_choice`, `metadata`, `stop_sequences` (optional)
- `container`, `mcp_servers`, `service_tier` (optional, new)
- `thinking`, `betas` (optional, advanced features)

### Health & Status

#### Health Check
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

## 🔧 Configuration

### Environment Variables

**Important**: Environment variables must be loaded before application startup. The application uses dotenv to load variables from a `.env` file in the project root. This is automatically configured in the main server files (`src/app.ts`, `src/servers/worker.server.ts`, `src/servers/audit.server.ts`).

#### API Server Configuration
```bash
# Server settings
PORT=3000
NODE_ENV=production
API_SERVER_ID=api_server_001    # Used to identify the API server instance

# Worker settings
WORKER_ID=worker_001            # Used to identify the worker instance

# Audit settings
AUDIT_ID=audit_001              # Used to identify the audit server instance
```

**Note**: The API server ID was previously configured as `SERVER_ID` but has been renamed to `API_SERVER_ID` for clarity.

#### Database Configuration
```bash
# PostgreSQL settings
DATABASE_URL="postgresql://user:password@localhost:5432/llm_proxy"
APP_PG_HOST=localhost
APP_PG_PORT=5432
APP_PG_DATABASE=llm_proxy
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
cd llm-proxy

# Start all services
docker-compose up -d

# Scale workers as needed
docker-compose up -d --scale worker=3

# View logs
docker-compose logs -f api
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
npm run analysis:dev  # Analysis service
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

## 🔌 Provider Integration

### Adding a New Provider

The system uses a **Holo translation layer** for universal provider abstraction. Adding a new provider involves implementing bidirectional translators between Holo (canonical format) and your provider's native format.

**📚 Complete Implementation Guide**: See [src/providers/IMPLEMENTATION_GUIDE.md](src/providers/IMPLEMENTATION_GUIDE.md) for step-by-step instructions.

#### Quick Overview

1. **Define Types**: Create provider-specific request/response types
2. **Implement Translators**:
   - Request translator (Holo ↔ Provider requests)
   - Response translator (Holo ↔ Provider responses)
   - Message/Tool/Usage translators (reusable components)
   - Streaming translators (real-time event conversion)
3. **Add Validators**: ArkType schemas for runtime validation
4. **Register Provider**: Hook into provider service
5. **Test**: Verify bidirectional translation and streaming

#### Key Concepts

- **Hub-and-Spoke Architecture**: Holo as universal format (N translations vs N²)
- **Stateless Translators**: No state between calls; orchestrator handles accumulation
- **Lossless Round-Tripping**: `provider_delta` preserves raw events
- **Validator-First Design**: ArkType validation before processing

#### Documentation Structure

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION_GUIDE.md](src/providers/IMPLEMENTATION_GUIDE.md) | Step-by-step provider integration |
| [ARCHITECTURE.md](src/providers/ARCHITECTURE.md) | System design & base patterns |
| [TYPE_REFERENCE.md](src/providers/TYPE_REFERENCE.md) | Complete type definitions |
| [TRANSLATION_GUIDE.md](src/providers/TRANSLATION_GUIDE.md) | Field mapping tables (Holo ↔ Provider) |
| [STREAMING_GUIDE.md](src/providers/STREAMING_GUIDE.md) | Streaming architecture & event lifecycle |

#### Provider-Specific Examples

- **[Claude README](src/providers/claude/README.md)** - 6-event streaming lifecycle, content blocks
- **[OpenAI README](src/providers/openai/README.md)** - Multi-choice support, tool call streaming
- **[Ollama README](src/providers/ollama/README.md)** - Generate vs Chat endpoints, frame-based streaming

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

## 🔒 Security Considerations

### API Security
- Input validation and sanitization
- Rate limiting (implement as needed)
- API key management for providers
- Request/response size limits

### Data Privacy
- Audit logging configuration
- Provider data handling policies
- Request data retention policies
- SSL/TLS encryption in transit

### Infrastructure Security
- Database connection encryption
- RabbitMQ authentication
- Container security best practices
- Environment variable protection

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
```bash
# Test OpenAI compatibility
curl -X POST http://localhost:3000/api/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'

# Test Claude compatibility
curl -X POST http://localhost:3000/api/claude/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

## 🚀 Performance Optimization

### Scaling Strategies
1. **Horizontal Scaling**: Add more worker nodes
2. **Provider Optimization**: Implement connection pooling
3. **Caching**: Cache model lists and configurations
4. **Load Balancing**: Distribute API requests

### Resource Management
- Configure appropriate queue sizes
- Monitor memory usage in workers
- Optimize database connection pools
- Implement request timeouts

## 📋 Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Verify database connectivity
npx prisma db push
```

#### Provider Issues
```bash
# Test provider connectivity
curl -X GET http://localhost:3000/api/models

# Check provider configuration
docker-compose logs worker
```

#### Performance Issues
```bash
# Monitor queue depths
# Check worker logs for processing times
# Verify database query performance
```

## 🛠️ Development Guidelines

### Code Structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external integrations
- **Providers**: LLM API implementations
- **Types**: TypeScript type definitions
- **Utils**: Shared utility functions

### Best Practices
- Use dependency injection (TSyringe)
- Implement proper error handling
- Add comprehensive logging
- Write unit and integration tests
- Follow TypeScript strict mode
- Use environment-based configuration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Ensure CI/CD passes

For questions or support, please refer to the project documentation or create an issue in the repository.
