# Holo Format Capability Analysis

## Executive Summary

This document verifies that the Holo universal format in `@holokai/sdk` can adequately represent all portable features
from Claude, OpenAI, and Ollama providers.

**Status**: ✅ **VERIFIED** - Holo format supports all portable capabilities

---

## Verification Methodology

For each provider, we:

1. ✅ Identify all request/response fields
2. ✅ Classify as: Common (all providers), Mapped (≥2 providers), or Provider-specific
3. ✅ Verify portable fields are represented in Holo types
4. ✅ Confirm provider-specific fields are intentionally excluded

---

## Request Capabilities

### Core Request Fields (All Providers)

| Capability      | Claude | OpenAI | Ollama | Holo Support                 | Notes                                            |
|-----------------|--------|--------|--------|------------------------------|--------------------------------------------------|
| Model selection | ✅      | ✅      | ✅      | ✅ `model: string`            | Required field                                   |
| Message history | ✅      | ✅      | ✅      | ✅ `messages?: HoloMessage[]` | Optional (may be empty for Ollama generate mode) |
| Temperature     | ✅      | ✅      | ✅      | ✅ `temperature?: number`     | 0-2 range                                        |
| Top-p sampling  | ✅      | ✅      | ✅      | ✅ `top_p?: number`           | Nucleus sampling                                 |
| Streaming       | ✅      | ✅      | ✅      | ✅ `stream?: boolean`         | SSE streaming                                    |
| Tools/Functions | ✅      | ✅      | ✅      | ✅ `tools?: HoloTool[]`       | Function calling                                 |

**Result**: ✅ All common fields supported

**Note on messages**: While `messages` is optional in the type signature to support Ollama's generate mode (which uses
`prompt` instead), for standard chat requests across all providers, messages should be provided.

### Mapped Request Fields (≥2 Providers)

| Capability             | Providers                          | Holo Support                               | Notes                   |
|------------------------|------------------------------------|--------------------------------------------|-------------------------|
| System prompt          | Claude, OpenAI (sim), Ollama (sim) | ✅ `system?: string`                        | Top-level field         |
| Max tokens             | Claude, OpenAI                     | ✅ `max_tokens?: number`                    | Token limit             |
| Stop sequences         | All 3                              | ✅ `stop_sequences?: string[]`              | Array format            |
| Response format        | OpenAI, Ollama                     | ✅ `response_format?: HoloResponseFormat`   | JSON/text output        |
| Service tier (request) | Claude, OpenAI                     | ✅ `service_tier?: string`                  | Priority tier selection |
| Tool choice            | Claude, OpenAI                     | ✅ `tool_choice?: HoloToolChoice`           | Tool selection          |
| Top-k sampling         | Claude, Ollama                     | ✅ `top_k?: number`                         | Top-k parameter         |
| Frequency penalty      | OpenAI, Ollama                     | ✅ `frequency_penalty?: number`             | Repetition control      |
| Presence penalty       | OpenAI, Ollama                     | ✅ `presence_penalty?: number`              | Topic diversity         |
| Seed                   | OpenAI, Ollama                     | ✅ `seed?: number`                          | Deterministic           |
| Metadata               | Claude, OpenAI                     | ✅ `metadata?: HoloRequestMetadata \| null` | Request metadata        |

**Result**: ✅ All mapped fields supported

### Provider-Specific Fields (Intentionally Excluded)

#### Claude-Only

- ❌ `container` - Execution environment (Claude-specific)
- ❌ `thinking` - Extended thinking config (Claude-specific)
- ❌ `betas` - Feature flags (Claude-specific)
- ❌ `mcp_servers` - MCP configuration (Claude-specific)

#### OpenAI-Only

- ❌ `reasoning_effort` - Reasoning config (OpenAI o1-specific)
- ❌ `audio` - Audio input (OpenAI-specific)
- ❌ `modalities` - Output modalities (OpenAI-specific)
- ⚠️ `logit_bias` - Token biasing (present in SDK for OpenAI compat, but not portable)
- ❌ `logprobs` - Log probabilities (OpenAI-specific)
- ❌ `top_logprobs` - Top log probs (OpenAI-specific)
- ⚠️ `n` - Multiple completions (present in SDK for OpenAI compat, but see note below)
- ❌ `parallel_tool_calls` - Parallel execution (OpenAI-specific)
- ❌ `prediction` - Prediction API (OpenAI-specific)
- ❌ `store` - Conversation storage (OpenAI-specific)
- ❌ `stream_options` - Streaming config (OpenAI-specific)
- ⚠️ `user` - End-user tracking (present in SDK for OpenAI compat, but not portable)
- ❌ `web_search_options` - Web search (OpenAI-specific)

#### Ollama-Only

- ❌ `keep_alive` - Model lifetime (Ollama-specific)
- ❌ `options.*` - Runtime options (Ollama-specific)
- ❌ `template` - Prompt template (Ollama-specific)
- ❌ `context` - Conversation state (Ollama-specific)
- ❌ `raw` - Bypass templating (Ollama-specific)

**Result**: ✅ Intentionally excluded - not portable

**Note on Multi-Choice (`n`)**: The SDK includes `n?: number` on HoloRequest for OpenAI compatibility, but this is not
truly portable. At the Holo request level, there is no provider-agnostic way to express "generate N completions" — this
behavior is effectively OpenAI-only. Multi-choice responses are handled via streaming with `delta.choice` index, but the
request-side capability is OpenAI-specific and must be handled in the OpenAI plugin.

---

## Response Capabilities

### Core Response Fields

| Capability    | Claude | OpenAI | Ollama | Holo Support                         | Notes                                       |
|---------------|--------|--------|--------|--------------------------------------|---------------------------------------------|
| Response ID   | ✅      | ✅      | ❌      | ✅ `id?: string`                      | Optional (Ollama lacks; generate if needed) |
| Model used    | ✅      | ✅      | ✅      | ✅ `model: string`                    | Required                                    |
| Messages      | ✅      | ✅      | ✅      | ✅ `messages: HoloMessage[]`          | Required response array                     |
| Finish reason | ✅      | ✅      | ✅      | ✅ `finish_reason?: HoloFinishReason` | Completion status                           |
| Service tier  | ✅      | ✅      | ❌      | ✅ `service_tier?: string`            | Top-level response field                    |
| Token usage   | ✅      | ✅      | ✅      | ✅ `usage?: HoloUsage`                | Token counts                                |

**Result**: ✅ All core fields supported

**Note on ID**: `id` is optional in the type to accommodate Ollama (which doesn't provide IDs). Provider adapters MUST
synthesize an ID (e.g., UUID) when the provider does not supply one.

### Usage Statistics

| Capability    | Providers      | Holo Support                 | Notes                                   |
|---------------|----------------|------------------------------|-----------------------------------------|
| Input tokens  | All 3          | ✅ `usage.input_tokens`       | Prompt tokens                           |
| Output tokens | All 3          | ✅ `usage.output_tokens`      | Completion tokens                       |
| Total tokens  | All 3          | ✅ `usage.total_tokens`       | Sum (derived if needed)                 |
| Cache read    | Claude, OpenAI | ✅ `usage.cache_read_tokens`  | Cache hits                              |
| Cache write   | Claude         | ✅ `usage.cache_write_tokens` | Cache creation                          |
| Service tier  | Claude, OpenAI | ✅ `usage.service_tier`       | Also duplicated at top-level (see note) |
| Timings       | Ollama         | ✅ `usage.timings.*`          | Performance metrics (ns)                |

**Result**: ✅ All usage fields supported

**Note on service_tier duplication**: The SDK currently includes `service_tier` in both locations:

- **Top-level** `service_tier?: string` on HoloResponse (line 357)
- **In usage** `usage.service_tier` on HoloUsage (line 290)

This redundancy exists for flexibility. Translators should populate the top-level field as primary, with
`usage.service_tier` as an optional mirror.

### Timestamp Normalization

| Field        | Provider Format             | Holo Format             | Notes                      |
|--------------|-----------------------------|-------------------------|----------------------------|
| `created`    | OpenAI: seconds since epoch | `created?: number` (ms) | Convert seconds → ms       |
| `created_at` | Ollama: ISO8601 string      | `created?: number` (ms) | Parse ISO8601 → ms         |
| N/A          | Claude: no timestamp        | `created?: number` (ms) | Synthesize at receipt time |

**Note**: Holo standardizes on **milliseconds since epoch** (`number`) for all timestamps. The SDK types currently
include `number | Date` but this will be tightened to just `number` for predictable serialization.

### OpenAI Compatibility Fields

The SDK includes optional fields for OpenAI compatibility (defined in SDK at lines 365-371):

| Field                | Purpose              | SDK Support                     | Notes                               |
|----------------------|----------------------|---------------------------------|-------------------------------------|
| `object`             | Response type        | ✅ `object?: string`             | 'chat.completion' for non-streaming |
| `choices[]`          | Multiple completions | ✅ `choices?: HoloChoice[]`      | OpenAI-specific structure           |
| `system_fingerprint` | System ID            | ✅ `system_fingerprint?: string` | Debug identifier                    |

**Important**: These fields exist in the SDK types (`HoloResponse`) for OpenAI compatibility but are **NOT part of the
canonical Holo response structure**. They are optional compatibility fields that OpenAI-specific translators MAY
populate.

**Canonical HoloResponse structure**:

```typescript
{
    id ? : string;              // Optional (generate if provider lacks)
    model: string;            // Required
    messages: HoloMessage[]; // Required - primary response field
    finish_reason ? : HoloFinishReason;
    service_tier ? : string;   // Optional, top-level
    usage ? : HoloUsage;       // Optional
    created ? : number;        // Optional (ms since epoch)

    // OpenAI compatibility (optional)
    object ? : string;
    choices ? : HoloChoice[];
    system_fingerprint ? : string;
}
```

**Multi-choice handling**:

- **Request**: `n` parameter is OpenAI-specific (see note in Provider-Specific section above)
- **Streaming response**: Multiple choices expressed via `delta.choice` index in `HoloStreamChunk`
- **Non-streaming response**: Holo does not define a portable `choices[]` field; multi-choice responses are always
  expressed as multiple logical streams distinguished by `delta.choice` in streaming mode
- **OpenAI plugin**: MAY populate the optional `choices[]` compatibility field for OpenAI consumers

---

## Content Type Capabilities

### Portable Content Types

| Content Type    | Claude | OpenAI | Ollama | Holo Support                |
|-----------------|--------|--------|--------|-----------------------------|
| Plain text      | ✅      | ✅      | ✅      | ✅ `HoloContentText`         |
| Images (URL)    | ✅      | ✅      | ✅      | ✅ `HoloContentImage`        |
| Images (base64) | ✅      | ✅      | ✅      | ✅ `HoloContentImage`        |
| Tool calls      | ✅      | ✅      | ✅      | ✅ `HoloToolCall` in message |
| Tool results    | ✅      | ✅      | ✅      | ✅ Tool role message         |

**Result**: ✅ All portable content types supported

### Provider-Specific Content (Intentionally Excluded)

#### Claude-Only

- ❌ `thinking` blocks - Extended reasoning
- ❌ `redacted_thinking` - Redacted reasoning
- ❌ `citations` - Source citations
- ❌ `document` blocks - Document uploads
- ❌ `server_tool_use` - Server-side tools
- ❌ `search_result` - Search results
- ❌ `mcp_tool_use` - MCP tool calls
- ❌ `container_upload` - Container uploads

#### OpenAI-Only

- ❌ `image_url.detail` - Image detail level (low/high/auto)
- ❌ `audio` - Audio content
- ❌ `annotations` - Content annotations
- ❌ `refusal` - Refusal messages

**Result**: ✅ Intentionally excluded - not portable

---

## Tool Capabilities

### Tool Definitions

| Feature     | Claude | OpenAI | Ollama | Holo Support                    |
|-------------|--------|--------|--------|---------------------------------|
| Tool name   | ✅      | ✅      | ✅      | ✅ `name: string`                |
| Description | ✅      | ✅      | ✅      | ✅ `description?: string`        |
| Parameters  | ✅      | ✅      | ✅      | ✅ `parameters?: HoloJsonSchema` |
| JSON Schema | ✅      | ✅      | ✅      | ✅ Full schema support           |

**Result**: ✅ Full tool definition support

### Tool Choice Strategies

| Strategy | Claude  | OpenAI | Ollama | Holo Support                 |
|----------|---------|--------|--------|------------------------------|
| Auto     | ✅       | ✅      | ❌      | ✅ `{type: 'auto'}`           |
| None     | ✅       | ✅      | ❌      | ✅ `{type: 'none'}`           |
| Required | ✅ (any) | ✅      | ❌      | ✅ `{type: 'required'}`       |
| Specific | ✅       | ✅      | ❌      | ✅ `{type: 'specific', name}` |

**Result**: ✅ All tool choice strategies supported

### Tool Call Structure

| Feature       | Claude | OpenAI | Ollama | Holo Support               |
|---------------|--------|--------|--------|----------------------------|
| Tool ID       | ✅      | ✅      | ❌      | ✅ `id?: string` (optional) |
| Function name | ✅      | ✅      | ✅      | ✅ `function.name`          |
| Arguments     | ✅      | ✅      | ✅      | ✅ `function.arguments`     |
| Type          | ✅      | ✅      | ✅      | ✅ `type: 'function'`       |

**Result**: ✅ Full tool call structure supported

---

## Streaming Capabilities

### Streaming Events

| Event Type    | Claude | OpenAI       | Ollama       | Holo Support              |
|---------------|--------|--------------|--------------|---------------------------|
| Message start | ✅      | ✅ (implicit) | ✅ (implicit) | ✅ `type: 'message_start'` |
| Content delta | ✅      | ✅            | ✅            | ✅ `type: 'content_delta'` |
| Message delta | ✅      | ✅            | ❌            | ✅ `type: 'message_delta'` |
| Message stop  | ✅      | ✅            | ✅ (done)     | ✅ `type: 'message_stop'`  |

**Result**: ✅ All streaming events normalized

### Streaming Metadata

| Feature       | Claude | OpenAI | Ollama | Holo Support          |
|---------------|--------|--------|--------|-----------------------|
| Provider tag  | N/A    | N/A    | N/A    | ✅ `provider` field    |
| Content index | ✅      | ✅      | ❌      | ✅ `index?: number`    |
| Choice index  | ❌      | ✅      | ❌      | ✅ `choice?: number`   |
| Usage updates | ✅      | ✅      | ❌      | ✅ `usage?: HoloUsage` |
| Raw delta     | ✅      | ✅      | ✅      | ✅ `provider_delta?`   |

**Result**: ✅ Full streaming metadata support

**Streaming Implementation Notes**:

1. **`provider_delta` preservation**: Translators MUST store the full raw provider event in `provider_delta` (not a lean
   subset) to guarantee round-trip fidelity and enable provider-specific debugging. This is a normative requirement for
   third-party plugins.
2. **Completion semantics**: The `done?: boolean` field is NOT set by translators. Orchestrators determine completion
   based on `finish_reason` and provider-specific events.
3. **Content accumulation**: Streaming consumers must accumulate deltas to reconstruct final responses.
   See [PROVIDER_MAPPINGS.md](./PROVIDER_MAPPINGS.md#streaming-mappings) for per-provider accumulation patterns.

---

## Type Safety Analysis

### SDK Types (Strict Mode)

**Location**: `packages/sdk/src/holo/types.ts`

```typescript
// ✅ SDK uses proper typed interfaces
export interface HoloFunctionArguments {
    [key: string]: string | number | boolean | null
        | HoloFunctionArguments
        | HoloFunctionArguments[];
}

export interface HoloJsonSchema {
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: { [key: string]: HoloJsonSchema };
    items?: HoloJsonSchema;
    required?: string[];
    additionalProperties?: boolean | HoloJsonSchema;
    description?: string;
    enum?: unknown[];
    // ... full JSON Schema Draft 7 specification
}

export interface HoloTool {
    name: string;
    description?: string;
    parameters?: HoloJsonSchema; // ✅ Properly typed JSON Schema
}
```

**Status**: ✅ SDK types are strictly typed and production-ready

**JSON Schema Support**: The SDK implements JSON Schema Draft 7. Provider plugins should:

1. Pass JSON Schema through Holo unchanged whenever possible
2. NOT reinterpret or validate schema at translation time
3. Let the target provider handle schema validation

### Provider Implementation Types (Current)

**Location**: `src/providers/holo/types/requests.ts`

```typescript
// ⚠️ Current provider implementation uses flexible types
export interface HoloToolFunctionCall {
    name: string;
    arguments: Record<string, unknown>;   // ⚠️ Should be HoloFunctionArguments
}

export interface HoloTool {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>; // ⚠️ Should be HoloJsonSchema
}
```

**Status**: ⚠️ Provider implementation needs migration to SDK types

**Files requiring migration**:

- `src/providers/holo/types/requests.ts:22` - `arguments` field
- `src/providers/holo/types/requests.ts:49` - `parameters` field

---

## Gap Analysis

### ✅ No Capability Gaps Found

All portable capabilities from Claude, OpenAI, and Ollama are represented in the Holo format:

1. ✅ **Common fields** - All providers share these fields
2. ✅ **Mapped fields** - Functional equivalents in ≥2 providers
3. ✅ **Content types** - Text, images, tools
4. ✅ **Tool system** - Definitions, calls, results
5. ✅ **Streaming** - All event types
6. ✅ **Usage tracking** - Tokens, cache, performance

### Provider-Specific Features

The following are intentionally **NOT** in Holo format because they're provider-specific:

- Claude: thinking, MCP, citations, documents, server tools
- OpenAI: reasoning_effort, audio, modalities, logprobs, n choices
- Ollama: keep_alive, template, context, raw mode

**These are handled in provider-specific plugins when needed.**

---

## Recommendations

### 1. ✅ Use SDK Types in Providers

**Action**: Migrate `src/providers/holo/types/*` to use `@holokai/sdk` types directly.

**Benefits**:

- Eliminates duplication
- Ensures strict typing compliance
- Maintains single source of truth
- Enables proper validation

**Specific Changes**:

```typescript
// Before
import {HoloTool} from '../types/requests';

// After
import type {HoloTool} from '@holokai/sdk';
```

### 2. ✅ Tighten Timestamp Type

**Action**: Update SDK types to use `number` only for timestamps.

**Current**:

```typescript
created ? : number | Date;
```

**Proposed**:

```typescript
created ? : number; // milliseconds since epoch
```

**Rationale**: Eliminates ambiguity, ensures predictable serialization, and matches internal normalization practice.

### 3. ✅ Document Round-Trip Behavior

**Action**: Add examples showing successful round-trip translations with explicit field handling.

**Example**:

```typescript
// Round-trip: OpenAI → Holo → Claude → Holo → OpenAI
const original = {
    model: 'gpt-4',
    messages: [{role: 'user', content: 'Hi'}],
    max_tokens: 100,
    reasoning_effort: 'high' // ⚠️ OpenAI-only
};

// → Holo (reasoning_effort dropped)
const holo1 = {model: 'gpt-4', messages: [...], max_tokens: 100};

// → Claude (successfully mapped)
const claude = {model: 'claude-3-5-sonnet', messages: [...], max_tokens: 100};

// → Holo (lossless)
const holo2 = {model: 'claude-3-5-sonnet', messages: [...], max_tokens: 100};

// → OpenAI (core fields preserved, reasoning_effort gone)
const roundTrip = {model: 'gpt-4', messages: [...], max_tokens: 100};
```

**Key principle**: Provider-specific fields (`thinking`, `reasoning_effort`, `keep_alive`, etc.) are **dropped at the
Holo layer** and only reintroduced when translating back to the **same provider** using provider-specific plugins.

### 4. ✅ Add Validation Tests

**Action**: Create test suite verifying:

- All common fields translate losslessly
- Provider-specific fields are safely dropped
- Round-trip preserves essential data
- Type safety enforced
- No `any` or `Record<string, unknown>` in production paths

---

## Conclusion

### ✅ VERIFIED: Holo Format is Complete

The Holo universal format in `@holokai/sdk` successfully:

1. ✅ **Represents all portable capabilities** from all 3 providers (Claude, OpenAI, Ollama)
2. ✅ **Provides strict type safety** with proper TypeScript interfaces (SDK)
3. ✅ **Enables lossless core translations** for essential fields
4. ✅ **Gracefully handles provider-specific features** by intentional exclusion
5. ✅ **Supports streaming** with normalized event types
6. ✅ **Tracks usage comprehensively** across all providers

### Capability Coverage Summary

| Category                            | Status     | Notes                                             |
|-------------------------------------|------------|---------------------------------------------------|
| Common fields (all providers)       | ✅ Complete | All shared fields represented                     |
| Mapped fields (≥2 providers)        | ✅ Complete | Functional equivalents handled                    |
| Content types (text, images, tools) | ✅ Complete | All portable types supported                      |
| Tool system                         | ✅ Complete | Definitions, calls, results, choice               |
| Streaming                           | ✅ Complete | Normalized events across providers                |
| Usage tracking                      | ✅ Complete | Tokens, cache, performance, tiers                 |
| Multi-choice                        | ⚠️ Partial | OpenAI-only request; streaming response supported |

### Known Limitations

1. **Multi-choice requests**: The `n` parameter is OpenAI-specific. While included in SDK for compatibility, it's not
   portable across providers.
2. **Provider-specific features**: Intentionally excluded (thinking, MCP, reasoning_effort, audio, modalities, etc.)
3. **Type consistency**: Current provider implementation (`src/providers/holo/`) uses `Record<string, unknown>` instead
   of proper SDK types — migration needed.

### No Critical Gaps

All features that can be **meaningfully translated between ≥2 providers** are represented in Holo format.
Provider-specific features are intentionally excluded and should be handled in provider-specific plugins when needed.

### Action Items

**High Priority**:

1. ✅ Migrate `src/providers/holo/types/*` to use SDK types
2. ✅ Tighten timestamp type from `number | Date` to `number`

**Medium Priority**:

3. Add comprehensive round-trip translation tests
4. Document provider-specific plugin patterns
5. Create validation test suite

**Documentation**:

6. Add round-trip examples showing field dropping behavior
7. Create plugin development guide with type-safe patterns

---

**Version**: 1.0.0
**Last Updated**: 2025-12-09
**Verified By**: SDK Type Inspection + Provider Capability Analysis
