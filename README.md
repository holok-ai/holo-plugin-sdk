# LLM Proxy Server

A scalable, distributed LLM proxy server built with TypeScript that provides unified access to multiple Large Language Model providers through standardized APIs. The system uses RabbitMQ for distributed processing and PostgreSQL for audit logging.

## 🏗️ Architecture Overview

The LLM Proxy Server follows a distributed microservices architecture with queue-based request/response handling:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   RabbitMQ      │    │   Worker Nodes  │
│   (Express)     │◄──►│   (Message      │◄──►│   (LLM          │
│   + Guards      │    │    Broker)      │    │    Processing)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Audit Service │    │   LLM Providers │
│   (Database)    │    │   (Logging)     │    │   (OpenAI,      │
│                 │    │                 │    │    Claude,      │
│                 │    │                 │    │    Ollama)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **API Server** (`src/app.ts`): Express.js application handling requests and responses
   - JWT authentication and request validation
   - Listens on response exchange for worker responses
   - Parses provider-specific responses
   - Pipes responses to clients via SSE
2. **Guard System** (`src/admin/`): App-level authorization guards run on LLM requests
3. **Worker Server** (`src/servers/worker.server.ts`):
   - Consumes requests from request queue
   - Enforces guard results
   - Calls provider APIs or generates errors
   - Publishes responses to response exchange
4. **Audit Server** (`src/servers/audit.server.ts`): Logs all requests and responses for compliance
5. **Provider Services** (`src/providers/`): Provider-specific LLM API implementations
6. **Queue Service** (`src/services/queue.service.ts`): RabbitMQ message handling
7. **Response Service** (`src/services/response.service.ts`): Listens on response exchange, filters by request_id
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
  - **If Passed**: Forward request to provider API (OpenAI/Claude/Ollama)
  - **If Failed**: Generate provider-native error response without calling provider
- **Response Format**: Errors returned in provider-specific format (OpenAI error structure, Claude error structure, etc.)
- **Purpose**: Prevent unauthorized API calls while maintaining provider compatibility

This two-stage approach ensures:
1. **Early validation**: Guards execute at API server for quick feedback
2. **Enforcement at worker**: Guard results checked before expensive provider API calls
3. **Provider-native errors**: Failures returned in format matching the requested provider
4. **Cost savings**: Blocked requests never reach paid provider APIs

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
- **Claude**: Anthropic's Claude models via their API
- **Ollama**: Local model hosting integration
- **Extensible**: Easy to add new providers

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

### Request Translation System
- **Unified Request Format**: All providers use `LLMWorkerRequest` format
- **Provider-Specific Translators**: Automatic field extraction for each provider
- **Database Integration**: Seamless conversion to audit database schema
- **Type Safety**: Full TypeScript support with proper type checking

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

When adding a new LLM provider, you'll need to implement several components to ensure full integration with the proxy system. Follow these steps in order:

#### Step 1: Add Provider Enum Value

1. **Update Provider Enum** (`src/types/worker.types.ts`):
```typescript
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude', 
    OPENAI = 'openai',
    NEW_PROVIDER = 'newprovider'  // Add your new provider here
}
```

#### Step 2: Define Request Types

2. **Add Provider-Specific Request Interfaces** (`src/types/worker.types.ts`):
```typescript
// Add interfaces for your provider's request formats
export interface NewProviderGenerateRequest {
    model: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    // Add provider-specific parameters
}

export interface NewProviderChatRequest {
    model: string;
    messages: Array<{role: string, content: string}>;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    // Add provider-specific parameters
}

// Update the union type to include your new request types
export type LLMPayloadTypes = 
    | OllamaGenerateQueueRequest 
    | OllamaChatQueueRequest 
    | ClaudeWorkerRequest 
    | OpenAIWorkerRequest
    | NewProviderGenerateRequest  // Add here
    | NewProviderChatRequest;     // Add here
```

#### Step 3: Create Request Parser

3. **Create Parser** (`src/utils/new-provider-parsers.ts`):
```typescript
import { Request } from 'express';
import { NewProviderGenerateRequest, NewProviderChatRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import logger from './logger';

/**
 * Parses an Express request body into a NewProvider Generate request format.
 * @param req - Express request object containing the request body
 * @returns Parsed NewProviderGenerateRequest with validated parameters
 * @throws Error when required fields are missing
 */
export const parseNewProviderGenerateRequest = (req: Request): NewProviderGenerateRequest => {
    const { model, prompt, temperature, max_tokens, stream } = req.body;
    
    logger.debug('Parsing NewProvider generate request', {
        model,
        promptLength: prompt?.length,
        stream: stream ?? false
    });
    
    if (!model) {
        logger.error('NewProvider generate request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!prompt) {
        logger.error('NewProvider generate request validation failed: missing prompt');
        throw new Error(ErrorMessages.PROMPT_REQUIRED);
    }

    const parsedRequest = {
        model,
        prompt,
        temperature,
        max_tokens,
        stream: stream ?? false
    };
    
    logger.debug('Successfully parsed NewProvider generate request', {
        model,
        stream: parsedRequest.stream
    });
    
    return parsedRequest;
};

/**
 * Parses an Express request body into a NewProvider Chat request format.
 * @param req - Express request object containing the request body
 * @returns Parsed NewProviderChatRequest with validated messages
 * @throws Error when required fields are missing or invalid
 */
export const parseNewProviderChatRequest = (req: Request): NewProviderChatRequest => {
    const { model, messages, temperature, max_tokens, stream } = req.body;
    
    logger.debug('Parsing NewProvider chat request', {
        model,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        stream: stream ?? false
    });
    
    if (!model) {
        logger.error('NewProvider chat request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        logger.error('NewProvider chat request validation failed: missing or invalid messages array');
        throw new Error(ErrorMessages.MESSAGES_REQUIRED);
    }

    const parsedRequest = {
        model,
        messages,
        temperature,
        max_tokens,
        stream: stream ?? false
    };
    
    logger.debug('Successfully parsed NewProvider chat request', {
        model,
        messageCount: messages.length,
        stream: parsedRequest.stream
    });
    
    return parsedRequest;
};

/**
 * Routes Express requests to the appropriate NewProvider parser based on request type.
 * @param req - Express request object containing the request body
 * @param type - RequestType enum indicating GENERATE or CHAT request
 * @returns Parsed LLMPayloadTypes from the appropriate parser
 */
export const parseNewProviderRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing NewProvider request', { type });
    
    if (type === RequestType.GENERATE) {
        return parseNewProviderGenerateRequest(req);
    } else {
        return parseNewProviderChatRequest(req);
    }
};
```

4. **Update Unified Parser** (`src/utils/llm-request-parser.ts`):
```typescript
import { parseNewProviderRequest } from './new-provider-parsers';

export const parseLLMRequest = (
    req: Request, 
    provider: Provider, 
    type: RequestType
): LLMPayloadTypes => {
    logger.debug('Unified LLM request parser routing', { provider, type });
    
    switch (provider) {
        case Provider.OLLAMA:
            return parseOllamaRequest(req, type);
        case Provider.CLAUDE:
            return parseClaudeMessageRequest(req, type);
        case Provider.OPENAI:
            return parseOpenAIMessageRequest(req, type);
        case Provider.NEW_PROVIDER:  // Add your case here
            return parseNewProviderRequest(req, type);
        default:
            logger.error('Unsupported provider in unified parser', { provider });
            throw new Error(ErrorMessages.unsupportedProvider(provider));
    }
};
```

#### Step 4: Create Request Translator

4. **Create Request Translator** (`src/translators/providers/new-provider.auditors.ts`):
```typescript
import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';

@injectable()
export class NewProviderRequestTranslator extends BaseRequestTranslator {
    readonly provider = Provider.NEW_PROVIDER;

    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        // Set common fields
        this.setCommonFields(workerRequest, llmRequest);

        const payload = workerRequest.payload as NewProviderRequest;
        
        // Extract provider-specific fields
        llmRequest.model_slug = payload.model;
        llmRequest.user_prompt = this.extractUserPrompt(payload);
        llmRequest.system_prompt = this.extractSystemPrompt(payload);
        llmRequest.options = payload.options || {};
    }

    private extractUserPrompt(payload: NewProviderRequest): string | undefined {
        // Provider-specific logic to extract user prompt
        return payload.prompt || payload.messages?.[0]?.content;
    }

    private extractSystemPrompt(payload: NewProviderRequest): string | undefined {
        // Provider-specific logic to extract system prompt
        return payload.system;
    }
}
```

5. **Register Translator** (`src/translators/auditor.registry.ts`):
```typescript
// Add to constructor and initializeTranslators method
constructor(
    private newProviderTranslator: NewProviderRequestTranslator,
    // ... other translators
) {
    this.initializeTranslators();
}

private initializeTranslators(): void {
    this.translators.set(Provider.NEW_PROVIDER, this.newProviderTranslator);
    // ... other translators
}
```

#### Step 5: Implement Provider Class

6. **Create Provider Class** (`src/providers/new-provider.provider.ts`):
```typescript
import AIProvider from './ai.provider';
import { IProvider, ModelInfo, AIProviderConfig, AIRequestStat } from './types';
import { LLMWorkerRequest, Provider, RequestType } from '../types';

export class NewProvider extends AIProvider implements IProvider {
  readonly name: string = 'newprovider';
  
  async init(): Promise<void> {
    // Initialize provider client and load models
    await this.getModels();
  }
  
  async getModels(): Promise<ModelInfo[]> {
    // Fetch available models and update this.models cache
    // Return array of ModelInfo objects
  }
  
  async handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat> {
    // Validate provider matches
    if (request.provider !== Provider.NEW_PROVIDER) {
      throw new Error(`Invalid provider: expected ${Provider.NEW_PROVIDER}, got ${request.provider}`);
    }
    
    const { sourceId, requestId, payload, type } = request;
    
    if (type === RequestType.GENERATE) {
      return await this.wrapWithStats(RequestType.GENERATE, this._newProviderGenerate.bind(this), sourceId, requestId, payload);
    } else if (type === RequestType.CHAT) {
      return await this.wrapWithStats(RequestType.CHAT, this._newProviderChat.bind(this), sourceId, requestId, payload);
    } else {
      throw new Error(`Unsupported request type: ${type}`);
    }
  }
  
  /**
   * Implementation following _<provider><clientMethod> naming convention
   */
  private async _newProviderGenerate(sourceId: string, requestId: string, payload: NewProviderGenerateRequest): Promise<void> {
    await this.ensureInitialized();
    this.validateModel(payload.model);
    
    logger.debug('Starting NewProvider generate stream', { requestId, model: payload.model });
    
    try {
      // Implement your provider's generation logic here
      // Example streaming pattern:
      if (payload.stream) {
        // Initialize streaming response
        for await (const chunk of yourProviderStreamingCall(payload)) {
          if (chunk.done) {
            logger.debug('NewProvider generate stream completed', { requestId });
            const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.NEW_PROVIDER, chunk, fullResponse);
            await this.onResponseChunk(responseChunk);
            break;
          }
          
          const token = chunk.content;
          const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.NEW_PROVIDER, chunk);
          await this.onResponseChunk(responseChunk);
        }
      } else {
        // Non-streaming response
        const response = await yourProviderCall(payload);
        const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.NEW_PROVIDER, response, response.content);
        await this.onResponseChunk(responseChunk);
      }
    } catch (error) {
      logger.error('NewProvider generate error', { 
        requestId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
  
  private async _newProviderChat(sourceId: string, requestId: string, payload: NewProviderChatRequest): Promise<void> {
    await this.ensureInitialized();
    this.validateModel(payload.model);
    
    logger.debug('Starting NewProvider chat stream', { requestId, model: payload.model });
    
    try {
      // Implement your provider's chat logic here
      // Similar pattern to generate method above
    } catch (error) {
      logger.error('NewProvider chat error', { 
        requestId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }
}
```

#### Step 5: Update Stream Formatter

6. **Add Stream Formatting** (`src/services/stream.formatter.service.ts`):
```typescript
// Add your provider case to the formatAndSend method
async formatAndSend(responseChunk: LLMWorkerResponse, res: ResponseStream) {
    try {
        switch(responseChunk.provider) {
            case Provider.OLLAMA:
                this.streamOllama(responseChunk, res);
                break;
            case Provider.CLAUDE:
                this.streamClaude(responseChunk, res);
                break;
            case Provider.OPENAI:
                this.streamOpenAI(responseChunk, res);
                break;
            case Provider.NEW_PROVIDER:  // Add your case here
                this.streamNewProvider(responseChunk, res);
                break;
            default:
                logger.error(`No stream formatter for provider: ${responseChunk.provider}`);
                throw new Error(ErrorMessages.unsupportedProvider(responseChunk.provider));
        }
    } catch (error) {
        // Error handling...
    }
}

// Add your streaming method
streamNewProvider(responseChunk: LLMWorkerResponse, res: ResponseStream) {
    try {
        const chunk = responseChunk.payload as any; // Type according to your provider's response format
        
        // Format according to your provider's streaming protocol
        res.push(`data: ${JSON.stringify(chunk)}\\n\\n`);
        
        // Check for completion condition (varies by provider)
        if (chunk.done || chunk.finish_reason || responseChunk.fullResponse !== undefined) {
            logger.debug('NewProvider streaming complete: closing response stream');
            res.end();
        }
    } catch (error) {
        logger.error(`NewProvider streaming error: ${(error as Error).message}`, {
            requestId: responseChunk.requestId
        });
        throw error;
    }
}
```

#### Step 6: Register Provider Service

```typescript
// Add to refreshAvailableProviders method
if (provider.name === 'newprovider') {
  const aiProvider = new NewProvider(provider.config, this.responseService, serverId);
  await aiProvider.init();
  this.aiProviders.set('newprovider', aiProvider);
}
```

#### Step 7: Add Configuration Support

8. **Add Configuration** (`src/env.ts` or configuration system):
```typescript
// Add environment variable support for your provider
export namespace newProvider {
  export const apiKey = process.env.NEW_PROVIDER_API_KEY;
  export const baseUrl = process.env.NEW_PROVIDER_BASE_URL || 'https://api.newprovider.com';
  export const timeout = parseInt(process.env.NEW_PROVIDER_TIMEOUT || '60000');
}
```

9. **Update Environment Variables** (`.env` file):
```bash
# New Provider Configuration
NEW_PROVIDER_API_KEY=your_new_provider_api_key
NEW_PROVIDER_BASE_URL=https://api.newprovider.com
NEW_PROVIDER_TIMEOUT=60000
```

### Integration Checklist

When adding a new provider, ensure you complete ALL of these steps:

- [ ] **Provider Enum**: Added new provider value to `Provider` enum
- [ ] **Request Types**: Created provider-specific request interfaces 
- [ ] **Type Union**: Updated `LLMPayloadTypes` union type to include new request types
- [ ] **Request Parser**: Created dedicated parser file with proper validation and logging
- [ ] **Unified Parser**: Updated `parseLLMRequest()` to handle new provider
- [ ] **Request Translator**: Created translator class extending `BaseRequestTranslator`
- [ ] **Translator Registration**: Added translator to `TranslatorRegistry` constructor and initialization
- [ ] **Provider Class**: Implemented provider class following `_<provider><clientMethod>` naming convention
- [ ] **Stream Formatter**: Added streaming support in `StreamFormatter` service
- [ ] **Provider Registration**: Updated provider service to instantiate new provider
- [ ] **Configuration**: Added environment variables and configuration support
- [ ] **Documentation**: Updated API documentation and examples
- [ ] **Testing**: Added unit tests for parser, provider, translator, and streaming functionality

### Common Integration Patterns

**Request Validation**: All providers should validate required fields and log validation failures:
```typescript
if (!model) {
    logger.error('Provider request validation failed: missing model');
    throw new Error(ErrorMessages.MODEL_REQUIRED);
}
```

**Error Handling**: Use consistent error handling with proper logging:
```typescript
try {
    // Provider logic
} catch (error) {
    logger.error('Provider operation failed', { 
        requestId, 
        error: (error as Error).message 
    });
    throw error;
}
```

**Streaming Pattern**: Follow the established streaming pattern with proper lifecycle logging:
```typescript
logger.debug('Starting provider stream', { requestId, model });
// ... streaming logic ...
logger.debug('Provider stream completed', { requestId });
```

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
