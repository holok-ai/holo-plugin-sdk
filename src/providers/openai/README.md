# OpenAI Provider

> **Navigation**: [Main README](../README.md) | [Architecture](../ARCHITECTURE.md) | [Types](../TYPE_REFERENCE.md) | [Translation](../TRANSLATION_GUIDE.md) | [Streaming](../STREAMING_GUIDE.md)

---

## Overview

**OpenAI provider implementation** with complete bidirectional translation between OpenAI Chat Completions API and Holo (portable) format.

### Key Features

- ✅ Full request/response translation
- ✅ Streaming support (chunk-based)
- ✅ Multi-choice support (n>1)
- ✅ Tool calling support
- ✅ Vision/multimodal support
- ✅ Structured outputs (JSON schema)
- ✅ Log probabilities

---

## Quick Reference

### OpenAI-Specific Features

| Feature | Field | Purpose |
|---------|-------|---------|
| **Multi-Choice** | `n: number` | Generate N completions |
| **Log Probabilities** | `logprobs: boolean` | Token probability analysis |
| **Logit Bias** | `logit_bias: Record<string, number>` | Adjust token probabilities |
| **Parallel Tools** | `parallel_tool_calls: boolean` | Concurrent tool execution |
| **Structured Output** | `response_format: { type: 'json_schema' }` | Strict JSON schema |

### Request Fields

| Holo Field | OpenAI Field | Notes |
|------------|-------------|-------|
| `model` | `model` | Direct |
| `messages` | `messages` | Direct (with system injection) |
| `system` | Inject as first message | Not top-level |
| `temperature` | `temperature` | Direct |
| `max_tokens` | `max_tokens` | Direct |
| `stop_sequences` | `stop` | Direct (renamed) |
| `tools` | `tools` | Wrap in `{ type: 'function', function }` |
| `tool_choice` | `tool_choice` | Transform `specific` → `{ type: 'function' }` |
| `response_format` | `response_format` | Transform: `json_object` → `{type:'json_object'}`, `json_schema` → `{type:'json_schema', json_schema:{...}}` |
| `top_k` | ❌ | Not supported |

**Structured Output Mapping:**

| Holo `response_format` | OpenAI `response_format` | Notes |
|------------------------|--------------------------|-------|
| `{type:'text'}` or absent | Absent | Default text mode |
| `{type:'json_object'}` | `{type:'json_object'}` | JSON mode without schema |
| `{type:'json_schema', schema}` | `{type:'json_schema', json_schema:{name, schema, strict}}` | Strict JSON schema enforcement |

**Tool Call Mapping:**

| Holo Field | OpenAI Field | Transformation |
|------------|--------------|----------------|
| `tools[].name` | `tools[].function.name` | Wrapped in `{type:'function', function:{...}}` |
| `tools[].parameters` | `tools[].function.parameters` | Direct (JSON Schema) |
| `tool_choice: {type:'specific', name}` | `tool_choice: {type:'function', function:{name}}` | Nested structure |
| `tool_choice: {type:'auto'}` | `tool_choice: 'auto'` | String literal |
| `tool_choice: {type:'required'}` | `tool_choice: 'required'` | String literal (OpenAI: forces tool use, any tool) |
| `messages[].tool_calls[]` | `choices[].message.tool_calls[]` | Extract from choices; parse `function.arguments` JSON string |

### Response Fields

| OpenAI Field | Holo Field | Notes |
|-------------|------------|-------|
| `id` | `id` | Direct |
| `model` | `model` | Direct |
| `created` | `created` | **Seconds → milliseconds** (`openai.created * 1000`) |
| `choices[0].message` | `messages[0]` | Extract from choices |
| `choices[0].finish_reason` | `finish_reason` | Map 1:1 |
| `usage.prompt_tokens` | `usage.input_tokens` | Renamed |
| `usage.completion_tokens` | `usage.output_tokens` | Renamed |

**Timestamp Normalization:**
- OpenAI returns `created` in **seconds** (Unix epoch, e.g., `1728451200`)
- Translators must convert to Holo `created` in **milliseconds**: `created = openai.created * 1000`
- Applies to both non-streaming responses and streaming chunks (if `created` is present in chunks)

**ID Handling:**
- Non-streaming responses: Use `response.id` directly
- Streaming chunks: All chunks for the same response share the same `id`; use the `id` from the first chunk
- If `id` is missing (rare), synthesize a deterministic ID (UUIDv4 or derived hash)

### Streaming

OpenAI uses **chunk-based streaming** with deltas:

**Event Detection:**
- `delta.role: 'assistant'` → `message_start`
- `delta.content` → `content_delta`
- `delta.tool_calls[]` → `message_delta`
- `finish_reason` non-null → `message_stop`
- `usage` present → `message_delta` (usage only)

**Streaming Lifecycle Mapping:**

| OpenAI Chunk Event | Holo Event | Notes |
|--------------------|------------|-------|
| `delta.role: 'assistant'` | `message_start` | Initialize assistant message |
| `delta.content: "text"` | `content_delta` | Incremental text content |
| `delta.tool_calls[].function.arguments` | `message_delta` | Tool argument fragments (accumulate until valid JSON) |
| `finish_reason: 'stop'` | `message_stop` | Completion marker |
| `usage: {...}` (final chunk) | `message_delta` + `message_stop` | Usage stats before termination |

**Usage Aggregation:**
- OpenAI streaming responses include `usage` **only in the final chunk** (when `choices[]` is empty or after all content)
- Translators should emit `message_delta` with usage immediately before `message_stop`
- Non-streaming responses include usage inline

**Multi-Choice Orchestration:**
- When `n>1`, OpenAI returns multiple choices with distinct `index` values
- Each choice is treated as a **distinct virtual stream**
- Translators should emit distinct `message_start` / `content_delta` / `message_stop` sequences for each choice
- The `choice` index is preserved in `HoloStreamChunk.delta.choice` for downstream multiplexing
- Choices may interleave in the stream; orchestrators must track state per-choice

**Comparison to Other Providers:**
- **Claude**: Uses 6 granular events (message/content block phases); explicit start/stop for each block
- **OpenAI**: Uses flat, chunk-based model where deltas merge both text and tool updates into a unified stream
- **Ollama**: Uses simple frame-based streaming (done=true/false); no explicit start event
- OpenAI's translator is simpler than Claude's (no block indexing) but must carefully merge tool fragments

---

## Implementation

### Translators

| Component | File | Purpose |
|-----------|------|---------|
| **Main Facade** | `openai.translator.ts` | Routes to sub-translators |
| **Request** | `translators/openai.request.translator.ts` | Request translation |
| **Response** | `translators/openai.response.translator.ts` | Response translation |
| **Messages** | `translators/openai.message.translator.ts` | Message array translation |
| **Tools** | `translators/openai.tool.translator.ts` | Tool definition translation |
| **Usage** | `translators/openai.usage.translator.ts` | Usage stats translation |

### Streaming Translators

| Event Type | File | Purpose |
|------------|------|---------|
| **Message Start** | `streaming/openai.message.start.translator.ts` | Initialize (role in delta) |
| **Content Delta** | `streaming/openai.content.delta.translator.ts` | Incremental text |
| **Message Delta** | `streaming/openai.message.delta.translator.ts` | Tool calls + usage |
| **Message Stop** | `streaming/openai.message.stop.translator.ts` | Completion |
| **Orchestrator** | `streaming/openai.stream.translator.ts` | Routes events |

### Validators

All types validated with ArkType:

- `OpenAIRequestValidator`
- `OpenAIResponseValidator`
- `OpenAIChatCompletionChunkValidator`
- `OpenAIMessageValidator`

---

## Usage Examples

### Request Translation

```typescript
import { container } from 'tsyringe';
import { OpenAITranslator } from './openai.translator';

const translator = container.resolve(OpenAITranslator);

const holoRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
    system: 'You are helpful',
    temperature: 0.7,
    max_tokens: 1024
};

// Holo → OpenAI (system injected as first message)
const [openaiRequest] = await translator.fromHoloMany(holoRequest);

// OpenAI → Holo
const [holoRequest] = await translator.toHoloMany(openaiRequest);
```

### Streaming

```typescript
import { OpenAIStreamTranslator } from './translators/streaming';

const streamTranslator = container.resolve(OpenAIStreamTranslator);

for await (const chunk of openaiStream) {
    const holoChunks = await streamTranslator.toHoloMany(chunk);
    for (const holoChunk of holoChunks) {
        console.log(holoChunk);
    }
}
```

### Multi-Choice Streaming

```typescript
// n=2 completions
const request = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
    n: 2
};

for await (const chunk of openaiStream) {
    const holoChunks = await streamTranslator.toHoloMany(chunk);
    // holoChunks may contain 2 events (one per choice)
    holoChunks.forEach(chunk => {
        console.log(`Choice ${chunk.delta?.choice}: ${chunk.delta?.delta.content}`);
    });
}
```

---

## Known Issues

### High Priority

**"Lean" provider_delta Pattern** (violates lossless principle):
- **Files**: All OpenAI streaming translators
- **Issue**: Creates reconstructed subsets instead of storing full source chunk
- **Fix**: Store full `source` chunk in `provider_delta`
- **Impact**: May affect round-trip fidelity

### Low Priority

**Tool Streaming Partial Objects:**
- **Issue**: Tool argument streaming may emit partial JSON fragments (e.g., `"{\"location\": \"NY"`)
- **Behavior**: These fragments are invalid JSON and must be accumulated before parsing
- **Solution**: Buffer `tool_calls[index].function.arguments` strings and parse only when complete (either at `finish_reason: 'tool_calls'` or try/catch)
- **Impact**: Low - primarily affects tools with deeply nested arguments

### Known Nuances

**System Message Deduplication:**
- When translating Holo → OpenAI, `system` is injected as the first message with `role: 'system'`
- If the request already has a system message in `messages[]`, avoid duplication by checking for existing system messages

**Vision/Multimodal Content:**
- OpenAI uses `{type: 'image_url', image_url: {url}}` structure
- Holo uses `{type: 'image', url}` - translators must wrap/unwrap accordingly
- Both base64 data URIs and remote HTTPS URLs are supported

**Finish Reason Normalization:**
- OpenAI: `stop`, `length`, `tool_calls`, `content_filter`, `function_call` (deprecated)
- Holo: Same values (1:1 mapping) except `function_call` (legacy) maps to `tool_calls`

**ID and Choice Ordering:**
- All chunks for a single response share the same `id`
- Choices are ordered by `index` (0-indexed); always emit events in index order for consistency

---

## OpenAI API Documentation

- [Official API Docs](https://platform.openai.com/docs/api-reference)
- [Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Vision](https://platform.openai.com/docs/guides/vision)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

---

## Related Documentation

- **[TYPE_REFERENCE.md](../TYPE_REFERENCE.md)** § OpenAI Types
- **[TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md)** § OpenAI ↔ Holo
- **[STREAMING_GUIDE.md](../STREAMING_GUIDE.md)** § Multi-Choice Pattern

---

**Last Updated**: 2025-10-05
