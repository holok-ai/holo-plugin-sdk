# Holo (Portable Format)

> **Navigation**: [Main README](../README.md) | [Architecture](../ARCHITECTURE.md) | [Types](../TYPE_REFERENCE.md) | [Translation](../TRANSLATION_GUIDE.md) | [Streaming](../STREAMING_GUIDE.md)

---

## Overview

**Holo is the canonical portable format** that serves as the hub for all provider translations. It provides a **unified abstraction layer** over Claude, OpenAI, Ollama, and other LLM providers.

### Design Philosophy

- **Provider-agnostic** - Works with all providers
- **Portable** - Portable across provider APIs and serialization formats (JSON, Protobuf, MessagePack, etc.)
- **Lossless** - Preserves information where possible
- **Extensible** - Easy to add new providers
- **Simple** - Minimal complexity

#### Lossless Translation Principle

| Rule | Description |
|------|-------------|
| **Preserve** | Provider-specific data is retained under `metadata` or `provider_delta` |
| **Normalize** | Shared semantics (role, content, finish_reason) standardized |
| **Synthesize** | Missing fields (id, created) generated deterministically |
| **Drop** | Only transient or untranslatable debug fields may be omitted |

### Hub-and-Spoke Architecture

```
        Claude ←→ Holo ←→ OpenAI
                   ↕
                 Ollama
```

**N translations instead of N²** (3 providers = 3 translators, not 6)

---

## Quick Reference

### Core Types

| Type | Purpose | File |
|------|---------|------|
| **HoloRequest** | Universal request format | `types/holo.request.types.ts` |
| **HoloResponse** | Universal response format | `types/holo.response.types.ts` |
| **HoloMessage** | Conversation messages | `types/holo.message.types.ts` |
| **HoloStreamChunk** | Streaming events | `types/holo.stream.types.ts` |
| **HoloTool** | Function definitions | `types/holo.tool.types.ts` |
| **HoloUsage** | Token consumption | `types/holo.usage.types.ts` |

### HoloRequest Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `model` | `string` | ✅ | Model identifier |
| `messages` | `HoloMessage[]` | ✅ | Conversation history |
| `system` | `string` | Optional | System prompt |
| `temperature` | `number` | Optional | Sampling temperature |
| `top_p` | `number` | Optional | Nucleus sampling |
| `top_k` | `number` | Optional | Top-K sampling |
| `max_tokens` | `number` | Optional | Max output tokens |
| `stop_sequences` | `string[]` | Optional | Custom stop sequences |
| `stream` | `boolean` | Optional | Enable streaming |
| `tools` | `HoloTool[]` | Optional | Available functions |
| `tool_choice` | `HoloToolChoice` | Optional | Tool selection strategy (see below) |
| `response_format` | `HoloResponseFormat` | Optional | Output format (see below) |

#### HoloToolChoice

| Type | Allowed Values | Description |
|------|----------------|-------------|
| **HoloToolChoice** | `'auto'` \| `'none'` \| `{ type: 'specific', name: string }` \| `{ type: 'required' }` | Defines whether and which tool is used |

**Values:**
- `'auto'` - Model decides whether to call a tool
- `'none'` - Model must not call any tools
- `{ type: 'specific', name: string }` - Model must call the specified tool
- `{ type: 'required' }` - Model must call at least one tool (provider chooses which)

#### HoloResponseFormat

| Type | Allowed Values | Description |
|------|----------------|-------------|
| **HoloResponseFormat** | `'text'` \| `'json_object'` \| `{ type: 'json_schema', schema: object, strict?: boolean }` | Specifies output formatting |

**Values:**
- `'text'` - Plain text response (default)
- `'json_object'` - JSON object (no schema enforcement)
- `{ type: 'json_schema', schema: object }` - Strict JSON schema validation

### HoloResponse Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | `string` | ✅ | Unique response ID * |
| `model` | `string` | ✅ | Model used |
| `created` | `number` | Optional | Timestamp (ms) |
| `messages` | `HoloMessage[]` | ✅ | Response messages |
| `finish_reason` | `HoloFinishReason` | Optional | Completion reason |
| `usage` | `HoloUsage` | Optional | Token usage |
| `service_tier` | `string` | Optional | API tier used |

**\* ID Synthesis:**
- Translators MUST generate a synthetic `id` when the provider does not return one (e.g., Ollama)
- **Recommended format**: UUIDv4 (`crypto.randomUUID()`) or use `createStableId()` utility for deterministic hashing
- **Scope**: Synthesize for any provider lacking `id` (primarily Ollama, but future-proof)
- **Note**: The `createStableId()` utility in `utils/index.ts` provides a simple hash-based ID generator (primarily for tool calls, but pattern is reusable)

### HoloStreamChunk Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | `string` | Optional | Stream ID |
| `model` | `string` | ✅ | Model used |
| `created` | `number` | Optional | Timestamp (ms) |
| `delta` | `HoloStreamingDelta` | Optional | Incremental update |
| `finish_reason` | `HoloFinishReason` | Optional | Completion reason |
| `usage` | `HoloUsage` | Optional | Token usage |
| `done` | `boolean` | Optional | Stream complete |

### HoloStreamingDelta Types

| Type | Purpose | When Emitted |
|------|---------|--------------|
| `message_start` | Initialize message | First event |
| `content_delta` | Incremental text | Each token/chunk |
| `message_delta` | Metadata/tools/usage | Tool calls, usage |
| `message_stop` | Completion marker | Final event |

---

## Design Decisions

### Why Holo?

**Problem:** N providers require N² translations (Claude↔OpenAI, Claude↔Ollama, OpenAI↔Ollama, etc.)

**Solution:** Use Holo as central hub - only N translations needed.

**Benefits:**
- ✅ Simpler - fewer translators to maintain
- ✅ Consistent - single source of truth
- ✅ Extensible - add providers without touching existing code
- ✅ Testable - test each provider independently

### Field Selection Principles

1. **Include if 2+ providers support** - Common fields across providers
2. **Exclude provider-specific** - Keep those in provider types
3. **Portable by default** - Can be serialized/deserialized easily
4. **Semantically meaningful** - Fields have clear purpose

### What's NOT in Holo

Provider-specific features are kept in provider types:

| Feature | Provider | Why Not Holo |
|---------|----------|--------------|
| `thinking` | Claude | Claude-only |
| `container` | Claude | Claude-only |
| `mcp_servers` | Claude | Claude-only |
| `logit_bias` | OpenAI | OpenAI-only |
| `logprobs` | OpenAI | OpenAI-only |
| `n` (multi-choice) | OpenAI | OpenAI-only |
| `keep_alive` | Ollama | Ollama-only |
| `options.*` (GPU) | Ollama | Ollama-only |

**Provider-specific data is preserved under:**
- **`HoloRequest.metadata`** - Static request attributes (user_id, session_id, etc.)
- **`HoloStreamingDelta.provider_delta`** - Raw stream events for lossless round-tripping
- **`HoloResponse.metadata`** - Diagnostic and performance info (e.g., Ollama performance metrics)

### Timestamp Convention

**Holo uses milliseconds** (JavaScript standard):
```typescript
created: Date.now()  // 1234567890123 (ms)
```

**All timestamps must represent UTC milliseconds since epoch.**

**Provider Conversions:**
- **OpenAI**: Converts seconds to milliseconds (`created * 1000`)
- **Ollama**: Parses ISO8601 string to milliseconds (`Date.parse(created_at)`)
- **Claude**: No timestamps in responses; synthesize at receipt time if needed

---

## Implementation

### Validators

All Holo types have ArkType validators:

```typescript
import {
    HoloRequestValidator,
    HoloResponseValidator,
    HoloMessageValidator,
    HoloStreamChunkValidator
} from './validators';

// Validate request
const validated = HoloRequestValidator(data);
if (validated instanceof ArkErrors) {
    throw new Error(validated.summary);
}
```

### Factories

**Error Response Factory:**

```typescript
import { createGuardErrorResponse } from './holo.response.factory';

// Create guard failure response (streaming mode)
const errorChunks = createGuardErrorResponse(
    'Request failed security checks',
    {
        responseFormat: 'text',  // or 'json'
        guardDetails: [
            { name: 'PII_Detector', errors: ['Detected SSN'] }
        ]
    }
);

// Text mode output (array of HoloStreamChunk):
[
  { delta: { type: 'message_start', delta: { role: 'assistant' } } },
  { delta: { type: 'content_delta', delta: { content: 'We could not process your request because: ' } } },
  { delta: { type: 'content_delta', delta: { content: 'Detected PII data.' } } },
  { delta: { type: 'message_stop' } }
]

// JSON mode output:
{
  errors: [
    { guard: 'PII_Detector', messages: ['Detected SSN'] }
  ]
}
```

**See also:** [GUARD_ERRORS.md](../GUARD_ERRORS.md) for complete factory implementation and text vs JSON mode handling.

### Error Types

Holo supports standardized error responses for system failures:

| Error Type | Description | When to Use |
|------------|-------------|-------------|
| **GuardError** | Security or PII policy failure | Request blocked by guard services |
| **ValidationError** | Schema or input parsing failure | Invalid request format or missing required fields |
| **ProviderError** | Upstream provider returned an error | Provider API failure (5xx, rate limits, etc.) |
| **InternalError** | Translation or orchestrator exception | Unexpected system errors during translation |

All error responses follow the same structure as normal responses but with error details in `messages[0].content` (text mode) or structured `errors` array (JSON mode).

### Translator Facade

**HoloTranslator** routes to provider translators:

```typescript
import { HoloTranslater } from './holo.translator';

const translator = new HoloTranslater();

// Automatically routes to correct provider
const result = await translator.translate(request, 'claude');
```

---

## Usage Examples

### Creating Requests

```typescript
const holoRequest: HoloRequest = {
    model: 'gpt-4',
    messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello!' }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: true
};
```

### Parsing Responses

```typescript
const holoResponse: HoloResponse = {
    id: 'resp-123',
    model: 'gpt-4',
    messages: [{
        role: 'assistant',
        content: 'Hello! How can I help?'
    }],
    finish_reason: 'stop',
    usage: {
        input_tokens: 15,
        output_tokens: 8,
        total_tokens: 23
    }
};
```

### Streaming

```typescript
const holoChunk: HoloStreamChunk = {
    id: 'stream-123',
    model: 'gpt-4',
    delta: {
        provider: 'openai',
        type: 'content_delta',
        delta: {
            content: 'Hello'
        }
    }
};
```

---

## Provider Coverage

### Field Support Matrix

| Holo Field | Claude | OpenAI | Ollama |
|------------|--------|--------|--------|
| `model` | ✅ | ✅ | ✅ |
| `messages` | ✅ | ✅ | ✅ |
| `system` | ✅ | via messages | ✅ |
| `temperature` | ✅ | ✅ | ✅ |
| `top_p` | ✅ | ✅ | ✅ |
| `top_k` | ✅ | ❌ | ✅ |
| `max_tokens` | ✅ | ✅ | ✅ |
| `stop_sequences` | ✅ | ✅ | ✅ |
| `stream` | ✅ | ✅ | ✅ |
| `tools` | ✅ | ✅ | ✅ |
| `tool_choice` | ✅ | ✅ | ❌ |
| `response_format` | ❌ | ✅ | ✅ |
| `frequency_penalty` | ❌ | ✅ | ✅ |
| `presence_penalty` | ❌ | ✅ | ✅ |
| `seed` | ❌ | ✅ | ✅ |

### Streaming Support

| Provider | Event Types | Complexity |
|----------|------------|------------|
| Claude | 6 events | High |
| OpenAI | Chunk-based | Medium |
| Ollama | Frame-based | Low |

All providers normalize to **4 Holo event types**:

#### Streaming Lifecycle Normalization

| Provider Event(s) | Normalized Holo Event | Notes |
|-------------------|----------------------|-------|
| Claude `content_block_delta` | `content_delta` | Text or JSON fragments |
| OpenAI `delta.content` | `content_delta` | Incremental text |
| Ollama `response` (done=false) | `content_delta` | Text fragments |
| Any provider done/stop_reason | `message_stop` | Unified termination event |
| Claude `message_start` | `message_start` | Initialize message |
| OpenAI first chunk with `role` | `message_start` | Implicit start |
| Ollama first frame | `message_start` | Synthesized by orchestrator |
| Provider usage/finish updates | `message_delta` | Metadata updates |

---

## Evolution Guidelines

### Adding New Fields

**When to add to Holo:**
1. ✅ Supported by 2+ providers
2. ✅ Has clear cross-provider semantics
3. ✅ Portable (serializable)

**When to keep provider-specific:**
1. ❌ Only 1 provider supports
2. ❌ Provider-specific semantics
3. ❌ Non-portable (e.g., binary data)

### Adding a New Provider

**Checklist for integrating a new LLM provider:**

1. **Create provider translator structure:**
   - `{provider}.translator.ts` - Main facade
   - `translators/{provider}.request.translator.ts` - Request translation
   - `translators/{provider}.response.translator.ts` - Response translation
   - `translators/{provider}.message.translator.ts` - Message array translation
   - `streaming/{provider}.stream.translator.ts` - Streaming orchestrator

2. **Map provider types to Holo equivalents:**
   - Document request field mappings (what's direct, renamed, nested, transformed, dropped)
   - Document response field mappings (extraction, normalization, synthesis rules)
   - Document streaming event lifecycle

3. **Add type validators via ArkType:**
   - `{Provider}RequestValidator`
   - `{Provider}ResponseValidator`
   - `{Provider}MessageValidator`
   - `{Provider}StreamEventValidator`

4. **Register provider in HoloTranslator router:**
   - Add provider case to translator routing logic
   - Update provider type enum

5. **Write unit tests:**
   - Test `toHoloMany()` (provider → Holo)
   - Test `fromHoloMany()` (Holo → provider)
   - Test round-trip integrity (Holo → provider → Holo)
   - Test streaming event translation

6. **Document the provider:**
   - Create `{provider}/README.md` with quick reference tables
   - Update [TYPE_REFERENCE.md](../TYPE_REFERENCE.md) with provider column
   - Update [TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md) with field mappings

### Deprecating Fields

**Process:**
1. Mark as deprecated in types
2. Add migration guide
3. Support for 2+ versions
4. Remove in major version

---

## Related Documentation

- **[TYPE_REFERENCE.md](../TYPE_REFERENCE.md)** § Holo Types (Canonical)
- **[TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md)** § Provider Mappings
- **[STREAMING_GUIDE.md](../STREAMING_GUIDE.md)** § Event Lifecycle
- **[GUARD_ERRORS.md](../GUARD_ERRORS.md)** § Error Response Factory

---

**Last Updated**: 2025-10-05
