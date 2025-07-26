# LLM Proxy Project Instructions

## Tech Stack
- Node.js 18+, TypeScript 5, Express.js
- RabbitMQ for message queuing
- PostgreSQL with Prisma ORM
- Docker & Docker Compose
- TSyringe for dependency injection
- Winston for logging

## Project Structure
- `/src/app.ts` - Main Express application entry point
- `/src/api/` - HTTP routes, controllers, middleware
- `/src/services/` - Business logic (Queue, Response, Provider, Audit)
- `/src/providers/` - LLM provider implementations (OpenAI, Claude, Ollama)
- `/src/servers/` - Worker and audit server implementations
- `/src/db/` - Database models and connections
- `/src/types/` - TypeScript type definitions
- `/prisma/` - Database schema and migrations

## Commands
- `npm run api:dev` - Start API server in development
- `npm run worker:dev` - Start worker server in development  
- `npm run audit:dev` - Start audit server in development
- `npm run build` - Compile TypeScript
- `npm start` - Start production API server
- `npx prisma migrate deploy` - Run database migrations
- `npx prisma generate` - Generate Prisma client
- `docker-compose up -d` - Start all services with Docker

## Coding Standards
- Use TypeScript strict mode
- Implement dependency injection with TSyringe `@injectable()` decorators
- Use camelCase for variables, PascalCase for classes
- Prefix interfaces with capital letter (no "I" prefix)
- Use arrow functions for callbacks and class methods
- Import types with `import type {}`
- Use structured logging with Winston logger
- Handle errors with try/catch and proper error responses

## Architecture Patterns
- **Queue-based processing**: API receives requests → RabbitMQ → Workers process → Response streams
- **Provider pattern**: Abstract `AIProvider` base class with concrete implementations
- **Service layer**: Business logic separated from controllers
- **Streaming responses**: Use Server-Sent Events for real-time streaming
- **Audit trail**: All requests/responses logged via message queues

## API Conventions
- Use `/api/` prefix for custom endpoints
- Use `/api/openai/v1/` for OpenAI-compatible endpoints  
- Use `/api/claude/v1/` for Claude-compatible endpoints
- Return JSON with `{success: boolean, data?: any, error?: any, timestamp: string}`
- Support both streaming and non-streaming responses
- Use correlation IDs for request tracking

## Environment Configuration
- Use `src/env.ts` for all environment variable parsing
- Group related configs in namespaces (e.g., `env.queue`, `env.appDb`)
- Provide sensible defaults with `parseNumber()` and `parseBoolean()` helpers
- Never commit `.env` files - use `.env.example` as template

## Do Not
- Do not modify files in `/legacy/` directory
- Do not use `localStorage` or `sessionStorage` in any artifacts  
- Do not commit API keys or secrets to version control
- Do not bypass the queue system for LLM requests
- Do not modify database schema without creating Prisma migrations
- Do not use console.log - use Winston logger instead
- Do not block the event loop with synchronous operations

## Provider Implementation
When adding new LLM providers:
- Extend `AIProvider` abstract class
- Implement required methods: `init()`, `getModels()`, `generate()`, `chat()`
- Use provider-specific streaming patterns
- Call appropriate callback methods: `onGenerate()`, `onChat()`, `onError()`
- Register in `ProviderService.refreshAvailableProviders()`
- Add configuration to `src/env.ts`

## Queue Message Format
```typescript
// Request format
{
  id: string,           // Request ID (correlation ID)
  type: 'generate' | 'chat',
  sourceId: string,     // Server ID for response routing  
  payload: {
    model: string,
    prompt?: string,    // For generate
    messages?: any[],   // For chat
    options: {},
    stream: boolean,
    provider?: string
  },
  timestamp: number
}

// Response format  
{
  type: 'token' | 'sse' | 'done' | 'error',
  provider: string,
  requestId: string,
  token: any,          // Provider-specific response chunk
  response?: any       // Final response for 'done' type
}
```

## Database Schema
- `models` - LLM model configurations
- `providers` - Provider settings and credentials
- `requests` - Request metadata and tracking
- `response_audit` - Audit logs for compliance

## Streaming Implementation
- Use `ResponseService.createResponseStream()` for request tracking
- Send chunks via `provider.sendResponseChunk()`
- Route responses using `sourceId` from request
- Clean up streams on completion or client disconnect
- Support both SSE and JSON streaming formats

## Testing Endpoints
```bash
# Test generate endpoint
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "prompt": "Hello", "stream": true}'

# Test OpenAI compatibility  
curl -X POST http://localhost:3000/api/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hi"}]}'
```

## Worker Scaling
- Workers consume from shared `llm_requests` queue
- Scale horizontally: `docker-compose up -d --scale worker=5`
- Each worker processes one request at a time
- Use `WORKER_ID` environment variable for identification
- Responses routed back via `sourceId` to correct API server