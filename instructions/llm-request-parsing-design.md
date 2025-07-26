# LLM Request Parsing System Design

## Overview

This document outlines the design and implementation of the LLM request parsing system that handles conversion from Express HTTP requests to strongly-typed queue requests for different LLM providers.

## Architecture

The parsing system consists of three main components:

1. **Type Definitions** (`/src/types/provider-request.types.ts`)
2. **Provider-Specific Parsers** (`/src/utils/ollama-parsers.ts`, etc.)
3. **Unified Export** (`/src/utils/index.ts`)

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

// Union type for all Ollama queue requests
export type OllamaQueueRequest = OllamaGenerateQueueRequest | OllamaChatQueueRequest;
```

**Design Principles:**
- Extends native ollama-js interfaces (`GenerateRequest`, `ChatRequest`)
- Adds queue metadata (`provider`, `sourceId`, `requestId`, `type`)
- Uses enum for type-safe provider identification
- Maintains type safety throughout the request pipeline

### Ollama Parser Implementation

Located in `/src/utils/ollama-parsers.ts`:

**Functions:**
- `parseOllamaGenerateRequest(req: Request): OllamaGenerateQueueRequest`
- `parseOllamaChatRequest(req: Request): OllamaChatQueueRequest`
- `parseOllamaRequest(req: Request, type: 'generate' | 'chat'): OllamaQueueRequest`

**Key Features:**
- **Validation**: Ensures required fields (`model`, `prompt`/`messages`) are present
- **Fallback Handling**: Sources `sourceId` from body → header → default 'api'
- **UUID Generation**: Auto-generates `requestId` if not provided
- **Type Safety**: Returns strongly-typed objects compatible with ollama-js

## Request Flow

```
Express HTTP Request
    ↓
Parser Function (validate + transform)
    ↓
Typed Queue Request Object
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
│   ├── parsers.ts              # General parsing utilities
│   └── index.ts                # Export all parsers
```

## Usage Examples

### Generate Request
```typescript
import { parseOllamaGenerateRequest } from '../utils';

const queueRequest = parseOllamaGenerateRequest(req);
// Result: OllamaGenerateQueueRequest with sourceId, requestId, type + all ollama fields
```

### Chat Request
```typescript
import { parseOllamaChatRequest } from '../utils';

const queueRequest = parseOllamaChatRequest(req);
// Result: OllamaChatQueueRequest with sourceId, requestId, type + all ollama fields
```

## Future Enhancements

### Planned Provider Support
- OpenAI parser (`/src/utils/openai-parsers.ts`)
- Claude parser (`/src/utils/claude-parsers.ts`)

### Type System Extensions
```typescript
// Future unified type system
export type LLMQueueRequest = 
    | OllamaQueueRequest 
    | OpenAIQueueRequest 
    | ClaudeQueueRequest;
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