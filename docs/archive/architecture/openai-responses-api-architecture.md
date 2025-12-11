# Architecture: OpenAI Responses API Support

**Work Type:** Feature
**Created:** 2025-11-10
**Status:** Architecture Gate
**Prerequisites:** Requirements gate complete

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Component Design](#component-design)
3. [Data Flow](#data-flow)
4. [Event Translation Architecture](#event-translation-architecture)
5. [Type System Design](#type-system-design)
6. [Integration Points](#integration-points)
7. [Sequence Diagrams](#sequence-diagrams)
8. [Error Handling Strategy](#error-handling-strategy)

---

## System Architecture Overview

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    HTTP Layer (Express)                         │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ /openai/v1/chat/         │  │ /openai/v1/responses     │   │
│  │ completions (existing)   │  │ (new)                    │   │
│  └────────────┬─────────────┘  └────────────┬─────────────┘   │
└───────────────┼────────────────────────────┼─────────────────┘
                │                            │
                └────────────┬───────────────┘
                             │
                ┌────────────▼─────────────┐
                │  OpenAIController        │
                │  - chatCompletions()     │
                │  - responses() [NEW]     │
                └────────────┬─────────────┘
                             │
                ┌────────────▼─────────────┐
                │  RequestService          │
                │  - Route Selection Logic │
                │    1. Per-request        │
                │    2. Per-provider       │
                │    3. Default            │
                └────────────┬─────────────┘
                             │
                ┌────────────▼─────────────┐
                │  OpenAIProvider          │
                │  - _openaiChatCompletions│
                │  - _openaiResponses [NEW]│
                └────────────┬─────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼────────┐                    ┌──────────▼──────────┐
│ Chat Completions│                    │ Responses API       │
│ Translators     │                    │ Translators [NEW]   │
│ (existing)      │                    │                     │
│ - Request       │                    │ - Request           │
│ - Response      │                    │ - Response          │
│ - Message       │                    │ - Event [NEW]       │
│ - Stream        │                    │   - TextDelta       │
│ - Delta         │                    │   - ToolCall        │
│ - Tool          │                    │   - Structured      │
│ - Usage         │                    │   - Reasoning       │
└───────┬────────┘                    └──────────┬──────────┘
        │                                        │
        └────────────────┬───────────────────────┘
                         │
                 ┌───────▼────────┐
                 │  Holo Format   │
                 │  (Universal)   │
                 └────────────────┘
```

### Key Architectural Decisions

#### Decision 1: Parallel Paths (Not Replacement)
**Rationale:** Chat Completions is not deprecated. Both APIs coexist.

**Implementation:**
- Separate translator chains (no shared mutable state)
- Separate provider methods (`_openaiChatCompletions` vs `_openaiResponses`)
- Configuration-driven routing (runtime selection)

#### Decision 2: Event-Based Translation for Responses
**Rationale:** Responses API emits semantic events (not just deltas). Each event type requires specific handling.

**Implementation:**
- `OpenAIResponsesEventTranslator` orchestrator
- Specialized sub-translators per event type
- Preserve event ordering with buffering for out-of-order scenarios

#### Decision 3: Capabilities-Aware Translation
**Rationale:** Not all models support all features (reasoning, structured outputs).

**Implementation:**
- `MODEL_CAPABILITIES` map at provider level
- Pre-request validation against capabilities
- Graceful omission of unsupported fields (no errors)

#### Decision 4: Lossless Round-Tripping via provider_delta
**Rationale:** Maintain existing architecture principle of preserving raw provider data.

**Implementation:**
- Store raw Responses events in `provider_delta` field
- Holo translation is lossy convenience layer
- Original data always available for debugging/replay

---

## Component Design

### 1. Route Layer

#### File: `src/api/routes/openai.routes.ts`

**Existing:**
```typescript
openAIRouter.post('/chat/completions', openAIController.chatCompletions);
```

**New:**
```typescript
openAIRouter.post('/responses', openAIController.responses);
```

**No changes to existing route.**

---

### 2. Controller Layer

#### File: `src/api/controllers/openai.controller.ts`

**New Method:**
```typescript
public responses = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    try {
        // /responses route always uses RequestType.RESPONSES
        // No fallback to Chat Completions (pure routing)
        await this.requestService.processRequest(
            ProviderType.OPENAI,
            RequestType.RESPONSES,
            req,
            res
        );
    } catch (error) {
        logger.error('Error: ' + (error as Error).stack);
        this.handleError(res, error as Error, 'Failed to complete response');
    }
}
```

**Design Notes:**
- Pure routing: /responses → always RequestType.RESPONSES
- No per-request override at route level (keeps routes clean)
- Per-request switching can be added at a generic gateway route if needed
- Reuses existing error handling

---

### 3. Request Service Layer

#### File: `src/admin/services/request.service.ts`

**Enhanced Logic:**
```typescript
async processRequest(
    providerType: ProviderType,
    type: RequestType,
    req: HttpApiRequest,
    res: ApiResponse
): Promise<void> {
    let finalType = type;

    // Route-driven type assignment (pure routes)
    // /chat/completions → CHAT
    // /responses → RESPONSES

    // Per-provider config override only for generic routes
    if (providerType === ProviderType.OPENAI && type === RequestType.CHAT) {
        const provider = await this.getProvider(req);
        if (provider.metadata?.openai_api_version === 'responses') {
            finalType = RequestType.RESPONSES;
        }
    }

    // Continue with existing flow...
}
```

**Design Notes:**
- Pure routes: /responses always uses RESPONSES, /chat/completions always uses CHAT
- Per-provider config only overrides for generic routes (if added later)
- Backward compatible (existing /chat/completions unchanged)

---

### 4. Provider Layer

#### File: `src/providers/openai/openai.provider.ts`

**New Method:**
```typescript
async _openaiResponses(
    sourceId: string,
    requestId: string,
    responsesRequest: OpenAIResponseRequest
): Promise<void> {
    const logger = this.mlog(this._openaiResponses);
    await this.ensureInitialized();

    // Validate model capabilities
    this.validateModelCapabilities(responsesRequest.model, responsesRequest);

    const startTime = Date.now();
    let timeToFirst: number = 0;

    // Use streaming adapter for SSE/iterator abstraction
    const streamAdapter = new ResponsesStreamAdapter();

    // Ensure usage metadata included in stream
    if (responsesRequest.stream) {
        responsesRequest.stream_options = { include_usage: true };
    }

    // Wrap in OpenTelemetry span
    const span = this.tracer.startSpan('openai.responses.create', {
        attributes: {
            'request.id': requestId,
            'model': responsesRequest.model,
            'stream': responsesRequest.stream || false
        }
    });

    try {
        // Call Responses API endpoint
        const response = await this.client.responses.create(responsesRequest);

    if (responsesRequest.stream) {
        logger.debug('Starting Responses stream', { requestId, model: responsesRequest.model });

        // Conditional buffering with size cap (avoid OOM on large outputs)
        const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB
        let textBuffer = '';
        let bufferSize = 0;

        try {
            // Use stream adapter for both iterator and SSE support
            for await (const event of streamAdapter.adapt(response)) {
                // Translate event using event translator
                const holoEvent = await this.responsesEventTranslator.toHolo(event, {
                    exposeProviderDelta: false  // Internal only by default
                });

                // Track first token timing (any content/summary/tool event)
                if (timeToFirst === 0 &&
                    ['content_delta', 'tool_call_start', 'reasoning_summary'].includes(holoEvent.type)) {
                    timeToFirst = Date.now() - startTime;
                    span.addEvent('first_token', { ttft_ms: timeToFirst });
                }

                // Conditionally buffer text (with size cap)
                if (holoEvent.type === 'content_delta') {
                    const deltaSize = holoEvent.delta.content.length;
                    if (bufferSize + deltaSize <= MAX_BUFFER_SIZE) {
                        textBuffer += holoEvent.delta.content;
                        bufferSize += deltaSize;
                    } else {
                        logger.warn('Text buffer exceeded size cap, truncating');
                    }
                }

                // Enhance usage metadata on final event
                if (holoEvent.type === 'message_stop') {
                    holoEvent.usage.ttft_ms = timeToFirst;
                    holoEvent.usage.gen_ms = Date.now() - startTime;
                    // Guard divide-by-zero
                    holoEvent.usage.tokens_per_sec = holoEvent.usage.gen_ms > 0
                        ? holoEvent.usage.output_tokens / (holoEvent.usage.gen_ms / 1000)
                        : 0;
                    holoEvent.usage.prompt_cache_hit = (holoEvent.usage.cached_tokens || 0) > 0;

                    // Add to span
                    span.setAttributes({
                        'usage.input_tokens': holoEvent.usage.input_tokens,
                        'usage.output_tokens': holoEvent.usage.output_tokens,
                        'usage.cached_tokens': holoEvent.usage.cached_tokens || 0,
                        'usage.cache_hit': holoEvent.usage.prompt_cache_hit,
                        'usage.ttft_ms': timeToFirst,
                        'usage.gen_ms': holoEvent.usage.gen_ms,
                        'usage.tokens_per_sec': holoEvent.usage.tokens_per_sec
                    });
                }

                const responseChunk = this.createWorkerResponse(
                    sourceId,
                    requestId,
                    ProviderType.OPENAI,
                    holoEvent,
                    holoEvent.type === 'message_stop' ? textBuffer : undefined
                );

                await this.onResponseChunk(
                    responseChunk,
                    holoEvent.type === 'message_stop'
                );

                // Terminal error - close stream
                if (holoEvent.type === 'error') {
                    break;
                }
            }

            span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
            const isNetworkError = error instanceof NetworkError;
            const isSSEError = error instanceof SSETransportError;

            logger.error('Responses stream error', {
                requestId,
                error: (error as Error).message,
                type: isNetworkError ? 'network' : isSSEError ? 'sse_transport' : 'provider',
                stack: (error as Error).stack
            });

            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message
            });

            const errorResponse = this.createWorkerResponse(
                sourceId,
                requestId,
                ProviderType.OPENAI,
                this.errorTranslator.toHoloError(error)
            );
            await this.onResponseChunk(errorResponse, false);
        } finally {
            span.end();
        }
    } else {
        // Non-streaming
        const output = response as OpenAIResponseOutput;
        const holoResponse = await this.responsesResponseTranslator.toHolo(output);

        const responseChunk = this.createWorkerResponse(
            sourceId,
            requestId,
            ProviderType.OPENAI,
            holoResponse,
            holoResponse.content
        );

        await this.onResponseChunk(responseChunk, true);
    }
}
```

**New Method:**
```typescript
private validateModelCapabilities(
    model: string,
    request: OpenAIResponseRequest
): void {
    const capabilities = getModelCapabilities(model);  // Uses prefix matching + fallback

    // Structured output validation (strict)
    if (request.response_format?.type === 'json_schema' && !capabilities.structured) {
        throw new BadRequestError(
            `Model ${model} does not support structured outputs (json_schema). ` +
            `Supported models: ${this.getSupportedModelsForFeature('structured').join(', ')}`,
            'unsupported_feature'
        );
    }

    // Reasoning validation (warn and omit)
    if (request.reasoning?.enabled && !capabilities.reasoning) {
        this.log.warn(`Model ${model} does not support reasoning, field will be omitted`, {
            model,
            requested_feature: 'reasoning',
            supported_models: this.getSupportedModelsForFeature('reasoning')
        });
        delete request.reasoning;  // Omit from provider request
    }

    // Vision validation (if image inputs present)
    const hasImageInputs = request.input.some(msg =>
        Array.isArray(msg.content) && msg.content.some(part => part.type === 'image_url')
    );
    if (hasImageInputs && !capabilities.vision) {
        throw new BadRequestError(
            `Model ${model} does not support image inputs`,
            'unsupported_feature'
        );
    }

    // Audio validation
    const hasAudioInputs = request.input.some(msg =>
        Array.isArray(msg.content) && msg.content.some(part => part.type === 'input_audio')
    );
    if (hasAudioInputs && !capabilities.audio) {
        throw new BadRequestError(
            `Model ${model} does not support audio inputs`,
            'unsupported_feature'
        );
    }
}

private getSupportedModelsForFeature(feature: keyof ModelCapabilities): string[] {
    return Object.entries(MODEL_CAPABILITIES)
        .filter(([model, caps]) => caps[feature] && model !== 'default')
        .map(([model]) => model);
}
```

**Design Notes:**
- Structured outputs: fail fast with clear error message (400)
- Reasoning: log warning and omit (graceful degradation)
- Vision/audio: fail fast if model doesn't support
- Error messages include list of supported models
- Uses `getModelCapabilities()` with prefix matching

**Enhanced handleLLMRequest:**
```typescript
async handleLLMRequest(
    sourceId: string,
    requestId: string,
    payload: ProviderRequest,
    type: RequestType
): Promise<AIRequestStat> {
    switch (type) {
        case RequestType.RESPONSES:
            const responsesPayload = payload as OpenAIResponseRequest;
            return await this.wrapWithStats(
                type,
                this._openaiResponses.bind(this),
                sourceId,
                requestId,
                responsesPayload
            );

        case RequestType.CHAT:
        default:
            const chatPayload = payload as OpenAIChatRequest;
            return await this.wrapWithStats(
                type,
                this._openaiChatCompletions.bind(this),
                sourceId,
                requestId,
                chatPayload
            );
    }
}
```

**Design Notes:**
- Separate method maintains isolation (no cross-contamination)
- Model capabilities validation happens pre-request
- Event translator handles all event type conversions
- Timing metrics collected identically to Chat Completions

---

### 5. Model Capabilities

#### File: `src/providers/openai/model-capabilities.ts`

```typescript
export interface ModelCapabilities {
    reasoning: boolean;      // Supports reasoning summary (o1-series)
    structured: boolean;     // Supports structured outputs (response_format)
    vision: boolean;         // Supports image inputs
    audio: boolean;          // Supports audio inputs/outputs
    tools: boolean;          // Supports function calling
}

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
    // Reasoning models
    'o1-preview': {
        reasoning: true,
        structured: true,
        vision: true,
        audio: false,
        tools: true
    },
    'o1-mini': {
        reasoning: true,
        structured: true,
        vision: false,
        audio: false,
        tools: true
    },

    // GPT-4 family
    'gpt-4': {
        reasoning: false,
        structured: true,
        vision: false,
        audio: false,
        tools: true
    },
    'gpt-4-turbo': {
        reasoning: false,
        structured: true,
        vision: true,
        audio: false,
        tools: true
    },
    'gpt-4o': {
        reasoning: false,
        structured: true,
        vision: true,
        audio: true,
        tools: true
    },

    // GPT-3.5 family
    'gpt-3.5-turbo': {
        reasoning: false,
        structured: false,
        vision: false,
        audio: false,
        tools: true
    },

    // Default fallback
    'default': {
        reasoning: false,
        structured: false,
        vision: false,
        audio: false,
        tools: false
    }
};

// Support config overlay (environment variable or DB)
const CONFIG_OVERLAY = loadModelCapabilitiesOverlay();  // JSON/DB/env-based

export function getModelCapabilities(model: string): ModelCapabilities {
    // 1. Config overlay (highest priority)
    if (CONFIG_OVERLAY && model in CONFIG_OVERLAY) {
        return CONFIG_OVERLAY[model];
    }

    // 2. Exact match
    if (model in MODEL_CAPABILITIES) {
        return MODEL_CAPABILITIES[model];
    }

    // 3. Prefix match (e.g., "gpt-4-0613" -> "gpt-4")
    const prefix = model.split('-').slice(0, 2).join('-');
    if (prefix in MODEL_CAPABILITIES) {
        return MODEL_CAPABILITIES[prefix];
    }

    // 4. Fallback to conservative defaults
    return MODEL_CAPABILITIES['default'];
}

function loadModelCapabilitiesOverlay(): Record<string, ModelCapabilities> | null {
    // Load from environment variable
    const overlayJson = process.env.MODEL_CAPABILITIES_OVERLAY;
    if (overlayJson) {
        try {
            return JSON.parse(overlayJson);
        } catch (error) {
            console.error('Failed to parse MODEL_CAPABILITIES_OVERLAY', error);
        }
    }

    // Load from DB (if available)
    // TODO: Implement DB-based overlay

    return null;
}
```

**Design Notes:**
- Three-tier resolution: config overlay > exact match > prefix match > default
- Config overlay supports runtime updates (env var or DB)
- Prefix matching handles versioned models (e.g., "gpt-4-0613")
- Fallback to conservative defaults (all features disabled)

---

## Data Flow

### Request Flow (Responses API)

```
1. HTTP POST /api/openai/v1/responses
   ↓
2. OpenAIController.responses()
   - Check X-OpenAI-API-Version header
   ↓
3. RequestService.processRequest()
   - Route selection: header > provider config > default
   - type = RequestType.RESPONSES
   ↓
4. OpenAIProvider.handleLLMRequest()
   - Switch on type -> _openaiResponses()
   ↓
5. OpenAIProvider._openaiResponses()
   - Validate model capabilities
   - Call client.responses.create()
   ↓
6. [If streaming] For each event:
   - OpenAIResponsesEventTranslator.toHolo(event)
   - Create WorkerResponse envelope
   - ResponseService.onResponseChunk()
   ↓
7. StreamService
   - Format Holo envelope to SSE
   - Pipe to client
   ↓
8. Client receives SSE stream
```

### Translation Flow (Event-Based)

```
Raw Responses Event (OpenAI format)
   ↓
OpenAIResponsesEventTranslator (orchestrator)
   ↓
   ├─ event.type === 'text.delta'
   │     ↓
   │  TextDeltaTranslator
   │     ↓
   │  { type: 'content_delta', delta: { content: string } }
   │
   ├─ event.type === 'tool_call.start'
   │     ↓
   │  ToolCallStartTranslator
   │     ↓
   │  { type: 'tool_call_start', tool_call: { id, name } }
   │
   ├─ event.type === 'tool_call.delta'
   │     ↓
   │  ToolCallDeltaTranslator
   │     ↓
   │  { type: 'tool_call_delta', delta: { arguments: string } }
   │
   ├─ event.type === 'structured.output'
   │     ↓
   │  StructuredOutputTranslator
   │     ↓
   │  { type: 'structured_output', data: any }
   │
   ├─ event.type === 'reasoning.summary'
   │     ↓
   │  ReasoningSummaryTranslator
   │     ↓
   │  { type: 'reasoning_summary', reasoning: string }
   │
   └─ event.type === 'response.done'
         ↓
      UsageTranslator
         ↓
      { type: 'message_stop', usage: {...} }
```

---

## Event Translation Architecture

### One-Page Event Mapping Reference

| Provider Event | Canonical Type | Holo Envelope | Payload Fields | Ordering Rules | Buffering |
|----------------|----------------|---------------|----------------|----------------|-----------|
| `text.delta` | `text_delta` | `content_delta` | `delta.content: string` | Sequential; FIFO | None (stream through) |
| `tool_call.start` | `tool_call_start` | `tool_call_start` | `tool_call.id`, `tool_call.name` | Must precede deltas for same index | None |
| `tool_call.delta` | `tool_call_delta` | `tool_call_delta` | `delta.index`, `delta.id`, `delta.arguments: string` | Sequential per index | Buffer by (id, index); timeout 2s |
| `tool_call.complete` | `tool_call_complete` | `tool_call_complete` | `tool_call: { id, name, arguments }` | Flush buffered deltas; emit complete | Flush on complete or timeout (5s) |
| `structured.output` | `structured_output` | `structured_output` | `structured.data: unknown`, `structured.schema_id?: string` | Can interleave with text | None (stream through) |
| `reasoning.summary` | `reasoning_summary` | `reasoning_summary` | `reasoning: string` | Optional; appears once before text (o1-series only) | None; off by default for external |
| `response.done` | `response_done` | `message_stop` | `usage: HoloUsage` (with ttft_ms, gen_ms, tokens_per_sec, cached_tokens, prompt_cache_hit) | Terminal; includes timing/cache metadata | None |
| `error` | `error` | `error` | `error.message`, `error.code`, `error.retry`, `error.backoff`, `error.provider_request_id` | Terminal; closes stream immediately | None |

**Key Principles:**
1. **Event normalization:** Provider dot-notation (`text.delta`) → Canonical underscores (`text_delta`) → Holo envelope (`content_delta`)
2. **Tool call buffering:** Buffer deltas by (id, index); flush on `.complete` or timeout (5s)
3. **Out-of-order handling:** If `.delta` arrives before `.start`, buffer and wait (timeout: 2s)
4. **Usage metadata:** Only on `response.done`; includes derived fields (prompt_cache_hit, tokens_per_sec)
5. **Lossless round-trip:** `provider_delta` preserved (internal only; requires `exposeProviderDelta=true`)
6. **Reasoning exposure:** Off by default for external clients; requires `exposeReasoning=true`
7. **Error terminal:** First `error` event closes stream; no further events processed
8. **Guard divide-by-zero:** `tokens_per_sec = gen_ms > 0 ? output_tokens / (gen_ms / 1000) : 0`

**EVENT_MAP (Canonical Mapping):**
```typescript
export const EVENT_MAP: Record<string, string> = {
    'text.delta': 'text_delta',
    'tool_call.start': 'tool_call_start',
    'tool_call.delta': 'tool_call_delta',
    'tool_call.complete': 'tool_call_complete',
    'structured.output': 'structured_output',
    'reasoning.summary': 'reasoning_summary',
    'response.done': 'response_done',
    'error': 'error'
};
```

---

## Event Translation Architecture

### Event Translator Hierarchy

```typescript
// Base interface for all events
interface OpenAIResponsesEvent {
    type: string;
    [key: string]: any;
}

interface HoloStreamEnvelope {
    type: string;
    delta?: any;
    tool_call?: any;
    data?: any;
    reasoning?: string;
    usage?: any;
    provider_delta: any;  // Raw event for lossless round-trip
}
```

### Event Translator Implementation

#### File: `src/providers/openai/translators/streaming/openai.responses.event.translator.ts`

```typescript
import { injectable } from 'tsyringe';
import { Base } from '../../../base.translator';

@injectable()
export class OpenAIResponsesEventTranslator {
    constructor(
        private textDeltaTranslator: TextDeltaTranslator,
        private toolCallStartTranslator: ToolCallStartTranslator,
        private toolCallDeltaTranslator: ToolCallDeltaTranslator,
        private structuredOutputTranslator: StructuredOutputTranslator,
        private reasoningSummaryTranslator: ReasoningSummaryTranslator,
        private usageTranslator: UsageTranslator
    ) {}

    async toHolo(event: OpenAIResponsesEvent): Promise<HoloStreamEnvelope> {
        // Preserve raw event for lossless round-trip
        const baseEnvelope = {
            provider_delta: event
        };

        switch (event.type) {
            case 'text.delta':
                return {
                    ...baseEnvelope,
                    ...(await this.textDeltaTranslator.toHolo(event))
                };

            case 'tool_call.start':
                return {
                    ...baseEnvelope,
                    ...(await this.toolCallStartTranslator.toHolo(event))
                };

            case 'tool_call.delta':
                return {
                    ...baseEnvelope,
                    ...(await this.toolCallDeltaTranslator.toHolo(event))
                };

            case 'tool_call.complete':
                return {
                    ...baseEnvelope,
                    type: 'tool_call_complete',
                    tool_call: event.tool_call
                };

            case 'structured.output':
                return {
                    ...baseEnvelope,
                    ...(await this.structuredOutputTranslator.toHolo(event))
                };

            case 'reasoning.summary':
                return {
                    ...baseEnvelope,
                    ...(await this.reasoningSummaryTranslator.toHolo(event))
                };

            case 'response.done':
                return {
                    ...baseEnvelope,
                    ...(await this.usageTranslator.toHolo(event))
                };

            case 'error':
                return {
                    ...baseEnvelope,
                    type: 'error',
                    error: {
                        message: event.error.message,
                        code: event.error.code,
                        type: event.error.type
                    }
                };

            default:
                // Unknown event type - pass through with warning
                console.warn(`Unknown Responses event type: ${event.type}`);
                return {
                    ...baseEnvelope,
                    type: 'unknown',
                    raw: event
                };
        }
    }

    async fromHolo(envelope: HoloStreamEnvelope): Promise<OpenAIResponsesEvent> {
        // Use provider_delta for lossless reverse translation
        if (envelope.provider_delta) {
            return envelope.provider_delta;
        }

        // Otherwise reconstruct from Holo fields (lossy)
        switch (envelope.type) {
            case 'content_delta':
                return await this.textDeltaTranslator.fromHolo(envelope);

            case 'tool_call_start':
                return await this.toolCallStartTranslator.fromHolo(envelope);

            case 'tool_call_delta':
                return await this.toolCallDeltaTranslator.fromHolo(envelope);

            // ... other cases

            default:
                throw new Error(`Cannot translate Holo type ${envelope.type} to Responses event`);
        }
    }
}
```

### Individual Event Translators

#### Text Delta Translator

**File:** `src/providers/openai/translators/streaming/text-delta.translator.ts`

```typescript
@injectable()
export class TextDeltaTranslator extends Base<
    HoloStreamEnvelope,
    OpenAIResponsesEvent
> {
    protected holoValidator = HoloStreamEnvelopeValidator;
    protected providerValidator = OpenAIResponsesEventValidator;

    protected async toHoloManyImpl(
        source: OpenAIResponsesEvent
    ): Promise<Partial<HoloStreamEnvelope>[]> {
        return [{
            type: 'content_delta',
            delta: {
                content: source.delta?.content || ''
            }
        }];
    }

    protected async fromHoloManyImpl(
        source: HoloStreamEnvelope
    ): Promise<Partial<OpenAIResponsesEvent>[]> {
        return [{
            type: 'text.delta',
            delta: {
                content: source.delta?.content || ''
            }
        }];
    }
}
```

#### Tool Call Delta Translator

**File:** `src/providers/openai/translators/streaming/tool-call-delta.translator.ts`

```typescript
@injectable()
export class ToolCallDeltaTranslator extends Base<
    HoloStreamEnvelope,
    OpenAIResponsesEvent
> {
    protected async toHoloManyImpl(
        source: OpenAIResponsesEvent
    ): Promise<Partial<HoloStreamEnvelope>[]> {
        return [{
            type: 'tool_call_delta',
            delta: {
                index: source.index,
                id: source.id,
                arguments: source.delta?.function?.arguments || ''
            }
        }];
    }

    protected async fromHoloManyImpl(
        source: HoloStreamEnvelope
    ): Promise<Partial<OpenAIResponsesEvent>[]> {
        return [{
            type: 'tool_call.delta',
            index: source.delta?.index,
            id: source.delta?.id,
            delta: {
                function: {
                    arguments: source.delta?.arguments || ''
                }
            }
        }];
    }
}
```

#### Reasoning Summary Translator

**File:** `src/providers/openai/translators/streaming/reasoning-summary.translator.ts`

```typescript
@injectable()
export class ReasoningSummaryTranslator extends Base<
    HoloStreamEnvelope,
    OpenAIResponsesEvent
> {
    protected async toHoloManyImpl(
        source: OpenAIResponsesEvent
    ): Promise<Partial<HoloStreamEnvelope>[]> {
        return [{
            type: 'reasoning_summary',
            reasoning: source.summary || ''
        }];
    }

    protected async fromHoloManyImpl(
        source: HoloStreamEnvelope
    ): Promise<Partial<OpenAIResponsesEvent>[]> {
        return [{
            type: 'reasoning.summary',
            summary: source.reasoning || ''
        }];
    }
}
```

---

## Type System Design

### Responses API Request Types

**File:** `src/providers/openai/types/responses.requests.ts`

```typescript
import { OpenAIRequestMessage } from './requests';

// Provider-exact DTO (matches OpenAI Responses API spec)
export interface OpenAIResponseRequest {
    // Required
    model: string;

    // Input array (provider-exact Responses API format)
    input: Array<{
        role: 'user' | 'system' | 'assistant' | 'tool';
        content: string | Array<{
            type: 'text' | 'image_url' | 'input_audio';
            text?: string;
            image_url?: { url: string };
            input_audio?: { data: string; format: string };
        }>;
        name?: string;  // For tool role
        tool_call_id?: string;  // For tool role
    }>;

    // Common parameters
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
    stream_options?: { include_usage?: boolean };

    // Responses-specific (conversation linkage)
    previous_response_id?: string;  // Links to previous turn

    // Reasoning control (optional, model-dependent)
    reasoning?: {
        enabled?: boolean;
        effort?: 'low' | 'medium' | 'high';
    };

    // Tools & structured outputs
    tools?: Array<{
        type: 'function';
        function: {
            name: string;
            description?: string;
            parameters?: any;
        };
    }>;
    tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
    response_format?: {
        type: 'text' | 'json_object' | 'json_schema';
        json_schema?: {
            name: string;
            description?: string;
            schema: any;
            strict?: boolean;
        };
    };

    // Metadata
    metadata?: Record<string, any>;
    user?: string;
}
```

**Design Notes:**
- **Provider-exact DTO**: Uses `input` array format (not messages/prompt)
- **Holo → Responses mapping**: Happens in request translator (keeps DTO clean)
- **Conversation linkage**: `previous_response_id` for stateful turns
- **Model-dependent features**: Reasoning, structured outputs validated against capabilities

### Responses API Response Types

**File:** `src/providers/openai/types/responses.responses.ts`

```typescript
export interface OpenAIResponseOutput {
    id: string;
    object: 'response';
    created: number;
    model: string;
    output_items: OpenAIOutputItem[];
    usage?: OpenAIResponseUsage;
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    previous_response_id?: string;
}

export interface OpenAIOutputItem {
    type: 'text' | 'tool_call' | 'structured_output';
    text?: string;
    tool_call?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    };
    structured_data?: any;
}

export interface OpenAIResponseUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
        cached_tokens?: number;
        audio_tokens?: number;
    };
    completion_tokens_details?: {
        reasoning_tokens?: number;
        audio_tokens?: number;
    };
}

// Streaming events
export interface OpenAIResponsesEvent {
    type: 'text.delta' | 'tool_call.start' | 'tool_call.delta' |
          'tool_call.complete' | 'structured.output' |
          'reasoning.summary' | 'response.done' | 'error';
    [key: string]: any;
}

export interface OpenAITextDeltaEvent extends OpenAIResponsesEvent {
    type: 'text.delta';
    delta: {
        content: string;
    };
}

export interface OpenAIToolCallStartEvent extends OpenAIResponsesEvent {
    type: 'tool_call.start';
    index: number;
    id: string;
    tool_call: {
        type: 'function';
        function: {
            name: string;
        };
    };
}

export interface OpenAIToolCallDeltaEvent extends OpenAIResponsesEvent {
    type: 'tool_call.delta';
    index: number;
    id: string;
    delta: {
        function?: {
            arguments: string;
        };
    };
}

export interface OpenAIReasoningSummaryEvent extends OpenAIResponsesEvent {
    type: 'reasoning.summary';
    summary: string;
}

export interface OpenAIResponseDoneEvent extends OpenAIResponsesEvent {
    type: 'response.done';
    response: OpenAIResponseOutput;
    usage: OpenAIResponseUsage;
}
```

### Holo Type Extensions

**File:** `src/providers/holo/types/responses.ts`

```typescript
// Extend HoloResponse with Responses-specific fields
export interface HoloResponseExtended extends HoloResponse {
    // Multi-output support
    outputs?: HoloOutputItem[];

    // Reasoning summary (optional, o1-series only)
    reasoning_summary?: string;

    // Conversation state (Responses API)
    previous_response_id?: string;
    response_id?: string;
}

export interface HoloOutputItem {
    type: 'text' | 'tool_result' | 'structured_data' | 'reasoning';
    content?: string;
    tool_result?: {
        id: string;
        name: string;
        arguments: any;
    };
    structured_data?: any;
    reasoning?: string;
}

// Stream envelope types
export interface HoloStreamEnvelope {
    type: 'content_delta' | 'tool_call_start' | 'tool_call_delta' |
          'tool_call_complete' | 'structured_output' |
          'reasoning_summary' | 'message_stop' | 'error';

    delta?: {
        content?: string;
        index?: number;
        id?: string;
        arguments?: string;
    };

    tool_call?: {
        id: string;
        name: string;
        type: 'function';
        function?: {
            name: string;
            arguments: string;
        };
    };

    // Structured output (canonical type name)
    structured?: {
        data: unknown;
        schema_id?: string;
    };

    // Reasoning summary (optional, off by default for external clients)
    reasoning?: string;

    usage?: HoloUsage;
    error?: {
        message: string;
        code?: string;
        type?: string;
        retry?: boolean;
        backoff?: BackoffStrategy;
    };

    // Lossless round-trip (INTERNAL ONLY - never exposed to external clients by default)
    // Only included when expose_provider_delta=true (admin/debug mode)
    provider_delta?: any;
}

export interface HoloStreamOptions {
    exposeProviderDelta?: boolean;  // Admin/debug only (default: false)
    exposeReasoning?: boolean;      // Include reasoning summary (default: false for external)
}
```

**Design Notes:**
- `provider_delta` is optional and internal-only by default
- `exposeProviderDelta` flag controls inclusion (admin/debug mode)
- `reasoning` off by default for external clients (opt-in via config)
- Structured output uses canonical `structured` field (not `data`)
- Error includes retry/backoff signals

### Enhanced Usage Type

**File:** `src/providers/holo/types/usage.ts`

```typescript
export interface HoloUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;

    // Cache metadata (Responses API)
    cached_tokens?: number;
    prompt_cache_hit?: boolean;  // Derived: cached_tokens > 0

    // Reasoning tokens (o1-series)
    reasoning_tokens?: number;

    // Audio tokens
    audio_input_tokens?: number;
    audio_output_tokens?: number;

    // Timing metrics (computed by provider)
    ttft_ms?: number;  // Time to first token
    gen_ms?: number;   // Total generation time
    tokens_per_sec?: number;  // output_tokens / (gen_ms / 1000)
}
```

---

## Integration Points

### 1. RequestType Enum Extension

**File:** `src/providers/types/index.ts`

```typescript
export enum RequestType {
    CHAT = 'chat',
    GENERATE = 'generate',
    RESPONSES = 'responses',  // NEW
}
```

### 2. Provider Metadata Extension

**File:** `src/db/types/provider.ts`

```typescript
export interface Provider {
    // ... existing fields

    metadata?: {
        // ... existing metadata

        // NEW: OpenAI API version preference
        openai_api_version?: 'chat_completions' | 'responses';
    };
}
```

### 3. Dependency Injection Registration

**File:** `src/providers/openai/index.ts`

```typescript
import { container } from 'tsyringe';
import { ResponsesStreamAdapter } from './adapters/responses-stream.adapter';
import { OpenAIResponsesEventTranslator } from './translators/streaming/openai.responses.event.translator';
import { TextDeltaTranslator } from './translators/streaming/text-delta.translator';
import { ToolCallStartTranslator } from './translators/streaming/tool-call-start.translator';
import { ToolCallDeltaTranslator } from './translators/streaming/tool-call-delta.translator';
import { ToolCallCompleteTranslator } from './translators/streaming/tool-call-complete.translator';
import { StructuredOutputTranslator } from './translators/streaming/structured-output.translator';
import { ReasoningSummaryTranslator } from './translators/streaming/reasoning-summary.translator';
import { OpenAIResponsesRequestTranslator } from './translators/openai.responses.request.translator';
import { OpenAIResponsesResponseTranslator } from './translators/openai.responses.response.translator';

// Register stream adapter
container.register('ResponsesStreamAdapter', { useClass: ResponsesStreamAdapter });

// Register request/response translators
container.register('OpenAIResponsesRequestTranslator', { useClass: OpenAIResponsesRequestTranslator });
container.register('OpenAIResponsesResponseTranslator', { useClass: OpenAIResponsesResponseTranslator });

// Register event translators
container.register('OpenAIResponsesEventTranslator', { useClass: OpenAIResponsesEventTranslator });
container.register('TextDeltaTranslator', { useClass: TextDeltaTranslator });
container.register('ToolCallStartTranslator', { useClass: ToolCallStartTranslator });
container.register('ToolCallDeltaTranslator', { useClass: ToolCallDeltaTranslator });
container.register('ToolCallCompleteTranslator', { useClass: ToolCallCompleteTranslator });
container.register('StructuredOutputTranslator', { useClass: StructuredOutputTranslator });
container.register('ReasoningSummaryTranslator', { useClass: ReasoningSummaryTranslator });
```

**ResponsesStreamAdapter Implementation:**

**File:** `src/providers/openai/adapters/responses-stream.adapter.ts`

```typescript
import { injectable } from 'tsyringe';

export interface StreamAdapterConfig {
    idleTimeout: number;  // Timeout if no events received (default: 30s)
    overallTimeout: number;  // Max stream duration (default: 10 minutes)
}

/**
 * Abstracts SSE/iterator streaming for OpenAI Responses API
 * Provides uniform interface for both SDK iterator and raw SSE streams
 */
@injectable()
export class ResponsesStreamAdapter {
    private readonly defaultConfig: StreamAdapterConfig = {
        idleTimeout: 30000,  // 30 seconds
        overallTimeout: 600000  // 10 minutes
    };

    constructor(private config: StreamAdapterConfig = this.defaultConfig) {}

    async *adapt<T>(
        stream: AsyncIterable<T> | ReadableStream<T>,
        config?: Partial<StreamAdapterConfig>
    ): AsyncIterable<T> {
        const mergedConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();
        let lastEventTime = Date.now();

        // Handle AsyncIterable (SDK iterator)
        if (Symbol.asyncIterator in stream) {
            for await (const event of stream as AsyncIterable<T>) {
                // Check overall timeout
                if (Date.now() - startTime > mergedConfig.overallTimeout) {
                    throw new StreamTimeoutError('Overall stream timeout exceeded');
                }

                // Check idle timeout
                if (Date.now() - lastEventTime > mergedConfig.idleTimeout) {
                    throw new StreamIdleTimeoutError('Idle timeout exceeded');
                }

                lastEventTime = Date.now();
                yield event;
            }
        }
        // Handle ReadableStream (SSE)
        else if (stream instanceof ReadableStream) {
            const reader = stream.getReader();
            try {
                while (true) {
                    // Check overall timeout
                    if (Date.now() - startTime > mergedConfig.overallTimeout) {
                        throw new StreamTimeoutError('Overall stream timeout exceeded');
                    }

                    // Read with idle timeout
                    const timeoutPromise = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new StreamIdleTimeoutError('Idle timeout')), mergedConfig.idleTimeout)
                    );

                    const { done, value } = await Promise.race([
                        reader.read(),
                        timeoutPromise
                    ]);

                    if (done) break;

                    lastEventTime = Date.now();
                    yield value;
                }
            } finally {
                reader.releaseLock();
            }
        } else {
            throw new Error('Unsupported stream type');
        }
    }
}

export class StreamTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StreamTimeoutError';
    }
}

export class StreamIdleTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StreamIdleTimeoutError';
    }
}

export class SSETransportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SSETransportError';
    }
}
```

---

## Sequence Diagrams

### Streaming Request Flow

```
Client                Controller         RequestService      Provider         EventTranslator     OpenAI API
  │                       │                     │                │                    │               │
  │ POST /responses       │                     │                │                    │               │
  ├──────────────────────>│                     │                │                    │               │
  │                       │                     │                │                    │               │
  │                       │ processRequest()    │                │                    │               │
  │                       ├────────────────────>│                │                    │               │
  │                       │                     │                │                    │               │
  │                       │                     │ handleLLMRequest(RESPONSES)         │               │
  │                       │                     ├───────────────>│                    │               │
  │                       │                     │                │                    │               │
  │                       │                     │                │ validateCapabilities()            │
  │                       │                     │                ├────────────────────┤               │
  │                       │                     │                │                    │               │
  │                       │                     │                │ responses.create() │               │
  │                       │                     │                ├────────────────────┼──────────────>│
  │                       │                     │                │                    │               │
  │                       │                     │                │                    │  text.delta   │
  │                       │                     │                │<───────────────────┼───────────────┤
  │                       │                     │                │                    │               │
  │                       │                     │                │ toHolo(event)      │               │
  │                       │                     │                ├───────────────────>│               │
  │                       │                     │                │                    │               │
  │                       │                     │                │  HoloStreamEnvelope│               │
  │                       │                     │                │<───────────────────┤               │
  │                       │                     │                │                    │               │
  │                       │                     │  onResponseChunk()                  │               │
  │                       │                     │<───────────────┤                    │               │
  │                       │                     │                │                    │               │
  │                       │  SSE: data: {...}  │                │                    │               │
  │<──────────────────────┴─────────────────────┤                │                    │               │
  │                       │                     │                │                    │               │
  │                       │                     │                │                    │  tool_call.start
  │                       │                     │                │<───────────────────┼───────────────┤
  │                       │                     │                │ toHolo(event)      │               │
  │                       │                     │                ├───────────────────>│               │
  │                       │                     │                │  HoloStreamEnvelope│               │
  │                       │                     │                │<───────────────────┤               │
  │                       │                     │  onResponseChunk()                  │               │
  │                       │                     │<───────────────┤                    │               │
  │                       │  SSE: data: {...}  │                │                    │               │
  │<──────────────────────┴─────────────────────┤                │                    │               │
  │                       │                     │                │                    │               │
  │                       │                     │                │                    │  response.done
  │                       │                     │                │<───────────────────┼───────────────┤
  │                       │                     │                │ toHolo(event)      │               │
  │                       │                     │                ├───────────────────>│               │
  │                       │                     │                │  message_stop      │               │
  │                       │                     │                │  + usage           │               │
  │                       │                     │                │<───────────────────┤               │
  │                       │                     │  onResponseChunk(done=true)         │               │
  │                       │                     │<───────────────┤                    │               │
  │                       │  SSE: data: {...}  │                │                    │               │
  │                       │  SSE: [DONE]       │                │                    │               │
  │<──────────────────────┴─────────────────────┤                │                    │               │
  │                       │                     │                │                    │               │
```

### Route Selection Flow

**Pure Route-Based Selection (Current):**

```
HTTP Request
  │
  ├─ Route: /openai/v1/chat/completions → RequestType.CHAT ✓
  │
  └─ Route: /openai/v1/responses → RequestType.RESPONSES ✓
```

**No per-request header overrides on public routes.** This keeps routing predictable and prevents confusion.

**⚠️ Important:** X-OpenAI-API-Version header is **NOT supported** on public `/responses` or `/chat/completions` routes. These routes use pure, route-based selection only.

**Future: Generic Gateway Route (Not Implemented)**
If a generic gateway route is added in the future (e.g., `/api/openai/v1/gateway`), it could support per-request selection via:
- X-OpenAI-API-Version header (request override)
- Provider metadata config (provider default)
- Fallback to CHAT

This is intentionally not implemented for public routes to maintain pure, predictable routing. Public routes always use route-based type assignment.

---

## Error Handling Strategy

### Error Mapping Table

| OpenAI Error Code | HTTP Status | Holo Error Type | Retry Strategy | Honors Retry-After |
|-------------------|-------------|-----------------|----------------|-------------------|
| `invalid_request_error` | 400 | `validation_error` | No retry | N/A |
| `authentication_error` | 401 | `auth_error` | No retry | N/A |
| `permission_error` | 403 | `permission_error` | No retry | N/A |
| `not_found_error` | 404 | `not_found` | No retry | N/A |
| `rate_limit_error` | 429 | `rate_limit_error` | Exponential backoff | Yes |
| `server_error` | 500 | `provider_error` | Exponential backoff | No |
| `service_unavailable` | 503 | `provider_unavailable` | Exponential backoff | Yes |
| `timeout` | 504 | `timeout_error` | Exponential backoff | No |
| `network_error` | N/A | `network_error` | Exponential backoff | No |
| `sse_transport_error` | N/A | `stream_error` | No retry | No |

### Error Translator

**File:** `src/providers/openai/translators/error.translator.ts`

```typescript
export class OpenAIErrorTranslator {
    toHoloError(error: any, context?: { requestId?: string; model?: string }): HoloError {
        const openAIError = error.error || error;
        const errorType = openAIError.type || openAIError.code;

        // Extract Retry-After header (for 429/503)
        const retryAfterHeader = error.headers?.['retry-after'];
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

        // Include provider request ID and model
        const providerRequestId = error.headers?.['x-request-id'] || openAIError.request_id;

        return {
            type: this.mapErrorType(errorType),
            message: openAIError.message || 'Unknown error',
            code: openAIError.code || errorType,
            status: error.status || 500,
            retry: this.shouldRetry(errorType),
            backoff: this.getBackoffStrategy(errorType, retryAfterSeconds),
            provider_error: openAIError,  // Preserve raw error (scrubbed of PII)
            provider_request_id: providerRequestId,
            request_id: context?.requestId,
            model: context?.model
        };
    }

    private mapErrorType(code: string): string {
        const mapping: Record<string, string> = {
            'invalid_request_error': 'validation_error',
            'authentication_error': 'auth_error',
            'permission_error': 'permission_error',
            'not_found_error': 'not_found',
            'rate_limit_error': 'rate_limit_error',
            'server_error': 'provider_error',
            'service_unavailable': 'provider_unavailable',
            'timeout': 'timeout_error'
        };

        return mapping[code] || 'unknown_error';
    }

    private shouldRetry(code: string): boolean {
        const retryable = [
            'rate_limit_error',
            'server_error',
            'service_unavailable',
            'timeout'
        ];

        return retryable.includes(code);
    }

    private getBackoffStrategy(code: string, retryAfterSeconds?: number): BackoffStrategy | undefined {
        if (code === 'rate_limit_error') {
            // Honor Retry-After header if present
            if (retryAfterSeconds) {
                return {
                    type: 'fixed',
                    delay_ms: retryAfterSeconds * 1000,
                    max_retries: 3
                };
            }

            return {
                type: 'exponential',
                base_delay_ms: 1000,
                max_delay_ms: 60000,
                max_retries: 3
            };
        }

        if (code === 'service_unavailable') {
            // Honor Retry-After for 503
            if (retryAfterSeconds) {
                return {
                    type: 'fixed',
                    delay_ms: retryAfterSeconds * 1000,
                    max_retries: 5
                };
            }

            return {
                type: 'exponential',
                base_delay_ms: 500,
                max_delay_ms: 30000,
                max_retries: 5
            };
        }

        if (['server_error', 'timeout', 'network_error'].includes(code)) {
            return {
                type: 'exponential',
                base_delay_ms: 500,
                max_delay_ms: 30000,
                max_retries: 5
            };
        }

        return undefined;
    }
}

interface BackoffStrategy {
    type: 'exponential' | 'fixed';
    base_delay_ms?: number;  // For exponential
    delay_ms?: number;       // For fixed
    max_delay_ms?: number;
    max_retries: number;
}
```

**Design Notes:**
- Retry-After header honored for 429/503 (fixed delay)
- Exponential backoff for server errors/timeouts
- Provider request ID included in error context
- Network vs SSE transport errors distinguished

### Streaming Error Handling

```typescript
try {
    for await (const event of streamAdapter.adapt(response)) {
        // Terminal error event from provider
        if (event.type === 'error') {
            const holoError = this.errorTranslator.toHoloError(event, {
                requestId,
                model: responsesRequest.model
            });

            const errorEnvelope: HoloStreamEnvelope = {
                type: 'error',
                error: holoError,
                provider_delta: options.exposeProviderDelta ? event : undefined
            };

            await this.onResponseChunk(
                this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, errorEnvelope),
                false
            );

            // Close stream (terminal error)
            break;
        }

        // Normal event processing...
    }
} catch (error) {
    // Distinguish error types
    const isNetworkError = error instanceof NetworkError;
    const isSSEError = error instanceof SSETransportError;
    const isProviderError = !isNetworkError && !isSSEError;

    logger.error('Stream error', {
        requestId,
        model: responsesRequest.model,
        errorType: isNetworkError ? 'network' : isSSEError ? 'sse_transport' : 'provider',
        message: (error as Error).message,
        stack: (error as Error).stack
    });

    const holoError = this.errorTranslator.toHoloError(error, {
        requestId,
        model: responsesRequest.model
    });

    await this.onResponseChunk(
        this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, {
            type: 'error',
            error: holoError
        }),
        false
    );

    // Do not continue after fatal error
}
```

**Design Notes:**
- Terminal errors close stream immediately (no further processing)
- Network, SSE transport, and provider errors distinguished
- Error context includes request ID and model
- Provider errors include provider request ID
- No continuation after fatal error

---

## Testing Strategy

### Unit Tests

**Event Translators:**
- Each event type translator tested in isolation
- Input: Raw Responses event JSON
- Expected: Holo stream envelope JSON
- Assert structural equality

**Model Capabilities:**
- Exact model match
- Prefix match (e.g., "gpt-4-0613" → "gpt-4")
- Fallback to default

**Error Mapping:**
- All error codes mapped correctly
- Retry strategies assigned correctly
- Backoff calculations correct

### Golden Tests

**Single Event Tests:**

**File:** `test/fixtures/openai/responses/events/text-delta.json`
```json
{
  "input": {
    "type": "text.delta",
    "delta": {
      "content": "Hello"
    }
  },
  "expected": {
    "type": "content_delta",
    "delta": {
      "content": "Hello"
    }
  }
}
```

**Golden Stream Tests (Event Sequences):**

**File:** `test/fixtures/openai/responses/streams/text-only.json`
```json
{
  "name": "Text-only response",
  "events": [
    { "type": "text.delta", "delta": { "content": "Hello" } },
    { "type": "text.delta", "delta": { "content": " world" } },
    { "type": "response.done", "usage": { "prompt_tokens": 10, "completion_tokens": 2 } }
  ],
  "expected": [
    { "type": "content_delta", "delta": { "content": "Hello" } },
    { "type": "content_delta", "delta": { "content": " world" } },
    { "type": "message_stop", "usage": { "input_tokens": 10, "output_tokens": 2 } }
  ]
}
```

**File:** `test/fixtures/openai/responses/streams/tool-call.json`
```json
{
  "name": "Tool call sequence",
  "events": [
    { "type": "tool_call.start", "index": 0, "id": "call_123", "tool_call": { "type": "function", "function": { "name": "get_weather" } } },
    { "type": "tool_call.delta", "index": 0, "id": "call_123", "delta": { "function": { "arguments": "{\"city\":" } } },
    { "type": "tool_call.delta", "index": 0, "id": "call_123", "delta": { "function": { "arguments": "\"NYC\"}" } } },
    { "type": "tool_call.complete", "index": 0, "id": "call_123", "tool_call": { "type": "function", "function": { "name": "get_weather", "arguments": "{\"city\":\"NYC\"}" } } },
    { "type": "response.done", "usage": { "prompt_tokens": 15, "completion_tokens": 5 } }
  ],
  "expected": [
    { "type": "tool_call_start", "tool_call": { "id": "call_123", "name": "get_weather" } },
    { "type": "tool_call_delta", "delta": { "index": 0, "id": "call_123", "arguments": "{\"city\":" } },
    { "type": "tool_call_delta", "delta": { "index": 0, "id": "call_123", "arguments": "\"NYC\"}" } },
    { "type": "tool_call_complete", "tool_call": { "id": "call_123", "name": "get_weather", "arguments": "{\"city\":\"NYC\"}" } },
    { "type": "message_stop", "usage": { "input_tokens": 15, "output_tokens": 5 } }
  ]
}
```

**File:** `test/fixtures/openai/responses/streams/reasoning-then-text.json`
```json
{
  "name": "Reasoning summary followed by text",
  "events": [
    { "type": "reasoning.summary", "summary": "Let me analyze this step by step..." },
    { "type": "text.delta", "delta": { "content": "Based on the analysis, the answer is 42." } },
    { "type": "response.done", "usage": { "prompt_tokens": 20, "completion_tokens": 10, "completion_tokens_details": { "reasoning_tokens": 50 } } }
  ],
  "expected": [
    { "type": "reasoning_summary", "reasoning": "Let me analyze this step by step..." },
    { "type": "content_delta", "delta": { "content": "Based on the analysis, the answer is 42." } },
    { "type": "message_stop", "usage": { "input_tokens": 20, "output_tokens": 10, "reasoning_tokens": 50 } }
  ]
}
```

**File:** `test/fixtures/openai/responses/streams/mixed-ordering.json`
```json
{
  "name": "Mixed event ordering (text + tool + structured)",
  "events": [
    { "type": "text.delta", "delta": { "content": "I'll help with that. " } },
    { "type": "tool_call.start", "index": 0, "id": "call_1", "tool_call": { "type": "function", "function": { "name": "search" } } },
    { "type": "text.delta", "delta": { "content": "Let me search..." } },
    { "type": "tool_call.delta", "index": 0, "id": "call_1", "delta": { "function": { "arguments": "{\"q\":\"test\"}" } } },
    { "type": "tool_call.complete", "index": 0, "id": "call_1", "tool_call": { "type": "function", "function": { "name": "search", "arguments": "{\"q\":\"test\"}" } } },
    { "type": "text.delta", "delta": { "content": " Done." } },
    { "type": "response.done", "usage": { "prompt_tokens": 25, "completion_tokens": 15 } }
  ],
  "expected_behavior": "Events arrive interleaved; translator preserves order; tool deltas buffered until complete"
}
```

**File:** `test/fixtures/openai/responses/streams/out-of-order-delta-before-start.json`
```json
{
  "name": "Out-of-order: tool_call.delta arrives before tool_call.start",
  "events": [
    { "type": "tool_call.delta", "index": 0, "id": "call_abc", "delta": { "function": { "arguments": "{\"query\":" } } },
    { "type": "tool_call.start", "index": 0, "id": "call_abc", "tool_call": { "type": "function", "function": { "name": "search_db" } } },
    { "type": "tool_call.delta", "index": 0, "id": "call_abc", "delta": { "function": { "arguments": "\"test\"}" } } },
    { "type": "tool_call.complete", "index": 0, "id": "call_abc", "tool_call": { "type": "function", "function": { "name": "search_db", "arguments": "{\"query\":\"test\"}" } } },
    { "type": "response.done", "usage": { "prompt_tokens": 10, "completion_tokens": 5 } }
  ],
  "expected": [
    { "type": "tool_call_start", "tool_call": { "id": "call_abc", "name": "search_db" } },
    { "type": "tool_call_delta", "delta": { "index": 0, "id": "call_abc", "arguments": "{\"query\":" } },
    { "type": "tool_call_delta", "delta": { "index": 0, "id": "call_abc", "arguments": "\"test\"}" } },
    { "type": "tool_call_complete", "tool_call": { "id": "call_abc", "name": "search_db", "arguments": "{\"query\":\"test\"}" } },
    { "type": "message_stop", "usage": { "input_tokens": 10, "output_tokens": 5 } }
  ],
  "expected_behavior": "First delta buffered; waits 2s for .start; emits .start then buffered deltas in order"
}
```

**File:** `test/fixtures/openai/responses/streams/out-of-order-timeout.json`
```json
{
  "name": "Out-of-order timeout: tool_call.delta without .start",
  "events": [
    { "type": "tool_call.delta", "index": 0, "id": "call_orphan", "delta": { "function": { "arguments": "{\"x\":1}" } } },
    { "type": "text.delta", "delta": { "content": "Some text" } },
    { "type": "response.done", "usage": { "prompt_tokens": 5, "completion_tokens": 2 } }
  ],
  "expected": [
    { "type": "error", "error": { "message": "tool_call.delta received without preceding .start; timeout after 2s", "code": "out_of_order_timeout" } }
  ],
  "expected_behavior": "Delta buffered; .start never arrives; timeout after 2s; emit error; close stream"
}
```

Run all golden tests:
```typescript
const fixtures = loadFixtures('test/fixtures/openai/responses/events/*.json');

for (const fixture of fixtures) {
    test(`Golden event test: ${fixture.name}`, async () => {
        const translator = container.resolve(OpenAIResponsesEventTranslator);
        const result = await translator.toHolo(fixture.input, { exposeProviderDelta: false });
        expect(result).toEqual(fixture.expected);
    });
}

const streamFixtures = loadFixtures('test/fixtures/openai/responses/streams/*.json');

for (const fixture of streamFixtures) {
    test(`Golden stream test: ${fixture.name}`, async () => {
        const translator = container.resolve(OpenAIResponsesEventTranslator);
        const results = [];

        for (const event of fixture.events) {
            const holoEvent = await translator.toHolo(event, { exposeProviderDelta: false });
            results.push(holoEvent);
        }

        expect(results).toEqual(fixture.expected);
    });
}
```

### Integration Tests

**Streaming flow:**
1. Mock OpenAI Responses API
2. Emit sequence of events (text, tool_call, reasoning, done)
3. Assert Holo envelopes received in order
4. Assert usage metadata present in final chunk with ttft_ms, gen_ms, tokens_per_sec

**Prompt caching:**
1. Request with previous_response_id
2. Assert usage includes cached_tokens > 0
3. Assert prompt_cache_hit = true
4. Compare TTFT with/without caching

**Model capabilities:**
1. Request structured output from unsupported model → assert 400 error
2. Request reasoning from non-reasoning model → assert warning logged, field omitted
3. Request vision from non-vision model → assert 400 error

**Error handling:**
1. Mock 429 rate limit error with Retry-After header
2. Assert Holo error has retry=true
3. Assert backoff strategy uses Retry-After value (fixed delay)
4. Assert provider_request_id included

**SSE reconnect & out-of-order:**
1. Mock tool_call.delta arriving before tool_call.start
2. Assert translator buffers delta and waits (2s timeout)
3. Mock tool_call.start arrival → assert buffered deltas flushed
4. Mock timeout → assert error emitted

**Terminal error:**
1. Mock error event mid-stream
2. Assert stream closes immediately
3. Assert no further events processed

---

## Architecture Decision Records (ADRs)

### ADR-1: Event-Based Translation vs Delta-Only

**Context:** Responses API emits semantic events (text.delta, tool_call.start, etc.), unlike Chat Completions which emits generic delta chunks.

**Decision:** Implement event-based translation with specialized translators per event type.

**Rationale:**
- Semantic events require different handling (e.g., tool_call.start needs buffering until complete)
- Type safety: Each event type has specific schema
- Extensibility: Easy to add new event types without modifying core logic

**Alternatives Considered:**
- Generic delta translator with conditional logic → rejected (too complex, hard to test)
- Single monolithic translator → rejected (violates single responsibility)

---

### ADR-2: Capabilities Map vs Runtime Discovery

**Context:** Not all models support all Responses API features.

**Decision:** Static capabilities map with fallback chain (exact → prefix → default).

**Rationale:**
- Fail fast: Validate before API call (avoid wasted tokens)
- Clear error messages: "Model X does not support reasoning"
- Testable: Deterministic behavior

**Alternatives Considered:**
- Runtime discovery via OpenAI Models API → rejected (adds latency, may not expose capabilities)
- No validation → rejected (poor UX, hard to debug)

---

### ADR-3: Per-Request Override via Header

**Context:** Need flexibility to toggle APIs per request for A/B testing.

**Decision:** Support X-OpenAI-API-Version header with three-tier priority.

**Rationale:**
- Flexibility: Single deployment supports both APIs
- A/B testing: Route traffic dynamically
- Backward compatible: No header = existing behavior

**Alternatives Considered:**
- Separate endpoints only → rejected (less flexible, harder to test)
- Query param → rejected (breaks OpenAI SDK compatibility)

---

## Summary

### Key Architecture Principles

1. **Isolation:** Chat Completions and Responses APIs remain separate (no shared state)
2. **Event-Driven:** Responses API translation uses event-based architecture
3. **Capabilities-Aware:** Pre-request validation against model capabilities
4. **Lossless:** Raw events preserved in provider_delta for round-tripping
5. **Backward Compatible:** Zero impact on existing Chat Completions users
6. **Testable:** Golden tests for all event types, integration tests for flows

### Component Summary

| Component | Purpose | New/Modified |
|-----------|---------|--------------|
| `openai.routes.ts` | Add /responses route | Modified |
| `openai.controller.ts` | Add responses() method | Modified |
| `request.service.ts` | Pure route-based selection | Modified |
| `openai.provider.ts` | Add _openaiResponses() | Modified |
| `model-capabilities.ts` | Capabilities map with overlay | New |
| `ResponsesStreamAdapter` | SSE/iterator abstraction | New |
| `OpenAIResponsesEventTranslator` | Event orchestrator | New |
| `TextDeltaTranslator` | Text event translation | New |
| `ToolCallStartTranslator` | Tool call start | New |
| `ToolCallDeltaTranslator` | Tool call delta buffering | New |
| `ToolCallCompleteTranslator` | Tool call completion | New |
| `StructuredOutputTranslator` | Structured data translation | New |
| `ReasoningSummaryTranslator` | Reasoning translation | New |
| `UsageTranslator` | Usage with cache metadata | Modified |
| `ErrorTranslator` | Error with Retry-After | Modified |
| `responses.requests.ts` | Request types (provider-exact) | New |
| `responses.responses.ts` | Response types + EVENT_MAP | New |
| `holo/types/responses.ts` | Holo extensions | New |

### SDK Version & Compatibility

**OpenAI SDK Version Pin:**
```json
{
  "dependencies": {
    "openai": "^7.0.0"  // Pin to version with Responses API support
  }
}
```

**Compatibility Requirements:**
- Responses API event schema support
- `client.responses.create()` method available
- Streaming via async iterator or ReadableStream

**Schema Compatibility Check:**

**File:** `src/providers/openai/validators/schema-compatibility.test.ts`

```typescript
import { describe, test, expect } from '@jest/globals';
import { EVENT_MAP } from '../types/responses.responses';

describe('OpenAI Responses API Schema Compatibility', () => {
    test('EVENT_MAP covers all known event types', () => {
        const knownEvents = [
            'text.delta',
            'tool_call.start',
            'tool_call.delta',
            'tool_call.complete',
            'structured.output',
            'reasoning.summary',
            'response.done',
            'error'
        ];

        for (const eventType of knownEvents) {
            expect(EVENT_MAP).toHaveProperty(eventType);
        }
    });

    test('Unknown event types fail fast in translator', async () => {
        const unknownEvent = { type: 'unknown.new.event', data: {} };
        const translator = container.resolve(OpenAIResponsesEventTranslator);

        const result = await translator.toHolo(unknownEvent);
        expect(result.type).toBe('unknown');
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('Unknown Responses event type')
        );
    });

    test('SDK version supports Responses API', async () => {
        const openai = new OpenAI({ apiKey: 'test' });
        expect(openai.responses).toBeDefined();
        expect(typeof openai.responses.create).toBe('function');
    });
});
```

**CI/CD Schema Validation:**
Add to CI pipeline:
```yaml
- name: Validate OpenAI SDK compatibility
  run: |
    npm test -- schema-compatibility.test.ts
```

**Design Notes:**
- Pin SDK version to prevent breaking changes
- Schema compatibility tests fail fast if OpenAI changes event taxonomy
- Unknown event types logged with warning (don't crash, but alert monitoring)
- CI enforces compatibility checks before merge

### Next Steps

1. **Architecture Review** ✅ (this document)
2. **Plan Creation** → Break down into specific implementation tasks
3. **SDK Verification** → Verify OpenAI SDK 7.x compatibility
4. **Implementation** → Build phase-by-phase with tests

---

## Observability & Operations

### OpenTelemetry Spans

**Provider call span attributes:**
```typescript
span.setAttributes({
    'request.id': requestId,
    'model': responsesRequest.model,
    'stream': responsesRequest.stream || false,
    'provider': 'openai',
    'api_type': 'responses',
    'provider.request_id': providerRequestId,  // From response headers
    'usage.input_tokens': usage.input_tokens,
    'usage.output_tokens': usage.output_tokens,
    'usage.cached_tokens': usage.cached_tokens || 0,
    'usage.cache_hit': usage.prompt_cache_hit,
    'usage.ttft_ms': ttft_ms,
    'usage.gen_ms': gen_ms,
    'usage.tokens_per_sec': tokens_per_sec
});
```

**Span events:**
- `first_token` - Time to first content/tool/reasoning event
- `cache_hit` - If cached_tokens > 0
- `error` - Terminal error details

### Logging Strategy

**Log event types and counts, not contents:**
```typescript
logger.info('Responses stream complete', {
    requestId,
    model,
    eventCounts: {
        text_delta: 42,
        tool_call_start: 2,
        tool_call_delta: 15,
        tool_call_complete: 2,
        reasoning_summary: 1
    },
    totalBytes: bufferSize,
    ttft_ms,
    gen_ms,
    cacheHit: true
});
```

**Never log:**
- Full event payloads (PII risk)
- User inputs or model outputs
- Tool arguments (may contain secrets)

**Always scrub** `provider_error` payloads for:
- API keys
- Tokens
- PII (emails, names, etc.)

### Resource Limits

**Per-request limits (configurable):**
```typescript
{
    max_stream_duration_ms: 600000,  // 10 minutes
    max_text_buffer_bytes: 10485760,  // 10 MB
    tool_call_buffer_timeout_ms: 5000,  // 5s
    out_of_order_wait_timeout_ms: 2000,  // 2s
    idle_timeout_ms: 30000  // 30s (no events)
}
```

**Concurrency limits:**
- Max concurrent streams per provider: 100 (configurable)
- Connection pool size: 20
- Request queue depth: 1000

### SLOs & Alerts

**Service Level Objectives:**
- Stream error rate < 1%
- TTFT p95 < 2000ms (non-cached)
- TTFT p95 < 500ms (cached)
- Cache hit rate > 40% (for stateful conversations)

**Alerts:**
- Error rate > 5% (critical)
- TTFT p95 > 5000ms (warning)
- Cache hit rate < 20% (info)
- Concurrent streams > 80 (warning)

### Metrics to Emit

**Per-request:**
- `openai_responses_request_duration_ms` (histogram)
- `openai_responses_ttft_ms` (histogram)
- `openai_responses_tokens_per_sec` (histogram)
- `openai_responses_cache_hit` (counter)
- `openai_responses_error` (counter, labeled by error_type)

**Per-event:**
- `openai_responses_event_count` (counter, labeled by event_type)
- `openai_responses_event_bytes` (histogram)

**Buffer metrics:**
- `openai_responses_buffer_size_bytes` (gauge)
- `openai_responses_buffer_timeout` (counter)

---

## Security & Privacy

### Provider Delta Exposure

**Default behavior:**
```typescript
// Never expose provider_delta to external clients
const holoEvent = await this.responsesEventTranslator.toHolo(event, {
    exposeProviderDelta: false  // Default
});
```

**Admin/debug mode only:**
```typescript
// Only for internal debugging, never in production for external clients
const holoEvent = await this.responsesEventTranslator.toHolo(event, {
    exposeProviderDelta: req.headers['x-debug'] === 'true' && isAdmin(req)
});
```

### Error Scrubbing

**Before logging provider errors:**
```typescript
function scrubProviderError(error: any): any {
    const scrubbed = { ...error };

    // Remove sensitive fields
    delete scrubbed.api_key;
    delete scrubbed.authorization;
    delete scrubbed.token;

    // Scrub PII from messages
    if (scrubbed.message) {
        scrubbed.message = scrubbed.message
            .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
            .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    }

    return scrubbed;
}
```

### Reasoning Exposure

**Off by default for external clients:**
```typescript
// Reasoning only for admin/debug or explicit opt-in
const exposeReasoning =
    (req.headers['x-expose-reasoning'] === 'true' && isAdmin(req)) ||
    provider.metadata?.expose_reasoning === true;

const holoEvent = await this.responsesEventTranslator.toHolo(event, {
    exposeReasoning
});
```

---

## Residual Risks & Mitigations

### Risk 1: OpenAI Spec Churn
**Risk:** OpenAI may evolve event taxonomy or change Responses API schema
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Pin SDK version to specific release
- CI schema compatibility tests fail fast on changes
- EVENT_MAP provides single source of truth for updates
- Unknown event types logged (don't crash)

### Risk 2: Unknown Models
**Risk:** New models released without capability metadata
**Probability:** High
**Impact:** Low
**Mitigation:**
- Capability overlay defaults conservative (all features disabled)
- May over-reject new models until overlay updates
- Acceptable for MVP - admin can update MODEL_CAPABILITIES_OVERLAY env var
- Future: Auto-discover capabilities via Models API (post-MVP)

### Risk 3: SSE Reconnect Semantics
**Risk:** Client disconnect/reconnect may cause duplicate or missed events
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Test reconnection scenarios (idle timeout, network drop)
- Document operational guidance: client should retry with backoff
- Idempotency: Responses API supports `previous_response_id` for stateful recovery
- Non-idempotent operations (tool calls) require client-side deduplication

### Risk 4: Buffer Exhaustion
**Risk:** Very long responses may exceed 10MB text buffer cap
**Probability:** Low
**Impact:** Low
**Mitigation:**
- Log truncation warning with request_id and model
- Monitor `buffer_size_bytes` metric for patterns
- Configurable buffer cap (default 10MB)
- Future: Streaming pass-through without accumulation (post-MVP)

---

## Post-MVP Enhancements

### Nice-to-Have Features
1. **Jittered exponential backoff** - Prevents thundering herd on rate limits
2. **Backpressure policy** - Drop/compact long text deltas if client is slow
3. **Per-tenant feature flags** - Expose reasoning/provider_delta per-tenant
4. **SLO dashboards** - Prebuilt Grafana dashboards for TTFT p95, cache hit rate
5. **Auto-capability discovery** - Query Models API for feature support
6. **Streaming pass-through** - No text accumulation for very long responses
7. **Client reconnect protocol** - Explicit resume semantics with event IDs

---

## Architecture Review Checklist

- [x] Pure route-based selection (no header overrides on public routes)
- [x] Provider-exact DTOs (input[] not messages/prompt)
- [x] Canonical event naming (EVENT_MAP single source of truth)
- [x] Provider delta gated (exposeProviderDelta=false default)
- [x] Reasoning off by default (opt-in for external clients)
- [x] Divide-by-zero guards (tokens_per_sec calculation)
- [x] Retry-After honored (429/503 fixed delay)
- [x] Terminal errors close stream (no further processing)
- [x] ResponsesStreamAdapter registered and documented
- [x] Golden tests for all 8 event types + out-of-order cases
- [x] Observability (OTel spans, metrics, logging strategy)
- [x] Security (error scrubbing, PII prevention)
- [x] SDK version pinned with CI compatibility checks
- [x] Component summary includes all new translators

---

**Status:** Architecture gate complete. All must-do items resolved. Ready for plan gate.

**MVP Decision:** ✅ **GO** (93.4/100)
- Scope: ✅ Clear, bounded
- Correctness: ✅ Provider-exact DTOs, event normalization
- Backward compat: ✅ Zero impact on Chat Completions
- Translation: ✅ Per-event architecture with buffering
- Capabilities: ✅ Strict validation with graceful degradation
- Errors: ✅ Retry-After, terminal semantics
- Streaming: ✅ Buffering, timeouts, TTFT capture
- Observability: ✅ OTel, metrics, SLOs
- Security: ✅ Gating, scrubbing, defaults
- Tests: ✅ Golden + integration + out-of-order
- Performance: ✅ Limits, guards, caps

**Next:** Plan gate - file-level tasks with time estimates
