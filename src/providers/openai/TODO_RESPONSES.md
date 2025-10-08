# OpenAI Responses API Implementation Plan

> **Status**: Planning Phase - DO NOT IMPLEMENT YET
> **Created**: 2025-10-08
> **Target**: This file should be deleted after implementation is complete and global documentation is updated

---

## Executive Summary

OpenAI introduced the **Responses API** in March 2025 as a unified, stateful API that supersedes both Chat Completions and Assistants APIs. While Chat Completions **will continue to be supported indefinitely** (it's not being deprecated), the Responses API is expected to become the default for new development.

**Current State:**
- OpenAI SDK version: `6.2.0` (package.json:38)
- Latest version: likely `6.x.x` with Responses API support
- Current endpoint: `/v1/chat/completions` (openai.routes.ts:11)
- New endpoint: `/v1/responses`

**Key Differences:**
- **Stateful by default** - conversations and tool state tracked automatically
- **40-80% better cache utilization** compared to Chat Completions
- **Multi-output format** - returns structured events with intermediate steps
- **Reasoning exposure** - exposes model's step-by-step thought process
- **Multimodal first-class** - text, images, audio, function calls unified

---

## Plan Overview

### **Phase 1: SDK Upgrade** (Foundation)
Upgrade to the latest OpenAI SDK that includes Responses API support

### **Phase 2: Type System Extension** (Type Layer)
Create parallel type definitions for Responses API alongside existing Chat Completions types

### **Phase 3: Translation Layer** (Core Logic)
Build bidirectional translators between Holo ↔ Responses format

### **Phase 4: Provider Integration** (Runtime Layer)
Extend OpenAIProvider to support both Chat Completions and Responses endpoints

### **Phase 5: API Endpoints** (HTTP Layer)
Add new `/openai/responses` route alongside existing `/openai/chat/completions`

### **Phase 6: Migration Path** (Future-Proofing)
Provide configuration option to toggle between endpoints

---

## Detailed Step-by-Step Design

### Phase 1: SDK Upgrade

#### 1.1 Upgrade OpenAI Package
```bash
npm install openai@latest
npm install @types/node@latest  # May need updated types
```

#### 1.2 Version Compatibility Check
- Review OpenAI SDK changelog for breaking changes
- Test existing Chat Completions implementation still works
- Document any migration notes

**Files to verify:**
- `package.json` - Update version
- `package-lock.json` - Lock dependencies
- `src/providers/openai/openai.provider.ts:24-28` - Verify client initialization still works

---

### Phase 2: Type System Extension

#### 2.1 Create Responses API Type Definitions

**New file:** `src/providers/openai/types/responses.requests.ts`
```typescript
// Based on Responses API structure
export interface OpenAIResponseRequest {
    model: string;
    prompt?: string;  // Simple text prompt
    messages?: OpenAIMessage[];  // Or conversation history
    tools?: OpenAITool[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stream_options?: { include_usage?: boolean };
    // Responses-specific fields
    state?: 'stateful' | 'stateless';  // State management mode
    session_id?: string;  // For stateful sessions
    // ... other Responses API fields
}
```

**New file:** `src/providers/openai/types/responses.responses.ts`
```typescript
export interface OpenAIResponseOutput {
    id: string;
    object: 'response';
    created: number;
    model: string;
    output_items: OpenAIOutputItem[];  // Multiple outputs (text, tools, etc.)
    usage?: OpenAIUsage;
    finish_reason?: string;
}

export interface OpenAIOutputItem {
    type: 'text' | 'tool_call' | 'structured_output';
    text?: string;
    tool_call?: OpenAIToolCall;
    structured_data?: any;
}

// Streaming chunk format
export interface OpenAIResponseChunk {
    id: string;
    object: 'response.chunk';
    created: number;
    model: string;
    delta: OpenAIResponseDelta;
    finish_reason?: string;
}

export interface OpenAIResponseDelta {
    type: 'text' | 'tool_call' | 'thinking';
    content?: string;
    tool_call?: Partial<OpenAIToolCall>;
    // Responses API exposes intermediate reasoning
    thinking?: string;
}
```

#### 2.2 Create Validators

**New file:** `src/providers/openai/validators/openai.responses.requests.ts`
```typescript
import { type } from 'arktype';

export const OpenAIResponseRequestValidator = type({
    model: 'string',
    'prompt?': 'string',
    'messages?': 'OpenAIMessage[]',  // Reuse existing
    'temperature?': 'number',
    'max_tokens?': 'number',
    'stream?': 'boolean',
    'state?': "'stateful' | 'stateless'",
    'session_id?': 'string',
    // ...
});
```

**New file:** `src/providers/openai/validators/openai.responses.responses.ts`
```typescript
export const OpenAIResponseOutputValidator = type({
    id: 'string',
    object: "'response'",
    created: 'number',
    model: 'string',
    output_items: 'OpenAIOutputItem[]',
    'usage?': OpenAIUsageValidator,
    'finish_reason?': 'string'
});

export const OpenAIResponseChunkValidator = type({
    id: 'string',
    object: "'response.chunk'",
    created: 'number',
    model: 'string',
    delta: OpenAIResponseDeltaValidator,
    'finish_reason?': 'string'
});
```

---

### Phase 3: Translation Layer

#### 3.1 Extend Holo Types (if needed)

**File:** `src/providers/holo/types/requests.ts`
```typescript
// Potentially add new fields to support Responses API features
export interface HoloRequest {
    // Existing fields...

    // NEW: Responses API state management
    state_mode?: 'stateful' | 'stateless';
    session_id?: string;
}
```

**File:** `src/providers/holo/types/responses.ts`
```typescript
// Potentially add new output types
export interface HoloResponseOutput {
    // Existing fields...

    // NEW: Multi-output support
    outputs?: HoloOutputItem[];
}

export interface HoloOutputItem {
    type: 'text' | 'tool_result' | 'structured_data' | 'reasoning';
    content?: string;
    tool_result?: HoloToolResult;
    structured_data?: any;
    reasoning?: string;  // Exposed by Responses API
}
```

#### 3.2 Create Request Translators

**New file:** `src/providers/openai/translators/openai.responses.request.translator.ts`
```typescript
@injectable()
export class OpenAIResponsesRequestTranslator extends BaseTranslator<
    HoloRequest,
    OpenAIResponseRequest
> {
    protected holoValidator = HoloRequestValidator;
    protected providerValidator = OpenAIResponseRequestValidator;

    protected async fromHoloManyImpl(
        source: HoloRequest
    ): Promise<Partial<OpenAIResponseRequest>[]> {
        return [{
            model: source.model,
            messages: source.messages,  // Reuse existing message translator
            temperature: source.temperature,
            max_tokens: source.max_tokens,
            stream: source.stream,
            // Map Holo → Responses API specific fields
            state: source.state_mode,
            session_id: source.session_id,
            // ...
        }];
    }

    protected async toHoloManyImpl(
        source: OpenAIResponseRequest
    ): Promise<Partial<HoloRequest>[]> {
        // Reverse mapping
        return [{
            model: source.model,
            messages: source.messages,
            temperature: source.temperature,
            max_tokens: source.max_tokens,
            stream: source.stream,
            state_mode: source.state,
            session_id: source.session_id,
            // ...
        }];
    }
}
```

#### 3.3 Create Response Translators

**New file:** `src/providers/openai/translators/openai.responses.response.translator.ts`
```typescript
@injectable()
export class OpenAIResponsesResponseTranslator extends BaseTranslator<
    HoloResponse,
    OpenAIResponseOutput
> {
    protected holoValidator = HoloResponseValidator;
    protected providerValidator = OpenAIResponseOutputValidator;

    protected async toHoloManyImpl(
        source: OpenAIResponseOutput
    ): Promise<Partial<HoloResponse>[]> {
        // Map multi-output format → Holo
        const textOutput = source.output_items.find(i => i.type === 'text');

        return [{
            id: source.id,
            model: source.model,
            created: source.created * 1000,  // seconds → milliseconds
            messages: [{
                role: 'assistant',
                content: textOutput?.text || ''
            }],
            outputs: source.output_items.map(this.mapOutputItem),
            finish_reason: source.finish_reason,
            usage: source.usage ? {
                input_tokens: source.usage.prompt_tokens,
                output_tokens: source.usage.completion_tokens
            } : undefined
        }];
    }

    private mapOutputItem(item: OpenAIOutputItem): HoloOutputItem {
        // Transform output items
        return {
            type: item.type === 'text' ? 'text' :
                  item.type === 'tool_call' ? 'tool_result' :
                  'structured_data',
            content: item.text,
            tool_result: item.tool_call,
            structured_data: item.structured_data
        };
    }
}
```

#### 3.4 Create Streaming Translators

**New files:**
- `src/providers/openai/translators/streaming/openai.responses.stream.translator.ts` (orchestrator)
- `src/providers/openai/translators/streaming/openai.responses.delta.translator.ts`
- `src/providers/openai/translators/streaming/openai.responses.thinking.translator.ts` (new: exposes reasoning)

**Key differences from Chat Completions streaming:**
- Responses API emits intermediate reasoning steps (`thinking` deltas)
- Multi-output streaming (text + tool calls + structured outputs interleaved)
- Session state preservation across streams

---

### Phase 4: Provider Integration

#### 4.1 Extend OpenAIProvider

**File:** `src/providers/openai/openai.provider.ts`

**Add new method:**
```typescript
async _openaiResponses(
    sourceId: string,
    requestId: string,
    responsesRequest: OpenAIResponseRequest
): Promise<void> {
    const logger = this.mlog(this._openaiResponses);
    await this.ensureInitialized();
    this.validateModel(responsesRequest.model);

    let fullResponse = '';

    // Call new /v1/responses endpoint
    // Note: Requires OpenAI SDK 6.x+ with Responses API support
    const response = await this.client.responses.create(responsesRequest);
    const startTime = Date.now();
    let timeToFirst: number = 0;

    if (responsesRequest.stream) {
        logger.debug('Starting OpenAI Responses stream', { requestId, model: responsesRequest.model });

        try {
            for await (const chunk of response) {
                logger.debug(`Responses chunk: ${JSON.stringify(chunk)}`);

                // Handle usage in final chunk
                if (chunk?.usage) {
                    chunk.usage.timeToFirstToken = timeToFirst;
                    chunk.usage.totalProcessingTime = Date.now() - startTime;
                    const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk, fullResponse);
                    await this.onResponseChunk(responseChunk, true);
                    break;
                }

                // Handle delta content
                const delta = chunk.delta;
                if (delta?.content) {
                    if (timeToFirst == 0) timeToFirst = Date.now() - startTime;
                    fullResponse += delta.content;

                    const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk);
                    await this.onResponseChunk(responseChunk);
                }

                // NEW: Handle reasoning/thinking deltas (Responses API specific)
                if (delta?.thinking) {
                    logger.debug('Reasoning step:', delta.thinking);
                    // Optionally emit reasoning chunks
                }
            }
        } catch (error) {
            logger.error('OpenAI Responses stream error', {
                requestId,
                error: (error as Error).message
            });
            throw error;
        }
    } else {
        // Non-streaming response
        logger.debug('Starting OpenAI Responses non-streaming', { requestId, model: responsesRequest.model });
        const output = response as OpenAIResponseOutput;

        // Extract text from multi-output format
        const textOutput = output.output_items.find(i => i.type === 'text');
        fullResponse = textOutput?.text || '';

        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, response, fullResponse);
        await this.onResponseChunk(responseChunk, true);
    }
}
```

**Update handleLLMRequest:**
```typescript
async handleLLMRequest(
    sourceId: string,
    requestId: string,
    payload: ProviderRequest,
    type: RequestType
): Promise<AIRequestStat> {
    // NEW: Support RequestType.RESPONSES
    if (type === RequestType.RESPONSES) {
        const responsesPayload = payload as OpenAIResponseRequest;
        return await this.wrapWithStats(type, this._openaiResponses.bind(this), sourceId, requestId, responsesPayload);
    }

    // Existing: Chat Completions
    const chatPayload = payload as OpenAIChatRequest;
    return await this.wrapWithStats(type, this._openaiChatCompletions.bind(this), sourceId, requestId, chatPayload);
}
```

---

### Phase 5: API Endpoints

#### 5.1 Add RequestType Enum

**File:** `src/providers/types/index.ts`
```typescript
export enum RequestType {
    CHAT = 'chat',
    GENERATE = 'generate',
    RESPONSES = 'responses',  // NEW
}
```

#### 5.2 Add Controller Method

**File:** `src/api/controllers/openai.controller.ts`

**Add new method:**
```typescript
public responses = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
    try {
        await this.requestService.processRequest(
            ProviderType.OPENAI,
            RequestType.RESPONSES,  // NEW
            req,
            res
        );
    } catch (error) {
        logger.error('Error: ' + (error as Error).stack);
        this.handleError(res, error as Error, 'Failed to complete response');
    }
}
```

#### 5.3 Add Route

**File:** `src/api/routes/openai.routes.ts`

**Add route:**
```typescript
export function createOpenAIRoutes(): express.Router {
    const openAIRouter = express.Router();
    const openAIController: OpenAIController = container.resolve(OpenAIController);

    // Existing
    openAIRouter.post('/chat/completions', openAIController.chatCompletions);

    // NEW: Responses API endpoint
    openAIRouter.post('/responses', openAIController.responses);

    openAIRouter.post('/models', openAIController.models);
    return openAIRouter;
}
```

---

### Phase 6: Migration Path & Configuration

#### 6.1 Add Configuration Option

**File:** `src/cache/types/provider.ts`
```typescript
export interface Provider {
    // Existing fields...

    // NEW: API version preference
    openai_api_version?: 'chat_completions' | 'responses';
}
```

#### 6.2 Request Service Logic

**File:** `src/admin/services/request.service.ts`

**Update to auto-route based on configuration:**
```typescript
async processRequest(
    providerType: ProviderType,
    type: RequestType,
    req: HttpApiRequest,
    res: ApiResponse
): Promise<void> {
    // Auto-select endpoint based on provider config
    if (providerType === ProviderType.OPENAI) {
        const provider = await this.getProvider(req);

        if (provider.openai_api_version === 'responses') {
            type = RequestType.RESPONSES;
        } else {
            type = RequestType.CHAT;
        }
    }

    // Continue with existing flow...
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│           HTTP Layer (Express Routes)               │
│  /openai/chat/completions  |  /openai/responses    │
└───────────────┬───────────────────┬─────────────────┘
                │                   │
┌───────────────▼───────────────────▼─────────────────┐
│            OpenAIController                          │
│  chatCompletions()  |  responses()                  │
└───────────────┬───────────────────┬─────────────────┘
                │                   │
┌───────────────▼───────────────────▼─────────────────┐
│            RequestService                            │
│  processRequest(type: CHAT | RESPONSES)             │
└───────────────┬───────────────────┬─────────────────┘
                │                   │
┌───────────────▼───────────────────▼─────────────────┐
│            OpenAIProvider                            │
│  _openaiChatCompletions() | _openaiResponses()      │
└───────────────┬───────────────────┬─────────────────┘
                │                   │
┌───────────────▼───────────────────▼─────────────────┐
│          OpenAI SDK 6.x+                             │
│  client.chat.completions.create()                   │
│  client.responses.create()  ← NEW                   │
└──────────────────────────────────────────────────────┘

Translation Layer (Parallel):

┌──────────────────┐         ┌──────────────────────┐
│  Chat Completions │         │   Responses API      │
│    Translators    │         │    Translators       │
│                   │         │                      │
│  - Request        │         │  - Request           │
│  - Response       │         │  - Response          │
│  - Message        │         │  - Output Items      │
│  - Stream         │         │  - Stream            │
│  - Delta          │         │  - Delta             │
│                   │         │  - Thinking ← NEW    │
└────────┬──────────┘         └────────┬─────────────┘
         │                             │
         └──────────┬──────────────────┘
                    │
            ┌───────▼────────┐
            │  Holo Format   │
            │  (Universal)   │
            └────────────────┘
```

---

## Implementation Checklist

### Phase 1: SDK Upgrade
- [ ] Upgrade `openai` package to latest version
- [ ] Test existing Chat Completions still work
- [ ] Document breaking changes

### Phase 2: Type System
- [ ] Create `types/responses.requests.ts`
- [ ] Create `types/responses.responses.ts`
- [ ] Create `validators/openai.responses.requests.ts`
- [ ] Create `validators/openai.responses.responses.ts`

### Phase 3: Translation Layer
- [ ] Extend Holo types for Responses features
- [ ] Create `translators/openai.responses.request.translator.ts`
- [ ] Create `translators/openai.responses.response.translator.ts`
- [ ] Create streaming translators:
  - [ ] `streaming/openai.responses.stream.translator.ts`
  - [ ] `streaming/openai.responses.delta.translator.ts`
  - [ ] `streaming/openai.responses.thinking.translator.ts`

### Phase 4: Provider Integration
- [ ] Add `_openaiResponses()` method to `OpenAIProvider`
- [ ] Update `handleLLMRequest()` to route Responses requests
- [ ] Add `RequestType.RESPONSES` enum value

### Phase 5: API Endpoints
- [ ] Add `responses()` method to `OpenAIController`
- [ ] Add `/responses` route to `openai.routes.ts`
- [ ] Update request validation

### Phase 6: Configuration
- [ ] Add `openai_api_version` to Provider config
- [ ] Add auto-routing logic in RequestService
- [ ] Add feature flag for gradual rollout

### Testing
- [ ] Unit tests for new translators
- [ ] Integration tests for Responses endpoint
- [ ] Round-trip tests (Holo ↔ Responses)
- [ ] Stream tests with reasoning exposure
- [ ] Backward compatibility tests for Chat Completions

### Documentation
- [ ] Create `src/providers/openai/RESPONSES.md` (detailed implementation docs)
- [ ] Update `src/providers/openai/README.md` (add Responses API section)
- [ ] Add migration guide
- [ ] Update API documentation
- [ ] **DELETE THIS FILE** after completion

---

## Key Considerations

### Backward Compatibility
- **Chat Completions continues to work** - no breaking changes
- Both endpoints coexist
- Configuration-driven routing

### Translation Complexity
- **Multi-output format** (Responses) vs **single-message format** (Chat Completions)
- **Reasoning exposure** in Responses API (new `thinking` deltas)
- **State management** (stateful vs stateless sessions)

### Architecture Alignment
- Follows existing **provider translator pattern**
- Maintains **stateless translator principle**
- Preserves **lossless round-tripping** via `provider_delta`
- Uses **hub-and-spoke Holo format**

### Migration Strategy
- **Opt-in per provider** via config
- **A/B testing** possible with feature flags
- **Gradual rollout** - test with subset of users
- **Fallback** to Chat Completions if Responses fails

---

## Estimated Complexity

| Phase | Effort | Risk |
|-------|--------|------|
| **SDK Upgrade** | Low | Low (patch version likely compatible) |
| **Type System** | Medium | Low (pure types, no runtime changes) |
| **Translation Layer** | **High** | Medium (complex multi-output mapping) |
| **Provider Integration** | Medium | Low (similar to existing pattern) |
| **API Endpoints** | Low | Low (routing only) |
| **Configuration** | Low | Low (config extension) |

**Total Estimated Time:** 3-5 days for core implementation + 2-3 days for testing/documentation

---

## Next Steps (When Ready to Implement)

1. **Verify SDK compatibility** - Check OpenAI SDK 6.x changelog for Responses API support
2. **Create feature branch** - `feature/openai-responses-api`
3. **Start with Phase 1** - SDK upgrade and verification
4. **Iterative implementation** - Build phase-by-phase with tests
5. **Feature flag rollout** - Deploy behind config flag for testing

---

## References

- [OpenAI Responses vs Chat Completions Guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [Why we built the Responses API](https://developers.openai.com/blog/responses-api/)
- [Introducing the Responses API - OpenAI Developer Community](https://community.openai.com/t/introducing-the-responses-api/1140929)

---

**Last Updated:** 2025-10-08
