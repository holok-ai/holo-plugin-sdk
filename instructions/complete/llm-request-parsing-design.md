# LLM Request Parsing System Design

## Overview

This document outlines the design and implementation of the LLM request parsing system that handles conversion from Express HTTP requests to strongly-typed queue requests for different LLM providers (Ollama, Claude, OpenAI).

## Architecture

The parsing system consists of four main components:

1. **Type Definitions** (`/src/types/worker.request.types.ts`)
2. **Provider-Specific Parsers** (`/src/utils/ollama-parsers.ts`, `/src/utils/claude-parsers.ts`, `/src/utils/openai-parsers.ts`)
3. **Unified Request Parser** (`/src/utils/llm-request-parser.ts`)
4. **Centralized Error Handling** (`/src/utils/error-messages.ts`)

## Current Implementation

### Type System

Located in `/src/types/worker.request.types.ts`:

```typescript
// Provider enum - supports all three major LLM providers
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude',
    OPENAI = 'openai'
}

// Request type enum - eliminates magic strings
export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat'
}

// Generic worker request interface
export interface LLMWorkerRequest {
    provider: Provider;
    sourceId: string;
    requestId: string;
    type: RequestType;
    payload: LLMPayloadTypes;
    timestamp: number;
}

// Provider-specific request interfaces
export interface OllamaGenerateQueueRequest extends GenerateRequest {}
export interface OllamaChatQueueRequest extends ChatRequest {}
export interface ClaudeWorkerRequest extends MessageCreateParamsBase {}
export interface OpenAIWorkerRequest extends ChatCompletionCreateParamsBase {}

// Union type for all provider requests
export type LLMPayloadTypes = 
    | OllamaGenerateQueueRequest 
    | OllamaChatQueueRequest 
    | ClaudeWorkerRequest 
    | OpenAIWorkerRequest;
```

**Design Principles:**
- **Generic Worker Interface**: `LLMWorkerRequest` provides a common structure for all provider requests
- **Provider-Specific Payloads**: Each provider extends native library interfaces (ollama-js, @anthropic-ai/sdk, openai)
- **Type-Safe Enums**: Uses `Provider` and `RequestType` enums for compile-time safety and eliminates magic strings
- **Native Library Integration**: Interfaces extend actual SDK types for full compatibility
- **Unified Payload Union**: `LLMPayloadTypes` allows type-safe handling of all provider request types
- **Centralized Error Handling**: Standardized error messages via `ErrorMessages` class

### Provider Parser Implementations

#### Ollama Parser (`/src/utils/ollama-parsers.ts`)

**Functions:**
- `parseOllamaGenerateRequest(req: Request): OllamaGenerateQueueRequest`
- `parseOllamaChatRequest(req: Request): OllamaChatQueueRequest` 
- `parseOllamaRequest(req: Request, type: RequestType): LLMPayloadTypes`

**Key Features:**
- **Full ollama-js compatibility**: Supports all Ollama API parameters
- **Comprehensive logging**: Debug logging with request context
- **Validation**: Required fields (`model`, `prompt`/`messages`) with descriptive errors

#### Claude Parser (`/src/utils/claude-parsers.ts`)

**Functions:**
- `parseClaudeRequest(req: Request): ClaudeWorkerRequest`
- `parseClaudeMessageRequest(req: Request, type: RequestType): LLMPayloadTypes`

**Key Features:**
- **Full Anthropic API support**: All MessageCreateParamsBase fields including new features (thinking, mcp_servers, etc.)
- **Generate-to-Messages conversion**: Automatically converts generate requests to Claude's messages format
- **Advanced validation**: Service tier and MCP server format validation
- **Comprehensive parameter support**: tools, system prompts, thinking configuration, betas

#### OpenAI Parser (`/src/utils/openai-parsers.ts`)

**Functions:**
- `parseOpenAIRequest(req: Request): OpenAIWorkerRequest`
- `parseOpenAIMessageRequest(req: Request, type: RequestType): LLMPayloadTypes`

**Key Features:**
- **Full OpenAI API compatibility**: All ChatCompletionCreateParamsBase parameters
- **Generate-to-Messages conversion**: Converts generate requests to chat completions format
- **Advanced parameters**: Tools, function calling, logprobs, response formats

### Unified Request Parser

Located in `/src/utils/llm-request-parser.ts`:

**Function:**
- `parseLLMRequest(req: Request, provider: Provider, type: RequestType): LLMPayloadTypes`

**Key Features:**
- **Provider Routing**: Automatically routes to the correct provider-specific parser based on enum
- **Type Safety**: Returns strongly-typed `LLMPayloadTypes` union using RequestType enum
- **Comprehensive Logging**: Structured logging with provider/type routing information
- **Centralized Error Handling**: Uses ErrorMessages class for consistent error responses
- **Extensible Design**: Easy to add new providers by extending the switch statement

### Error Handling System

Located in `/src/utils/error-messages.ts`:

**Key Features:**
- **Centralized Messages**: All error messages defined in one location
- **Dynamic Message Generation**: Context-specific error messages (e.g., `modelNotFound(model)`, `invalidProvider(received, expected)`)
- **Consistent Format**: Standardized error structure across all parsers
- **Type Safety**: Static error constants and typed message generators

## Request Flow

```
Express HTTP Request
    ↓
parseLLMRequest (routes by provider enum)
    ↓
Provider-Specific Parser (validate + transform + log)
    ↓ 
ErrorMessages validation (if errors)
    ↓
Typed LLMPayloadTypes Object
    ↓
Wrapped in LLMWorkerRequest (by ResponseService)
    ↓
RabbitMQ Serialization (with timestamp)
    ↓
Worker Deserialization 
    ↓
Provider Implementation (via AIProvider pattern)
    ↓
Native SDK API Call (ollama-js, @anthropic-ai/sdk, openai)
```

## File Structure

```
src/
├── types/
│   ├── worker.request.types.ts    # Type definitions, enums
│   └── index.ts                     # Export types
├── utils/
│   ├── ollama-parsers.ts           # Ollama-specific parsers
│   ├── claude-parsers.ts           # Claude-specific parsers  
│   ├── openai-parsers.ts           # OpenAI-specific parsers
│   ├── llm-request-parser.ts       # Unified request parser
│   ├── error-messages.ts           # Centralized error handling
│   └── index.ts                    # Export all parsers
├── providers/
│   ├── ai.provider.ts              # Abstract base provider
│   ├── ollama.provider.ts          # Ollama implementation
│   ├── claude.provider.ts          # Claude implementation
│   └── openai.provider.ts          # OpenAI implementation
```

## Usage Examples

### Using the Unified Parser (Recommended)
```typescript
import { parseLLMRequest, Provider, RequestType } from '../utils';

// For any provider - routes automatically using enums
const payload = parseLLMRequest(req, Provider.OLLAMA, RequestType.GENERATE);
// Result: LLMPayloadTypes (strongly typed based on provider)

// Used in ResponseService:
const workerRequest: LLMWorkerRequest = {
    provider: Provider.OLLAMA,
    sourceId: env.api.apiServerId,
    requestId: uuidv4(),
    type: RequestType.GENERATE,
    payload,
    timestamp: Date.now()
};
```

### Direct Provider-Specific Parsing
```typescript
import { parseOllamaGenerateRequest, parseClaudeRequest, parseOpenAIRequest } from '../utils';

// Ollama parsing
const ollamaRequest = parseOllamaGenerateRequest(req);
// Result: OllamaGenerateQueueRequest

// Claude parsing (supports all new Anthropic features)
const claudeRequest = parseClaudeRequest(req);
// Result: ClaudeWorkerRequest with thinking, mcp_servers, etc.

// OpenAI parsing
const openaiRequest = parseOpenAIRequest(req);  
// Result: OpenAIWorkerRequest with tools, function calling, etc.
```

### Error Handling Usage
```typescript
import { ErrorMessages } from '../utils/error-messages';

// Standardized error messages
throw new Error(ErrorMessages.MODEL_REQUIRED);
throw new Error(ErrorMessages.modelNotFound('gpt-4'));
throw new Error(ErrorMessages.invalidProvider('invalid', Provider.OPENAI));
```

## Implementation Status

### ✅ Completed Features
- **All Provider Support**: Ollama, Claude, OpenAI parsers fully implemented
- **Type Safety**: RequestType and Provider enums eliminate magic strings
- **Native SDK Integration**: All parsers extend actual SDK interfaces
- **Comprehensive Validation**: Required field validation with descriptive errors
- **Centralized Error Handling**: ErrorMessages class for consistent error responses
- **Unified Parser**: Single entry point routing to provider-specific parsers
- **Advanced Feature Support**: 
  - Claude: thinking, MCP servers, service tiers, tools, system prompts
  - OpenAI: tools, function calling, logprobs, response formats
  - Ollama: full API parameter support
- **Comprehensive Logging**: Structured debug logging with request context
- **JSDoc Documentation**: All public methods fully documented

### 🔄 Current Features
- **Request Flow**: HTTP → Parser → Validation → Queue → Worker → Provider SDK
- **Stream Support**: All providers support streaming and non-streaming requests
- **Generate-to-Chat Conversion**: Claude and OpenAI automatically convert generate requests
- **Provider Pattern Integration**: Parsers work seamlessly with AIProvider architecture

### 🚀 Future Enhancements
- **Schema Validation**: JSON schema validation for complex nested parameters
- **Request Caching**: Cache parsed requests for performance optimization
- **Rate Limiting Integration**: Parser-level rate limiting based on request complexity
- **Dynamic Provider Loading**: Plugin-style provider registration
- **Request Transformation**: Middleware for request preprocessing

---

**Note**: This document should be updated whenever changes are made to the parsing functionality, type definitions, or parser implementations.
