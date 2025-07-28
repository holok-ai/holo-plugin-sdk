# LLM Request Parsing System Design

## Overview

This document outlines the design and implementation of the LLM request parsing system that handles conversion from Express HTTP requests to strongly-typed queue requests for different LLM providers.

## Architecture

The parsing system consists of three main components:

1. **Type Definitions** (`/src/types/provider-request.types.ts`)
2. **Provider-Specific Parsers** (`/src/utils/ollama-parsers.ts`, etc.)
3. **Unified Request Parser** (`/src/utils/llm-request-parser.ts`)
4. **Unified Export** (`/src/utils/index.ts`)

## Current Implementation

### Type System

Located in `/src/types/provider-request.types.ts`:

```typescript
// Provider enum
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude',
    OPENAI = 'openai'
}

// Generic worker request interface
export interface LLMWorkerRequest {
    provider: Provider;
    sourceId: string;
    requestId: string;
    type: string;
    payload: LLMPayloadTypes;
}

// Extended Ollama request types with additional queue metadata
export interface OllamaGenerateQueueRequest extends GenerateRequest {
    provider: Provider.OLLAMA;
    sourceId: string;
    requestId: string;
    type: 'generate';
}

export interface OllamaChatQueueRequest extends ChatRequest {
    provider: Provider.OLLAMA;
    sourceId: string;
    requestId: string;
    type: 'chat';
}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes = OllamaGenerateQueueRequest | OllamaChatQueueRequest;
```

**Design Principles:**
- **Generic Worker Interface**: `LLMWorkerRequest` provides a common structure for all provider requests
- **Provider-Specific Payloads**: Each provider extends native library interfaces (e.g., ollama-js `GenerateRequest`, `ChatRequest`)
- **Type-Safe Provider Identification**: Uses `Provider` enum for compile-time safety
- **Unified Payload Union**: `LLMPayloadTypes` allows type-safe handling of all provider request types
- **Queue Metadata**: Adds `provider`, `sourceId`, `requestId`, `type` for routing and tracking

### Ollama Parser Implementation

Located in `/src/utils/ollama-parsers.ts`:

**Functions:**
- `parseOllamaGenerateRequest(req: Request): OllamaGenerateQueueRequest`
- `parseOllamaChatRequest(req: Request): OllamaChatQueueRequest`
- `parseOllamaRequest(req: Request, type: 'generate' | 'chat'): LLMPayloadTypes`

**Key Features:**
- **Validation**: Ensures required fields (`model`, `prompt`/`messages`) are present
- **Type Safety**: Returns strongly-typed objects compatible with ollama-js
- **Simplified Interface**: Removed duplicative metadata fields

### Unified Request Parser

Located in `/src/utils/llm-request-parser.ts`:

**Function:**
- `parseLLMRequest(req: Request, provider: Provider, type: 'generate' | 'chat'): LLMPayloadTypes`

**Key Features:**
- **Provider Routing**: Automatically routes to the correct provider-specific parser based on enum
- **Type Safety**: Returns strongly-typed `LLMPayloadTypes` union
- **Extensible**: Easy to add new providers by extending the switch statement
- **Error Handling**: Throws descriptive errors for unsupported providers

## Request Flow

```
Express HTTP Request
    ↓
parseLLMRequest (routes by provider)
    ↓
Provider-Specific Parser (validate + transform)
    ↓
Typed LLMPayloadTypes Object
    ↓
Wrapped in LLMWorkerRequest (by caller)
    ↓
RabbitMQ Serialization
    ↓
Worker Deserialization
    ↓
Provider API Call
```

## File Structure

```
src/
├── types/
│   ├── provider-request.types.ts    # Type definitions
│   └── index.ts                     # Export types
├── utils/
│   ├── ollama-parsers.ts       # Ollama-specific parsers
│   ├── llm-request-parser.ts   # Unified request parser
│   ├── parsers.ts              # General parsing utilities
│   └── index.ts                # Export all parsers
```

## Usage Examples

### Using the Unified Parser (Recommended)
```typescript
import { parseLLMRequest, Provider } from '../utils';

// For any provider - routes automatically
const payload = parseLLMRequest(req, Provider.OLLAMA, 'generate');
// Result: LLMPayloadTypes (strongly typed based on provider)

// Can be used in response.service.ts:
const workerRequest: LLMWorkerRequest = {
    provider: Provider.OLLAMA,
    sourceId: 'api-server-1',
    requestId: uuidv4(),
    type: 'generate',
    payload,
    timestamp: Date.now()
};
```

### Direct Provider-Specific Parsing
```typescript
import { parseOllamaGenerateRequest } from '../utils';

const queueRequest = parseOllamaGenerateRequest(req);
// Result: OllamaGenerateQueueRequest with all ollama fields
```

## Future Enhancements

### Planned Provider Support
- OpenAI parser (`/src/utils/openai-parsers.ts`)
- Claude parser (`/src/utils/claude-parsers.ts`)

### Type System Extensions
```typescript
// Future provider-specific request types
export interface OpenAIGenerateQueueRequest extends OpenAIGenerateRequest {
    provider: Provider.OPENAI;
    sourceId: string;
    requestId: string;
    type: 'generate';
}

export interface ClaudeChatQueueRequest extends ClaudeChatRequest {
    provider: Provider.CLAUDE;
    sourceId: string;
    requestId: string;
    type: 'chat';
}

// Updated union type will include all providers
export type LLMPayloadTypes = 
    | OllamaGenerateQueueRequest 
    | OllamaChatQueueRequest
    | OpenAIGenerateQueueRequest
    | OpenAIChatQueueRequest
    | ClaudeGenerateQueueRequest
    | ClaudeChatQueueRequest;
```

### Parser Factory Pattern
```typescript
// Future factory implementation
export const createParser = (provider: string) => {
    switch (provider) {
        case 'ollama': return parseOllamaRequest;
        case 'openai': return parseOpenAIRequest;
        case 'claude': return parseClaudeRequest;
    }
};
```

## Implementation Status

- ✅ Ollama type definitions
- ✅ Ollama request parsers (generate + chat)
- ✅ Type safety validation
- ✅ Queue metadata injection
- ⏳ OpenAI parser (planned)
- ⏳ Claude parser (planned)
- ⏳ Unified parser factory (planned)

---

**Note**: This document should be updated whenever changes are made to the parsing functionality, type definitions, or parser implementations.