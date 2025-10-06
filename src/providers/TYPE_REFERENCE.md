# Provider Type Reference

> **Navigation**: [README](README.md) | [Architecture](ARCHITECTURE.md) | [Translation](TRANSLATION_GUIDE.md) | [Streaming](STREAMING_GUIDE.md) | [Implementation](IMPLEMENTATION_GUIDE.md)

---

## Table of Contents

- [Overview](#overview)
- [Holo Types (Canonical)](#holo-types-canonical)
- [Request Field Comparison](#request-field-comparison)
- [Response Field Comparison](#response-field-comparison)
- [Streaming Event Comparison](#streaming-event-comparison)
- [Provider-Specific Features](#provider-specific-features)
- [Complete Type Definitions](#complete-type-definitions)

---

## Overview

This document provides a complete reference for all types in the provider translation system, with **side-by-side comparisons** to understand differences across providers.

### Type Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Request Types** | Client → LLM | `HoloRequest`, `ClaudeRequest`, `OpenAIRequest` |
| **Response Types** | LLM → Client | `HoloResponse`, `ClaudeResponse`, `OpenAIResponse` |
| **Streaming Types** | Real-time deltas | `HoloStreamChunk`, `ClaudeRawMessageStreamEvent` |
| **Message Types** | Conversation history | `HoloMessage`, `ClaudeMessage`, `OpenAIMessage` |
| **Tool Types** | Function calling | `HoloTool`, `ClaudeTool`, `OpenAITool` |
| **Usage Types** | Token consumption | `HoloUsage`, `ClaudeUsage`, `OpenAIUsage` |

### Legend

- ✅ **Direct**: Field exists with same name and type
- 🔄 **Mapped**: Field exists but with different name or structure
- ❌ **Not Supported**: Provider doesn't support this feature
- 🔵 **Provider-Only**: Unique to this provider

---

## Holo Types (Canonical)

> Holo is the **portable abstraction layer** that normalizes all providers.

### HoloRequest

The universal request format for all LLM interactions.

| Field | Type | Required | Purpose | Notes |
|-------|------|----------|---------|-------|
| `model` | `string` | ✅ | Model identifier | Provider-specific format |
| `messages` | `HoloMessage[]` | ✅ | Conversation history | Array of messages |
| `system` | `string` | Optional | System prompt | OpenAI/Ollama via messages |
| `temperature` | `number` | Optional | Sampling temperature | Range: 0.0-2.0 |
| `top_p` | `number` | Optional | Nucleus sampling | Range: 0.0-1.0 |
| `top_k` | `number` | Optional | Top-K sampling | OpenAI not supported |
| `max_tokens` | `number` | Optional | Max output tokens | Provider-specific limits |
| `stop_sequences` | `string[]` | Optional | Custom stop sequences | Array of strings |
| `stream` | `boolean` | Optional | Enable streaming | Default: false |
| `tools` | `HoloTool[]` | Optional | Available functions | Tool calling support |
| `tool_choice` | `HoloToolChoice` | Optional | Tool selection strategy | Auto/none/required/specific |
| `response_format` | `HoloResponseFormat` | Optional | Output format | text/json_object/json_schema |
| `frequency_penalty` | `number` | Optional | Token frequency penalty | Range: -2.0 to 2.0 |
| `presence_penalty` | `number` | Optional | Token presence penalty | Range: -2.0 to 2.0 |
| `seed` | `number` | Optional | Random seed | For reproducibility |
| `service_tier` | `string` | Optional | API tier | Provider-specific values |
| `metadata` | `object` | Optional | Request metadata | Provider-specific |

### HoloMessage

Universal message format for conversation history.

| Field | Type | Required | Purpose | Notes |
|-------|------|----------|---------|-------|
| `role` | `'user' \| 'assistant' \| 'system' \| 'tool'` | ✅ | Message role | Enum values |
| `content` | `string \| HoloContent[]` | ✅ | Message content | Text or structured |
| `name` | `string` | Optional | Author name | OpenAI only |
| `tool_calls` | `HoloToolCall[]` | Optional | Function calls | Assistant only |
| `tool_call_id` | `string` | Optional | Tool result link | Tool messages only |

### HoloContent

Structured content within messages (multimodal support).

| Type | Fields | Purpose |
|------|--------|---------|
| **text** | `{ type: 'text', text: string }` | Plain text content |
| **image** | `{ type: 'image', url: string, mime?: string }` | Image content (HTTPS or data:) |
| **tool_result** | `{ type: 'tool_result', tool_call_id: string, content: string \| HoloContent[] }` | Tool execution results |

### HoloTool

Universal tool/function definition.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | `string` | ✅ | Function name |
| `description` | `string` | Optional | Function description |
| `parameters` | `object` | Optional | JSON Schema for parameters |

### HoloResponse

Universal response format.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | `string` | ✅ | Unique response ID * |
| `model` | `string` | ✅ | Model used |
| `created` | `number` | Optional | Timestamp (milliseconds) |
| `messages` | `HoloMessage[]` | ✅ | Response messages |
| `finish_reason` | `HoloFinishReason` | Optional | Completion reason |
| `usage` | `HoloUsage` | Optional | Token usage |
| `service_tier` | `string` | Optional | API tier used |

**\* Note:** Translators MUST generate a synthetic `id` when the provider does not return one (e.g., Ollama).
**Recommended format:** `id = "holo_" + base36(timestamp) + "_" + 8-char-random` (or UUID v4).
**Scope:** Synthesize for any provider lacking `id` (primarily Ollama, but future-proof).

### HoloStreamChunk

Universal streaming event format.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | `string` | Optional | Stream ID |
| `model` | `string` | ✅ | Model used |
| `created` | `number` | Optional | Timestamp (ms) |
| `delta` | `HoloStreamingDelta` | Optional | Incremental update |
| `finish_reason` | `HoloFinishReason` | Optional | Completion reason |
| `usage` | `HoloUsage` | Optional | Token usage |
| `done` | `boolean` | Optional | Stream complete |

### HoloStreamingDelta

Incremental update within streaming.

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `provider` | `'claude' \| 'openai' \| 'ollama' \| 'holo'` | ✅ | Source provider |
| `type` | `'message_start' \| 'content_delta' \| 'message_delta' \| 'message_stop'` | ✅ | Event type |
| `choice` | `number` | Optional | Choice index (multi-choice) |
| `index` | `number` | Optional | Content block index |
| `delta` | `Partial<HoloMessage>` | ✅ | Message updates |
| `provider_delta` | `unknown` | Optional | Raw provider event |

---

## Request Field Comparison

### Core Request Fields

| Holo Field | Claude | OpenAI | Ollama | Type | Notes |
|------------|--------|--------|--------|------|-------|
| `model` | ✅ `model` | ✅ `model` | ✅ `model` | string | All required |
| `messages` | ✅ `messages` | ✅ `messages` | ✅ `messages` | array | Different content structures |
| `system` | ✅ `system` | 🔄 via messages | 🔄 via messages/top-level | string/array | Claude may take `system` array; OpenAI/Ollama require injection as first `messages[]` item |
| `temperature` | ✅ `temperature` | ✅ `temperature` | 🔄 `options.temperature` | number | Ollama nests in options |
| `top_p` | ✅ `top_p` | ✅ `top_p` | 🔄 `options.top_p` | number | 0.0-1.0 |
| `top_k` | ✅ `top_k` | ❌ | 🔄 `options.top_k` | number | OpenAI not supported |
| `max_tokens` | ✅ `max_tokens` | ✅ `max_tokens` | 🔄 `options.num_predict` | number | Ollama different name |
| `stop_sequences` | ✅ `stop_sequences` | 🔄 `stop` | 🔄 `options.stop` | string[] | Different names |
| `stream` | ✅ `stream` | ✅ `stream` | ✅ `stream` | boolean | All direct |
| `tools` | ✅ `tools` | ✅ `tools` | ✅ `tools` | array | Different structures |
| `tool_choice` | ✅ `tool_choice` | ✅ `tool_choice` | ❌ | object/string | Ollama not supported |
| `response_format` | ❌ | ✅ `response_format` | 🔄 `format` | object | Claude not supported |
| `frequency_penalty` | ❌ | ✅ `frequency_penalty` | 🔄 `options.frequency_penalty` | number | -2.0 to 2.0 |
| `presence_penalty` | ❌ | ✅ `presence_penalty` | 🔄 `options.presence_penalty` | number | -2.0 to 2.0 |
| `seed` | ❌ | ✅ `seed` | 🔄 `options.seed` | number | Claude not supported |
| `service_tier` | ❌ | ✅ `service_tier` | ❌ | string | OpenAI only; response-only for Claude |
| `metadata` | ❌ | 🔄 `user` | ❌ | object | OpenAI maps only `metadata.user_id` → `user` |

### Provider-Specific Request Fields

| Field | Provider | Type | Purpose |
|-------|----------|------|---------|
| `thinking` | 🔵 Claude | object | Reasoning configuration (`{type, budget_tokens}`) |
| `container` | 🔵 Claude | string | Execution environment ID |
| `mcp_servers` | 🔵 Claude | array | Model Context Protocol servers |
| `betas` | 🔵 Claude | string[] | Beta feature flags |
| `cache_control` | 🔵 Claude | object | Prompt caching config |
| `logit_bias` | 🔵 OpenAI | Record<string, number> | Token probability adjustment |
| `logprobs` | 🔵 OpenAI | boolean | Return log probabilities |
| `top_logprobs` | 🔵 OpenAI | number | Top N log probabilities (1-20) |
| `n` | 🔵 OpenAI | number | Number of completions |
| `parallel_tool_calls` | 🔵 OpenAI | boolean | Allow concurrent tool calls |
| `reasoning_effort` | 🔵 OpenAI | string | Reasoning effort for o1/o3 models (`low`, `medium`, `high`); **OpenAI-only, not mapped to Holo** |
| `keep_alive` | 🔵 Ollama | string/number | Model memory duration ("5m", 300) |
| `options` | 🔵 Ollama | object | Advanced config (GPU, NUMA, etc.) |

---

## Response Field Comparison

### Core Response Fields

| Holo Field | Claude | OpenAI | Ollama | Type | Notes |
|------------|--------|--------|--------|------|-------|
| `id` | ✅ `id` | ✅ `id` | ❌ | string | Ollama no ID; translators must synthesize |
| `model` | ✅ `model` | ✅ `model` | ✅ `model` | string | All required |
| `created` | ❌ | ✅ `created` (seconds) | ✅ `created_at` (ISO8601) | number (ms in Holo) | Holo stores ms; convert on translation |
| `role` | ✅ `role` | 🔄 `choices[0].message.role` | 🔄 `message.role` | string | Always 'assistant' |
| `content` | ✅ `content` | 🔄 `choices[0].message.content` | 🔄 `message.content` | string/array | Claude: blocks |
| `finish_reason` | 🔄 `stop_reason` | 🔄 `choices[0].finish_reason` | 🔄 `done_reason` | string | Different values |
| `tool_calls` | 🔄 in `content[]` | 🔄 `choices[0].message.tool_calls` | 🔄 `message.tool_calls` | array | Claude embeds in content |
| `usage` | ✅ `usage` | ✅ `usage` | 🔄 token fields | object | Different structure |
| `service_tier` | 🔄 `usage.service_tier` | ✅ `service_tier` | ❌ | string | Claude in usage |

**OpenAI Tool Arguments Parsing:**
```typescript
// OpenAI → Holo tool arguments (defensive parsing)
let argsObj: unknown | undefined;
try {
  argsObj = JSON.parse(tc.function.arguments);
} catch {
  // Leave undefined or accumulate until valid JSON (see Streaming section)
}
```

**Timestamp Normalization:**
- **OpenAI → Holo**: `created_sec * 1000` → `created` (ms)
- **Ollama → Holo**: `Date.parse(created_at)` → `created` (ms)
- **Claude**: No timestamp in responses

### Finish Reason Mapping

| Holo | Claude | OpenAI | Ollama | Meaning |
|------|--------|--------|--------|---------|
| `stop` | `end_turn` | `stop` | `stop` | Natural completion |
| `length` | `max_tokens` | `length` | `length` | Token limit reached |
| `tool_calls` | `tool_use` | `tool_calls` | ❌ | Tool call required |
| `content_filter` | ❌ | `content_filter` | ❌ | Safety filtered * |
| ❌ | `pause_turn` | ❌ | ❌ | Claude-only pause |
| ❌ | `stop_sequence` | ❌ | ❌ | Custom stop sequence hit |

**\* Note:** For Claude, policy refusals are surfaced in the message content/metadata, not as a `stop_reason`.

### Usage Field Comparison

| Holo Field | Claude | OpenAI | Ollama |
|------------|--------|--------|--------|
| `input_tokens` | ✅ `usage.input_tokens` | 🔄 `usage.prompt_tokens` | 🔄 `prompt_eval_count` |
| `output_tokens` | ✅ `usage.output_tokens` | 🔄 `usage.completion_tokens` | 🔄 `eval_count` |
| `total_tokens` | 🔄 calculated | ✅ `usage.total_tokens` | 🔄 calculated |
| `cache_read_tokens` | ✅ `usage.cache_read_input_tokens` | 🔄 `usage.prompt_tokens_details.cached_tokens` | ❌ |
| `cache_write_tokens` | ✅ `usage.cache_creation_input_tokens` | ❌ | ❌ |
| `service_tier` | ✅ `usage.service_tier` | 🔄 top-level | ❌ |

---

## Streaming Event Comparison

### Event Type Mapping

| Holo Event | Claude Event | OpenAI Event | Ollama Event | Purpose |
|------------|--------------|--------------|--------------|---------|
| `message_start` | `message_start` | First chunk that sets assistant context (usually `delta.role` or first non-empty `delta.content`) | ❌ No explicit start | Initialize message |
| `content_delta` | `content_block_delta` (text_delta) | `delta.content` | `response` (done=false) | Incremental text |
| `message_delta` | `message_delta` (usage/finish) | `delta.tool_calls[]` or usage chunk | Tool calls or final frame | Metadata/tools |
| `message_stop` | `message_stop` | `finish_reason` non-null | `done: true` | Completion marker |
| ❌ | `content_block_start` | ❌ | ❌ | Claude-only block start |
| ❌ | `content_block_stop` | ❌ | ❌ | Claude-only block stop |

### Streaming Lifecycle

**Claude (6 event types):**
```
message_start
→ content_block_start [index=0]
→ content_block_delta (text_delta) [index=0]
→ content_block_stop [index=0]
→ message_delta (usage)
→ message_stop
```

**OpenAI (chunks with deltas):**
```
chunk { delta: { role: "assistant" } }          → message_start
chunk { delta: { content: "Hello" } }           → content_delta
chunk { delta: { tool_calls: [...] } }          → message_delta
chunk { finish_reason: "stop" }                 → message_stop
chunk { usage: {...}, choices: [] }             → message_delta (usage-only)
```

**Ollama (frame-based):**
```
{ response: "Hello", done: false }              → content_delta
{ response: " world", done: false }             → content_delta
{ response: "", done: true, eval_count: 42 }    → message_delta + message_stop
```

### HoloStreamChunk Fields by Event Type

| Event Type | Required Fields | Optional Fields |
|------------|----------------|-----------------|
| `message_start` | `model`, `delta.type`, `delta.provider`, `delta.delta.role` | `id`, `created`, `delta.choice` |
| `content_delta` | `model`, `delta.type`, `delta.provider`, `delta.delta.content` | `id`, `created`, `delta.choice`, `delta.index` |
| `message_delta` | `model`, `delta.type`, `delta.provider` | `delta.delta.tool_calls`, `usage`, `finish_reason` |
| `message_stop` | `model`, `delta.type`, `delta.provider` | `finish_reason`, `usage`, `done` |

---

## Provider-Specific Features

### Claude-Only Features

#### Request Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **Extended Thinking** | `thinking` | `{ type: 'enabled', budget_tokens: number } \| { type: 'disabled' }` | Reasoning capabilities |
| **Container Execution** | `container` | `string \| null` | Sandboxed execution environment |
| **MCP Integration** | `mcp_servers` | `Array<{name, type, url, authorization_token?}>` | Model Context Protocol servers |
| **Prompt Caching** | `cache_control` on blocks | `{ type: 'ephemeral', ttl?: '5m' \| '1h' }` | Content caching |
| **Beta Features** | `betas` | `string[]` | Feature flags (e.g., "prompt-caching-2024-07-31") |
| **System as Array** | `system` | `string \| Array<TextBlockParam>` | Structured system prompts |

#### Response Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **Thinking Blocks** | `content[].type='thinking'` | `{ thinking: string, signature: string }` | Reasoning output |
| **Server Tools** | `content[].type='server_tool_use'` | Built-in tools | Web search, code execution |
| **Citations** | `content[].citations` | Array of location types | Document citations |
| **Stop Sequence** | `stop_sequence` | `string \| null` | Which custom stop matched |
| **Container Info** | `container` | `{ id: string, expires_at: string }` | Execution environment |

#### Streaming Features

- **Granular Events**: 6 event types (message_start/stop, content_block_start/delta/stop, message_delta)
- **Content Block Indexing**: Track multiple content blocks simultaneously
- **Usage Streaming**: Incremental token counts during generation

### OpenAI-Only Features

#### Request Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **N Completions** | `n` | `number` | Generate multiple completions |
| **Log Probabilities** | `logprobs`, `top_logprobs` | `boolean`, `number` | Token probability analysis |
| **Logit Bias** | `logit_bias` | `Record<string, number>` | Adjust token probabilities |
| **Parallel Tool Calls** | `parallel_tool_calls` | `boolean` | Concurrent tool execution (default: true) |
| **Structured Output** | `response_format` | `{ type: 'json_schema', json_schema: {...} }` | Strict JSON schema |
| **User Tracking** | `user` | `string` | End-user identifier |

#### Response Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **Multiple Choices** | `choices[]` | Array | Multiple completions (when n>1) |
| **System Fingerprint** | `system_fingerprint` | `string` | Backend configuration hash |
| **Refusal** | `message.refusal` | `string \| null` | Content policy explanation |
| **Log Probabilities** | `choices[].logprobs` | Object | Token-level probabilities |

#### Streaming Features

- **Multi-Choice Streaming**: Each choice streams independently
- **Tool Call Indexing**: Tools use array indices for parallel calls
- **Usage Chunk**: Optional separate chunk with usage stats
- **Streaming JSON**: Tool arguments stream as JSON fragments

### Ollama-Only Features

#### Request Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **Keep Alive** | `keep_alive` | `string \| number` | Model memory duration ("5m", 300) |
| **Hardware Control** | `options.num_gpu`, `options.main_gpu`, `options.low_vram` | Numbers/booleans | GPU configuration |
| **NUMA Support** | `options.numa` | `boolean` | NUMA optimization |
| **Context Window** | `options.num_ctx` | `number` | Context size override |
| **Advanced Sampling** | `options.mirostat`, `options.tfs_z`, `options.typical_p` | Numbers | Alternative sampling |
| **Raw Mode** | `raw` | `boolean` | Skip prompt formatting (generate only) |
| **Dual Mode** | Chat vs Generate | Different endpoints | `/api/chat` vs `/api/generate` |

#### Response Features

| Feature | Field | Type | Purpose |
|---------|-------|------|---------|
| **Context Array** | `context` | `number[]` | Conversation state (generate only) |
| **Performance Metrics** | `total_duration`, `load_duration`, `eval_duration` | `number` (nanoseconds) | Detailed timing |
| **Simple Structure** | Single message | No choices array | Always one response |

#### Streaming Features

- **Frame-Based**: Simple `{ response, done }` structure
- **No Explicit Start**: First frame begins content immediately
- **Timing in Final**: Performance metrics only in done=true frame

---

## Complete Type Definitions

For complete type definitions including all fields, see the original files:

- **Holo**: [holo/HOLO_CHAT_REQUEST_TYPES.md](holo/HOLO_CHAT_REQUEST_TYPES.md), [holo/HOLO_CHAT_RESPONSE_TYPES.md](holo/HOLO_CHAT_RESPONSE_TYPES.md)
- **Claude**: [claude/CLAUDE_REQUEST_TYPES.md](claude/CLAUDE_REQUEST_TYPES.md), [claude/CLAUDE_RESPONSE_TYPES.md](claude/CLAUDE_RESPONSE_TYPES.md)
- **OpenAI**: [openai/OPENAI_REQUEST_TYPES.md](openai/OPENAI_REQUEST_TYPES.md), [openai/OPENAI_RESPONSE_TYPES.md](openai/OPENAI_RESPONSE_TYPES.md)
- **Ollama**: [ollama/OLLAMA_REQUEST_TYPES.md](ollama/OLLAMA_REQUEST_TYPES.md), [ollama/OLLAMA_RESPONSE_TYPES.md](ollama/OLLAMA_RESPONSE_TYPES.md)

---

## Quick Reference Cards

### "Which provider supports X?"

| Feature | Claude | OpenAI | Ollama |
|---------|--------|--------|--------|
| **Multi-choice (n>1)** | ❌ | ✅ | ❌ |
| **Streaming** | ✅ (6 events) | ✅ (chunks) | ✅ (frames) |
| **Tool calling** | ✅ | ✅ | ✅ |
| **Vision** | ✅ | ✅ | ✅ |
| **JSON output** | Via tools * | ✅ Native | ✅ Native |
| **Thinking/reasoning** | ✅ | ✅ (o1/o3; `reasoning_effort`) | ❌ |
| **Prompt caching** | ✅ | ✅ | ❌ |
| **System array** | ✅ | ❌ | ❌ |
| **Log probabilities** | ❌ | ✅ | ❌ |
| **Local deployment** | ❌ | ❌ | ✅ |

**\* Note:** Claude does not enforce JSON schemas natively; use tools or system instructions for structured output.

### "How do I map field X?"

| Holo Field | → Claude | → OpenAI | → Ollama |
|------------|----------|----------|----------|
| `system` | Direct | Inject system message | Top-level or inject message |
| `max_tokens` | Direct | Direct | `options.num_predict` |
| `stop_sequences` | Direct | `stop` | `options.stop` |
| `tool_choice` | `{ type, name }` | String or `{ type: 'function', function }` | Not supported |
| `response_format` | Not supported | Direct | `format` (string or object) |

---

## Related Documentation

- **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - Field mapping tables and transformation logic
- **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** - Streaming event lifecycle and implementation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design patterns

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
