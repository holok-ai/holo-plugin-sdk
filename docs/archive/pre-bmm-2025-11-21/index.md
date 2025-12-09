# Project Documentation Index

## Project Overview

- **Name**: Holo (HoloKai Holo)
- **Type**: Backend API Gateway / LLM Proxy
- **Architecture**: Distributed Queue-Based Microservices
- **Primary Language**: TypeScript
- **Framework**: Express.js with RabbitMQ

---

## Quick Reference

### Project Classification
- **Repository Type**: Monolith (single codebase, multiple runtime processes)
- **Project Type**: Backend
- **Tech Stack**: TypeScript + Express + RabbitMQ + PostgreSQL
- **Architecture Pattern**: Queue-based distributed processing with provider abstraction

### Entry Points
- **API Server**: `src/app.ts` (port 3000)
- **Worker Server**: `src/servers/worker.server.ts`
- **Audit Server**: `src/servers/audit.server.ts`
- **Analysis Server**: `src/servers/analysis.server.ts`

### Tech Stack Summary
- **Runtime**: Node.js >= 18.0.0
- **Language**: TypeScript 5.8.3
- **Framework**: Express 4.21.2
- **Queue**: RabbitMQ (amqplib)
- **Database**: PostgreSQL (pg)
- **DI**: tsyringe
- **Validation**: ArkType
- **Logger**: Winston

---

## Core Documentation

- **[Project Overview](./project-overview.md)** - Executive summary, tech stack, architecture overview, project statistics
- **[Architecture](./architecture.md)** - Comprehensive architecture analysis, directory structure, design patterns, clean architecture recommendations
- **[API Contracts](./api-contracts.md)** - REST API endpoints, request/response formats, authentication
- **[Data Models](./data-models.md)** - Database schema, entity relationships, query patterns
- **[Development Guide](./development-guide.md)** - Setup, build, test, common development tasks
- **[Deployment Guide](./deployment-guide.md)** - Docker, Kubernetes, production deployment, scaling

---

## Specialized Documentation

### API & Models

- **[Models API Specification](./models-api-specification.md)** - Detailed specification for `/models` endpoints across all providers
- **[Models Implementation Plan](./models-implementation-plan.md)** - Implementation roadmap for models API

### Code Quality & Standards

- **[Coding Standards](./coding-standards.md)** - Code conventions and style guide
- **[Code Quality Rubric](./code-quality-rubric.md)** - Quality guidelines and best practices
- **[CLAUDE.md](../CLAUDE.md)** - Claude AI configuration (ArkType validator rules, commenting standards) - **Must stay in root**

### Authentication & Security

- **[Enhanced Auth](./enhanced-auth.md)** - Authentication system documentation

---

## Reference Documentation

### Main Project Documentation

- **[README.md](../README.md)** - Main project documentation with request lifecycle and architecture diagrams

### Archived Documentation

- **[PROVIDER_ARCHITECTURE.md](./archive/PROVIDER_ARCHITECTURE.md)** - Provider architecture details
- **[MONOREPO_STRUCTURE.md](./archive/MONOREPO_STRUCTURE.md)** - Outdated monorepo plan (project is currently monolith)
- **[openai-responses-api-plan.md](./archive/plan/openai-responses-api-plan.md)** - OpenAI responses API plan
- **[openai-responses-api-requirements.md](./archive/requirements/openai-responses-api-requirements.md)** - OpenAI API requirements
- **[openai-responses-api-architecture.md](./archive/architecture/openai-responses-api-architecture.md)** - OpenAI API architecture

---

## Getting Started

### For New Developers

1. **Read Project Overview**: Start with [Project Overview](./project-overview.md) for high-level understanding
2. **Review Architecture**: Read [Architecture](./architecture.md) and [README.md](../README.md) for system design and request lifecycle
3. **Setup Development Environment**: Follow [Development Guide](./development-guide.md)
4. **Understand Data Models**: Review [Data Models](./data-models.md) for database schema
5. **Learn API Endpoints**: Check [API Contracts](./api-contracts.md) for endpoint specifications
6. **Read Coding Standards**: Review [Coding Standards](./coding-standards.md) and [CLAUDE.md](../CLAUDE.md) before contributing

### For DevOps/Deployment

1. **Review Deployment Guide**: [Deployment Guide](./deployment-guide.md)
2. **Check Docker Configuration**: `docker-compose.yml`, `Dockerfile`, `Dockerfile.audit`
3. **Review Infrastructure Requirements**: RabbitMQ, PostgreSQL, Load Balancer
4. **Understand Configuration**: File-based vs Queue-based configuration modes
5. **Setup Monitoring**: Health checks, logging, metrics

### For API Users

1. **API Contracts**: [API Contracts](./api-contracts.md) - All endpoints documented
2. **Models API**: [Models API Specification](./models-api-specification.md) - Detailed models endpoint documentation
3. **Authentication**: JWT-based authentication (see [Enhanced Auth](./enhanced-auth.md))
4. **Provider-Specific Endpoints**:
   - OpenAI: `/api/openai/v1/*`
   - Claude: `/api/claude/v1/*`
   - Ollama: `/api/*`
   - Custom: `/api/custom/:provider/:appSlug/*`
5. **Streaming**: Server-Sent Events (SSE) for real-time responses

---

## Architecture at a Glance

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

**Key Components:**
1. **API Server**: HTTP interface, JWT auth, response streaming
2. **RabbitMQ**: Message queue for distributed processing
3. **Workers**: Process LLM requests, call provider APIs
4. **Holo Translation Layer**: Universal format conversion
5. **Audit Server**: Request/response logging to PostgreSQL
6. **Provider APIs**: OpenAI, Claude, Ollama, Perplexity integrations

---

## Key Features

### Multi-Provider Support
- ✅ OpenAI (GPT models, chat completions, streaming)
- ✅ Claude (Anthropic Claude, messages API, extended thinking)
- ✅ Ollama (Local model hosting)
- ✅ Perplexity (Perplexity API)
- ✅ Extensible provider system (easy to add new providers)

### Distributed Architecture
- ✅ Queue-based request/response handling
- ✅ Horizontal worker scaling
- ✅ Stateless API servers
- ✅ RabbitMQ message broker

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Organization-based access control
- ✅ Application-level guards
- ✅ Provider-specific permissions

### Audit & Compliance
- ✅ Complete request/response logging
- ✅ PostgreSQL audit trails
- ✅ Usage metrics and cost tracking

### Configuration Management
- ✅ File-based configuration (development)
- ✅ Queue-based configuration (production)
- ✅ Dynamic configuration updates

---

## Common Tasks

### Start Development Environment

```bash
# Terminal 1: API Server
npm run api:dev

# Terminal 2: Worker Server
npm run worker:dev

# Terminal 3: Audit Server
npm run audit:dev
```

### Run Tests

```bash
npm test                 # All tests
npm run test:integration # Integration tests only
```

### Build for Production

```bash
npm run build            # Compile TypeScript to dist/
```

### Deploy with Docker

```bash
docker-compose up -d     # Start services
```

---

## Project Structure Summary

```
llm-proxy/
├── src/                          # Source code
│   ├── api/                      # HTTP API (routes, controllers, middleware)
│   ├── providers/                # Provider integrations (OpenAI, Claude, Ollama, etc.)
│   ├── services/                 # Business logic services
│   ├── servers/                  # Server processes (worker, audit, analysis)
│   ├── db/                       # Database access layer
│   ├── cache/                    # In-memory caching
│   ├── admin/                    # Configuration & auth management
│   ├── guards/                   # Request pipeline guards
│   ├── types/                    # Shared TypeScript types
│   ├── utils/                    # Utility functions
│   └── app.ts                    # Main API server entry point
├── tests/                        # Test suites
├── docs/                         # Documentation (this folder)
├── dist/                         # Compiled JavaScript
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── docker-compose.yml            # Docker orchestration
└── Dockerfile                    # Docker image
```

---

## API Endpoints Overview

### Health Check
- `GET /health` - Service health status

### OpenAI API
- `POST /api/openai/v1/chat/completions` - Chat completions
- `POST /api/openai/v1/responses` - Create response
- `GET /api/openai/v1/models` - List models

### Claude API
- `POST /api/claude/v1/messages` - Messages endpoint
- `GET /api/claude/v1/models` - List models

### Ollama API
- `POST /api/generate` - Generate completion
- `POST /api/chat` - Chat completion
- `GET /api/tags` - List models

### Custom Application Routes
- `POST /api/custom/:provider/:appSlug/*` - Dynamic custom routing

**All endpoints (except `/health`) require JWT authentication.**

---

## Database Schema Overview

### Core Entities

- **providers**: LLM provider configurations
- **models**: Available LLM models
- **applications**: Application configurations with custom routing
- **llm_requests**: Incoming LLM requests
- **llm_responses**: Provider responses with usage metrics
- **evaluators**: Response quality evaluators
- **evaluator_data**: Evaluation results
- **prompts**: Reusable prompt templates
- **analysis_results**: Analytics data

**See [Data Models](./data-models.md) for detailed schema.**

---

## Development Workflow

1. **Install Dependencies**: `npm install`
2. **Setup Environment**: Copy `.env.example` to `.env` and configure
3. **Start Services**: Run API server, worker server, audit server
4. **Make Changes**: Edit source code in `src/`
5. **Test**: `npm test` or `npm run test:integration`
6. **Build**: `npm run build` (TypeScript → JavaScript in `dist/`)
7. **Deploy**: Use Docker or deploy to Kubernetes

---

## Monitoring & Observability

### Health Endpoint
- **URL**: http://localhost:3000/health
- **Purpose**: Service health checks, uptime, version

### Logging
- **Framework**: Winston
- **Levels**: error, warn, info, debug
- **Output**: Console + file (`logs/` directory)

### Recommended Metrics
- Request latency
- Queue depth (RabbitMQ)
- Worker utilization
- Error rates
- Provider API response times
- Token usage and costs

---

## Deployment Options

### Development
- Single machine
- File-based configuration
- Local RabbitMQ and PostgreSQL

### Staging
- Cloud-hosted services
- Queue-based configuration
- 2-3 worker instances

### Production
- Multi-region deployment
- Managed RabbitMQ (CloudAMQP, Amazon MQ)
- Managed PostgreSQL (RDS, Aurora)
- Auto-scaling worker pools (5-20+ instances)
- Load balancer for API servers

**See [Deployment Guide](./deployment-guide.md) for detailed instructions.**

---

## Support & Resources

### Documentation Links
- [Project Overview](./project-overview.md)
- [Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
- [Models API Specification](./models-api-specification.md)
- [Coding Standards](./coding-standards.md)
- [Code Quality Rubric](./code-quality-rubric.md)

### Main Resources
- [README.md](../README.md) - Main project documentation
- [CLAUDE.md](../CLAUDE.md) - AI coding rules (must be in root for Claude Code)

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript compiler options
- `jest.config.cjs` - Jest test configuration
- `.env.example` - Environment variable template
- `docker-compose.yml` - Docker services

---

## License

MIT

---

**Generated:** 2025-11-20
**Scan Level:** Exhaustive
**Documentation Version:** 1.0.0
