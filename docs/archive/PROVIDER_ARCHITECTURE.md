# Provider Architecture Analysis

## Overview

The llm-proxy uses a **universal provider pattern** with bidirectional translation between a canonical "Holo" format and provider-specific formats (OpenAI, Claude, Ollama, etc.).

## Core Architecture Components

### 1. Base Provider Pattern

**File**: `src/providers/ai.provider.ts`

Every provider extends `AIProvider` abstract class which implements `IProvider` interface:

```typescript
interface IProvider {
    name: string;
    config: AIProviderConfig;

    init(): Promise<void>;
    getModels(): Promise<ModelInfo[]>;
    processRequest(request: LLMWorkerRequest): Promise<AIRequestStat | null>;
    handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat>;
    onResponseChunk(responseChunk: LLMWorkerResponse): Promise<void>;
}
```

**Key Methods**:
- `init()` - Initialize provider and fetch models
- `getModels()` - Fetch and cache available models
- `handleLLMRequest()` - Main entry point for processing requests
- `wrapWithStats()` - Wrapper for timing and error handling
- `onResponseChunk()` - Send responses back to response service
- `createWorkerResponse()` - Create standardized response objects

### 2. Universal "Holo" Format

**Files**: `src/providers/holo/types/`

The Holo format serves as the **canonical intermediate representation** that all providers translate to/from.

**HoloRequest** (portable chat surface):
- `model: string` - Required model identifier
- `messages?: HoloMessage[]` - Conversation history
- `temperature?: number` - 0.0-2.0
- `top_p?: number` - 0.0-1.0
- `stream?: boolean` - Enable streaming
- `tools?: HoloTool[]` - Tool definitions
- `system?: string` - System prompt (top-level)
- `max_tokens?: number` - Max output tokens
- `stop_sequences?: string[]` - Stop sequences
- `response_format?: HoloResponseFormat` - JSON/text output control
- `tool_choice?: HoloToolChoice` - Tool selection strategy
- `metadata?: HoloRequestMetadata` - User metadata

**HoloMessage**:
- `role: 'user' | 'assistant' | 'tool'`
- `content: string | HoloContent[]` - Text or structured content
- `tool_calls?: HoloToolCall[]` - For assistant messages
- `tool_call_id?: string` - For tool response messages

**HoloContent** (Union):
- `HoloContentText` - Plain text
- `HoloContentImage` - Image URL or base64

**HoloResponse**:
- `id: string`
- `model: string`
- `role: 'assistant'`
- `content: HoloContent[]`
- `stop_reason?: string`
- `usage?: HoloUsage`

### 3. Translation Pattern

**Files**: `src/providers/{provider}/translators/`

Each provider implements translators that extend `BaseTranslator<Source, Target>`:

```typescript
abstract class BaseTranslator<S, T> {
    protected abstract holoValidator: Type<S>;
    protected abstract providerValidator: Type<T>;

    async fromHolo(source: S): Promise<Partial<T>>;
    async toHolo(source: T): Promise<Partial<S>>;

    protected abstract fromHoloImpl(source: S): Promise<Partial<T>>;
    protected abstract toHoloImpl(source: T): Promise<Partial<S>>;
}
```

**Translator Types** (per provider):
- **RequestTranslator** - Translate HoloRequest ↔ ProviderRequest
- **ResponseTranslator** - Translate HoloResponse ↔ ProviderResponse
- **MessageTranslator** - Translate HoloMessage[] ↔ ProviderMessage[]
- **ContentTranslator** - Translate HoloContent ↔ ProviderContent
- **ToolTranslator** - Translate HoloTool ↔ ProviderTool
- **StreamTranslator** - Translate streaming chunks

**Example**: OpenAI Request Translation Flow:
1. Receive `HoloRequest`
2. `OpenAIRequestTranslator.fromHolo()` validates and transforms
3. Maps system prompt, messages, tools, parameters
4. Returns `OpenAIChatRequest` (provider format)
5. Provider sends to OpenAI API
6. Reverse: `toHolo()` converts OpenAI response back to Holo

### 4. Provider Implementation Pattern

**Example**: `src/providers/openai/openai.provider.ts`

```typescript
export class OpenAIProvider extends AIProvider {
    protected readonly client: OpenAI;  // SDK client

    constructor(provider: Provider, responseService: ResponseService, workerId: string) {
        super(provider, responseService, workerId);
        this.client = new OpenAI({ apiKey: this.config.apiKey });
    }

    async init(): Promise<void> {
        await this.getModels();  // Fetch and cache models
    }

    async getModels(): Promise<ModelInfo[]> {
        const response = await this.client.models.list();
        this.models = response.data.reduce(...);  // Cache models
        return modelList;
    }

    async handleLLMRequest(sourceId, requestId, payload, type): Promise<AIRequestStat> {
        const openaiPayload = payload as OpenAIChatRequest;
        return await this.wrapWithStats(type, this._openaiChatCompletions.bind(this),
                                       sourceId, requestId, openaiPayload);
    }

    async _openaiChatCompletions(sourceId, requestId, chatRequest): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(chatRequest.model);

        const response = await this.client.chat.completions.create(chatRequest);

        if (chatRequest.stream) {
            for await (const chunk of response) {
                const responseChunk = this.createWorkerResponse(sourceId, requestId,
                                                                ProviderType.OPENAI, chunk);
                await this.onResponseChunk(responseChunk);
            }
        } else {
            const responseChunk = this.createWorkerResponse(sourceId, requestId,
                                                           ProviderType.OPENAI, response);
            await this.onResponseChunk(responseChunk, true);
        }
    }
}
```

### 5. Type System

**Provider Types**: `src/providers/{provider}/types/`
- Each provider has its own type definitions mirroring the SDK types
- Types are validated using ArkType validators

**Example OpenAI Types**:
- `OpenAIChatRequest` - Chat completions API request
- `OpenAIChatCompletionResponse` - Non-streaming response
- `OpenAIChatCompletionChunk` - Streaming chunk
- `OpenAIRequestMessage` - Message format
- `OpenAIResponseFormat` - Response formatting options

**Validators**: `src/providers/{provider}/validators/`
- ArkType validators ensure runtime type safety
- Validators satisfy TypeScript types using `satisfies Type<>`
- Used in translators for validation

### 6. Request Flow

```
Client Request (HTTP)
    ↓
LLMWorkerRequest { sourceId, requestId, payload: ProviderRequest, type }
    ↓
AIProvider.processRequest()
    ↓
Validate with ProviderRequestValidator.assert(payload)
    ↓
AIProvider.handleLLMRequest(sourceId, requestId, payload, type)
    ↓
Cast to provider-specific type (e.g., OpenAIChatRequest)
    ↓
wrapWithStats(type, method, ...args)
    ↓
Provider-specific method (e.g., _openaiChatCompletions)
    ↓
Call provider SDK (openai.chat.completions.create())
    ↓
Process response (streaming or non-streaming)
    ↓
createWorkerResponse() - wrap in LLMWorkerResponse
    ↓
onResponseChunk() - send to ResponseService
    ↓
ResponseService.sendResponseChunk()
    ↓
Client receives response
```

### 7. Translation Flow (Bidirectional)

**Incoming Translation** (External Format → Holo → Provider):
```
External Request (e.g., OpenAI format from client)
    ↓
OpenAIRequestTranslator.toHolo() - Convert to HoloRequest
    ↓
HoloRequest (canonical format)
    ↓
ClaudeRequestTranslator.fromHolo() - Convert to Claude format
    ↓
Claude API Call
```

**Outgoing Translation** (Provider → Holo → External):
```
Claude API Response
    ↓
ClaudeResponseTranslator.toHolo() - Convert to HoloResponse
    ↓
HoloResponse (canonical format)
    ↓
OpenAIResponseTranslator.fromHolo() - Convert to OpenAI format
    ↓
Return to client
```

## Key Design Patterns

### 1. **Template Method Pattern**
- `AIProvider` defines skeleton in `processRequest()` and `wrapWithStats()`
- Subclasses implement specific steps: `handleLLMRequest()`, provider-specific methods

### 2. **Strategy Pattern**
- Different translation strategies for each provider
- Translators are injected dependencies (DI with tsyringe)

### 3. **Factory Pattern**
- `WorkerResponseFactory.create()` - Creates standardized responses
- Provider-specific factories for requests/responses

### 4. **Adapter Pattern**
- Each provider adapter converts between SDK and internal formats
- Translators act as adapters between Holo and provider formats

### 5. **Dependency Injection**
- Uses `tsyringe` for DI
- Translators are `@injectable()` classes
- Providers receive `ResponseService` and configuration

## Important Conventions

1. **Validation First**: Always validate requests with provider validators before processing
2. **Statistics Wrapper**: Use `wrapWithStats()` for all provider methods to track timing/errors
3. **Error Handling**: Errors trigger `onError()` which sends standardized error responses
4. **Model Caching**: Models fetched once during `init()` and cached in `this.models`
5. **Streaming Support**: Handle both streaming and non-streaming in same method
6. **Worker Responses**: Always wrap responses in `LLMWorkerResponse` using `createWorkerResponse()`
7. **Audit Flag**: Final responses should set audit flag for persistence

## Provider Checklist

When implementing a new provider:

- [ ] Create provider class extending `AIProvider`
- [ ] Implement SDK client initialization
- [ ] Implement `init()` and `getModels()`
- [ ] Implement `handleLLMRequest()` dispatcher
- [ ] Create provider-specific request method (e.g., `_providerChat`)
- [ ] Handle both streaming and non-streaming responses
- [ ] Create type definitions in `types/`
- [ ] Create ArkType validators in `validators/`
- [ ] Implement translators:
  - [ ] RequestTranslator (HoloRequest ↔ ProviderRequest)
  - [ ] ResponseTranslator (HoloResponse ↔ ProviderResponse)
  - [ ] MessageTranslator (HoloMessage[] ↔ ProviderMessage[])
  - [ ] ContentTranslator (optional, for complex content)
  - [ ] ToolTranslator (if tools supported)
  - [ ] StreamTranslator (if streaming supported)
- [ ] Create main translator class implementing `IProviderTranslator`
- [ ] Register in dependency injection container
- [ ] Add to `ProviderType` enum
- [ ] Update `ProviderRequest` and `ProviderResponse` union types

## OpenAI Responses API Integration

For the new OpenAI Responses API, we need to:

1. **Create new types** for Responses API (already done - 167 types)
2. **Create validators** for runtime validation (done - 156 validators)
3. **Implement provider or adapter**:
   - Option A: New `OpenAIResponsesProvider` extending `AIProvider`
   - Option B: Add Responses API support to existing `OpenAIProvider`
4. **Create translators**:
   - `OpenAIResponseRequestTranslator` - HoloRequest → ResponseCreateParams
   - `OpenAIResponseResponseTranslator` - Response → HoloResponse
   - `OpenAIResponseStreamTranslator` - ResponseStreamEvent → HoloStreamChunk
   - Handle stateful conversation model (response chaining)
5. **Handle differences**:
   - Responses API is stateful (can reference previous responses)
   - Different streaming event model (61 event types)
   - Different tool orchestration model
   - Different output format (output items vs choices)
