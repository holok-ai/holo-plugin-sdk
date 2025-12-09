# Project Overview

## Holo - LLM Gateway

**Project Name:** Holo (HoloKai Holo)
**Project Type:** Backend API Gateway
**Version:** 1.0.0
**Architecture:** Distributed Queue-Based Microservices

---

## Executive Summary

Holo is a scalable, distributed LLM proxy gateway built with TypeScript that provides unified access to multiple Large Language Model providers (OpenAI, Claude, Ollama, Perplexity) through standardized APIs. The system employs a queue-based architecture using RabbitMQ for distributed request processing, PostgreSQL for audit logging, and a sophisticated provider translation layer for cross-provider compatibility.

---

## Technology Stack

### Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | >= 18.0.0 | JavaScript runtime |
| **Language** | TypeScript | 5.8.3 | Type-safe development |
| **Framework** | Express | 4.21.2 | HTTP server |
| **Message Queue** | RabbitMQ | Latest | Distributed processing |
| **Database** | PostgreSQL | 8.x | Audit & data storage |
| **DI Container** | tsyringe | 4.10.0 | Dependency injection |
| **Validation** | ArkType | 2.1.22 | Runtime type validation |
| **Logger** | Winston | 3.18.3 | Structured logging |

### LLM Provider SDKs

| Provider | SDK | Version |
|----------|-----|---------|
| **OpenAI** | openai | 6.8.1 |
| **Claude** | @anthropic-ai/sdk | 0.67.0 |
| **Ollama** | ollama | 0.6.0 |

### Key Dependencies

- **amqplib** (0.10.9): RabbitMQ client
- **express-jwt** (8.5.1): JWT authentication
- **jsonwebtoken** (9.0.2): JWT token generation
- **node-cache** (5.1.2): In-memory caching
- **pg** (8.11.3): PostgreSQL client
- **body-parser** (1.20.2): Request parsing
- **morgan** (1.10.0): HTTP logging

---

## Repository Structure

**Repository Type:** Monolith
**Primary Language:** TypeScript (100%)
**Entry Points:**
- **Main API Server:** `src/app.ts`
- **Worker Server:** `src/servers/worker.server.ts`
- **Audit Server:** `src/servers/audit.server.ts`
- **Analysis Server:** `src/servers/analysis.server.ts`

---

## Architecture Overview

### Architecture Pattern

**Multi-Server Queue-Based Architecture** with provider abstraction layer

```
Client → API Server → RabbitMQ → Worker(s) → Provider APIs
                      ↓               ↓
                   Audit Server ← Response Queue
                   Analysis Server
```

### Key Components

1. **API Server**
   - Express.js HTTP interface
   - JWT authentication
   - Request validation
   - Response streaming (SSE)

2. **Worker Servers**
   - Queue-based request processing
   - Provider format translation
   - LLM API orchestration
   - Horizontal scaling support

3. **Audit Server**
   - Request/response logging
   - PostgreSQL persistence
   - Compliance tracking

4. **Analysis Server**
   - Analytics processing
   - Performance metrics
   - Usage reporting

5. **Provider Translation Layer**
   - Holo unified format
   - Bidirectional translators
   - Streaming support
   - Provider-agnostic abstraction

---

## Key Features

### Multi-Provider Support
- **OpenAI**: GPT models, chat completions, streaming
- **Claude**: Anthropic Claude models, messages API, extended thinking
- **Ollama**: Local model hosting
- **Perplexity**: Perplexity API integration
- **Extensible**: Easy provider addition via translator pattern

### API Compatibility
- OpenAI-compatible endpoints (`/api/openai/v1/*`)
- Claude-compatible endpoints (`/api/claude/v1/*`)
- Ollama-compatible endpoints (`/api/*`)
- Custom application routing (`/api/custom/:provider/:appSlug/*`)

### Distributed Architecture
- Queue-based request/response handling
- Horizontal worker scaling
- Stateless API servers
- RabbitMQ message broker

### Authentication & Authorization
- JWT-based authentication
- Organization-based access control
- Application-level guards
- Provider-specific permissions

### Streaming Responses
- Server-Sent Events (SSE)
- Real-time response streaming
- Client disconnect handling
- Provider-agnostic streaming

### Audit & Compliance
- Complete request/response logging
- PostgreSQL audit trails
- Usage metrics and cost tracking
- Configurable audit levels

### Configuration Management
- **File-based**: JSON configuration files (development)
- **Queue-based**: Dynamic configuration via RabbitMQ (production)
- **Hot reload**: Configuration updates without restart

---

## Project Statistics

### Codebase Metrics

- **Total Source Files:** 150+ TypeScript files
- **API Endpoints:** 15+ routes across 5 provider interfaces
- **Database Tables:** 10+ entities (models, providers, applications, requests, responses, evaluators)
- **Provider Integrations:** 5 (OpenAI, Claude, Ollama, Perplexity, Holo)
- **Server Processes:** 4 (API, Worker, Audit, Analysis)

### Directory Breakdown

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/api/` | 15+ | HTTP API layer |
| `src/providers/` | 80+ | Provider integrations & translators |
| `src/services/` | 10+ | Business logic services |
| `src/db/` | 10+ | Database access layer |
| `src/servers/` | 5+ | Server processes |
| `src/admin/` | 10+ | Configuration & auth |
| `src/cache/` | 15+ | In-memory caching |
| `src/guards/` | 3+ | Request pipeline guards |
| `src/types/` | 12+ | Shared type definitions |
| `src/utils/` | 5+ | Utility functions |

---

## Data Architecture

### Primary Database: PostgreSQL

**Tables:**
- `providers`: LLM provider configurations
- `models`: Available LLM models
- `applications`: Application configurations
- `llm_requests`: Incoming LLM requests
- `llm_responses`: Provider responses
- `evaluators`: Response evaluators
- `evaluator_data`: Evaluation results
- `prompts`: Reusable prompt templates
- `analysis_results`: Analytics data

**Connection:** pg (node-postgres) with connection pooling

---

### Message Queue: RabbitMQ

**Exchanges:**
- **Request Exchange**: API → Workers
- **Response Exchange**: Workers → API/Audit
- **Config Exchange**: Configuration updates

**Pattern:** Topic exchange with routing keys for message filtering

---

### In-Memory Cache: NodeCache

**Cached Entities:**
- Organizations
- Applications
- Providers
- JWT tokens
- Users
- Prompts
- Statistics

**Purpose:** Reduce database queries, improve performance

---

## Design Patterns

### Architectural Patterns

1. **Queue-Based Architecture**: Decouples API from processing, enables scaling
2. **Translator Pattern**: Bidirectional format conversion (Holo ↔ Provider)
3. **Repository Pattern**: Database access abstraction (`*DB` classes)
4. **Factory Pattern**: Response/request factories per provider
5. **Observer Pattern**: Configuration service event emitters
6. **Strategy Pattern**: Provider selection and routing

### Code Patterns

1. **Dependency Injection**: tsyringe container-based DI
2. **Middleware Pipeline**: Express middleware chain
3. **Service Layer**: Business logic separation
4. **Type Safety**: TypeScript + ArkType runtime validation
5. **Error Handling**: Centralized error middleware

---

## Development Workflow

### Build System
- **TypeScript Compiler**: `tsc`
- **Output Directory**: `dist/`
- **Source Maps**: Enabled

### Testing
- **Framework**: Jest
- **Integration Tests**: Real provider integration (no mocking)
- **Test Pattern**: `*.test.ts`, `*.spec.ts`

### Development Scripts
```bash
npm run api:dev          # API server with hot reload
npm run worker:dev       # Worker server with hot reload
npm run audit:dev        # Audit server with hot reload
npm run build            # TypeScript compilation
npm test                 # Run tests
npm run test:integration # Integration tests
```

---

## Deployment

### Docker Support
- **Dockerfile**: Main API server image
- **Dockerfile.audit**: Audit server image
- **docker-compose.yml**: Service orchestration

### Deployment Strategies
- **Development**: Single machine, file-based config
- **Production**: Distributed, queue-based config, horizontal scaling
- **Kubernetes**: Deployment manifests, HPA, services

### Infrastructure Requirements
- **RabbitMQ Cluster**: Message broker
- **PostgreSQL**: Audit database
- **Load Balancer**: API server distribution
- **Container Orchestration**: Docker/Kubernetes

---

## Security

### Authentication
- JWT-based token authentication
- Token validation middleware
- Organization-based access control

### Authorization
- Application-level guards
- Provider-specific permissions
- Request validation before processing

### Secrets Management
- Environment variables
- Encrypted configuration
- Provider API key protection

---

## Monitoring & Observability

### Health Checks
- `/health` endpoint for service monitoring
- Uptime and version reporting

### Logging
- Winston structured logging
- Log levels: error, warn, info, debug
- File and console output

### Metrics (Recommended)
- Request latency
- Queue depth
- Worker utilization
- Error rates
- Token usage
- Provider costs

---

## Extensibility

### Adding New Providers

1. Create provider directory in `src/providers/`
2. Implement translator (Holo ↔ Provider format)
3. Create type definitions and validators
4. Add routes and controllers
5. Register in router

**Pattern:** All providers follow same structure for consistency

---

### Custom Application Routes

Dynamic routing: `/api/custom/:provider/:appSlug/*`

Allows applications to define custom URL patterns mapped to provider configurations.

---

## Documentation

### Available Documentation

- [Project Overview](./project-overview.md) - This document
- [API Contracts](./api-contracts.md) - REST API endpoints
- [Data Models](./data-models.md) - Database schema
- [Source Tree Analysis](./source-tree-analysis.md) - Code organization
- [Development Guide](./development-guide.md) - Setup and development
- [Deployment Guide](./deployment-guide.md) - Production deployment

### Existing Documentation

- [README.md](../README.md) - Project introduction
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Detailed architecture
- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Code conventions
- [CODE_QUALITY_RUBRIC.md](../CODE_QUALITY_RUBRIC.md) - Quality guidelines

---

## Getting Started

### Quick Start (Development)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start services (requires RabbitMQ and PostgreSQL)
npm run api:dev      # Terminal 1: API server
npm run worker:dev   # Terminal 2: Worker server
npm run audit:dev    # Terminal 3: Audit server
```

### Access API
- **Base URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **OpenAI Endpoint**: http://localhost:3000/api/openai/v1/chat/completions
- **Claude Endpoint**: http://localhost:3000/api/claude/v1/messages

---

## Future Enhancements

### Potential Improvements
- Additional provider integrations (Gemini, Grok, etc.)
- Response caching layer
- Rate limiting per organization/application
- Advanced analytics dashboard
- GraphQL API option
- WebSocket support
- Provider failover and retry logic
- Cost optimization algorithms

---

## Links

- **Repository**: /Users/alexduan/Projects/nova/llm-proxy
- **Documentation Index**: [index.md](./index.md)
- **Main README**: [README.md](../README.md)
- **Architecture Details**: [ARCHITECTURE.md](../ARCHITECTURE.md)

---

## Project Team

- **License**: MIT
- **Language**: English
- **Primary Contact**: See package.json

---

## Summary

Holo is a production-ready, enterprise-grade LLM gateway designed for scalability, reliability, and multi-provider abstraction. Its queue-based architecture, comprehensive audit trails, and flexible configuration make it suitable for organizations requiring centralized LLM access control and monitoring.

For detailed information, refer to the linked documentation files or explore the comprehensive [Documentation Index](./index.md).
