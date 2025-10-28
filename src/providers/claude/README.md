# Claude Provider

> **Navigation**: [Main README](../README.md) | [Architecture](../ARCHITECTURE.md) | [Types](../TYPE_REFERENCE.md) | [Translation](../TRANSLATION_GUIDE.md) | [Streaming](../STREAMING_GUIDE.md)

---

## Overview

**Claude provider implementation** with complete bidirectional translation between Claude API and Holo (portable) format.

### Key Features

- ✅ Full request/response translation
- ✅ Streaming support (6 event types)
- ✅ Stateful orchestrator for lifecycle events
- ✅ Tool calling support
- ✅ Vision/multimodal support
- ✅ Prompt caching
- ✅ Extended thinking (Claude 3.5 Sonnet+)

---

## Quick Reference

### Claude-Specific Features

| Feature | Field | Purpose |
|---------|-------|---------|
| **Extended Thinking** | `thinking: { type, budget_tokens }` | Reasoning capabilities (Claude 3.5 Sonnet+ models); enables chain-of-thought output in `content[].type='thinking'` blocks |
| **Prompt Caching** | `cache_control` on content blocks | Cache reusable content (use `cache_control` on **system/content blocks**, e.g., `{ type: 'text', text, cache_control: { type: 'ephemeral' } }`); reduces input token costs for repeated prompts |
| **Container Execution** | `container` | Sandboxed environment |
| **MCP Integration** | `mcp_servers` | Model Context Protocol |
| **Beta Features** | `betas: string[]` | Feature flags (e.g., `"prompt-caching-2024-07-31"`) |

**Extended Thinking Details:**
- When enabled, Claude may return `content[].type = 'thinking'` blocks containing reasoning traces
- These blocks are **separate from text blocks** and should be preserved in `metadata.thinking` or handled specially
- Thinking blocks do not contribute to final output but do consume output tokens

### Request Fields

| Holo Field | Claude Field | Notes |
|------------|-------------|-------|
| `model` | `model` | Direct |
| `messages` | `messages` | Transform content blocks |
| `system` | `system` | Direct (string or array) |
| `temperature` | `temperature` | Direct |
| `max_tokens` | `max_tokens` | Direct |
| `tools` | `tools` | Rename `parameters` → `input_schema` |
| `tool_choice` | `tool_choice` | Transform `specific` → `tool` |

**Tool choice mapping:**
- Holo `{ type: 'specific', name }` → Claude `{ type: 'tool', name }` (force that tool)
- Holo `{ type: 'required' }` → Claude `{ type: 'any' }` (force a tool call, model chooses which)
- Holo `{ type: 'auto' }` → Claude `{ type: 'auto' }`
- Holo `{ type: 'none' }` → Claude: omit `tool_choice` field (disable tools)

**Vision/Multimodal Mapping:**

| Holo Content | Claude Content | Notes |
|--------------|----------------|-------|
| `{ type: 'text', text }` | `{ type: 'text', text }` | Direct |
| `{ type: 'image', url }` | `{ type: 'image', source: { type: 'url', url } }` | Nested source object |
| `{ type: 'image', url: 'data:...' }` | `{ type: 'image', source: { type: 'base64', media_type, data } }` | Extract MIME type and base64 data |

### Response Fields

| Claude Field | Holo Field | Notes |
|-------------|------------|-------|
| `id` | `id` | Direct |
| `model` | `model` | Direct |
| `role` | `messages[0].role` | Always 'assistant' |
| `content[]` | `messages[0].content` + `tool_calls` | Extract text + tool_use blocks |
| `stop_reason` | `finish_reason` | Map: `end_turn`→`stop`, `tool_use`→`tool_calls` |

**Tool Call Extraction:**
- Claude embeds tool calls inside `content[]` as `{ type: 'tool_use', id, name, input }` blocks
- Translators must **extract** these to Holo `tool_calls[]` format:
  - `content[i].type = 'tool_use'` → `tool_calls[].type = 'function'`, `function = { name, arguments: input }`
  - `content[i].id` → `tool_calls[].id`
- Multiple tool calls may appear in the same response (each as a separate content block)
- Text blocks (`type: 'text'`) remain in `messages[0].content` (string or array)

**Usage mapping to Holo:**
- `usage.input_tokens` → `usage.input_tokens`
- `usage.output_tokens` → `usage.output_tokens`
- `usage.cache_read_input_tokens` → `usage.cache_read_tokens`
- `usage.cache_creation_input_tokens` → `usage.cache_write_tokens`
- `total_tokens` = input + output (computed)

**Timestamp Handling:**
- Claude responses **do not include a timestamp** (no `created` or `created_at` field)
- If your pipeline expects `HoloResponse.created`, synthesize it at receipt time: `created = Date.now()`
- Applies to both non-streaming responses and streaming events

### Streaming Events

Claude uses **6 event types** (most granular):

1. `message_start` - Initialize message
2. `content_block_start` - Begin content block (with `index` and `content_block` type)
3. `content_block_delta` - Incremental content (text deltas or tool input deltas)
4. `content_block_stop` - End content block (signals block completion)
5. `message_delta` - Usage/finish updates (streaming token counts, `stop_reason`)
6. `message_stop` - Completion marker (final event)

**content_block_delta Semantics:**
- `delta.type = 'text_delta'` → Text content increments (`delta.text`)
- `delta.type = 'input_json_delta'` → Tool argument deltas (`delta.partial_json`) - already parsed objects, not JSON strings
- Each delta is associated with a specific `index` (content block index from `content_block_start`)
- Translators must accumulate deltas by index to reconstruct full content blocks

**Orchestrator Role:**
- The `ClaudeStreamTranslator` **routes** these provider events to Holo stream chunks
- No synthetic events are created—each Claude event maps directly to one or more Holo events
- The orchestrator maintains content block state (by index) to handle deltas and tool accumulation
- Raw Claude events are preserved in `HoloStreamChunk.delta.provider_delta` for lossless round-tripping

---

## Implementation

### Translators

| Component | File | Purpose |
|-----------|------|---------|
| **Main Facade** | `claude.translator.ts` | Routes to sub-translators |
| **Request** | `translators/claude.request.translator.ts` | Request translation |
| **Response** | `translators/claude.response.translator.ts` | Response translation |
| **Messages** | `translators/claude.message.translator.ts` | Message array translation |
| **Tools** | `translators/claude.tool.translator.ts` | Tool definition translation |
| **Usage** | `translators/claude.usage.translator.ts` | Usage stats translation |

### Streaming Translators

| Event Type | File | Purpose |
|------------|------|---------|
| **Message Start** | `streaming/claude.message.start.event.translator.ts` | Initialize |
| **Message Delta** | `streaming/claude.message.delta.event.translator.ts` | Usage updates |
| **Message Stop** | `streaming/claude.message.stop.event.translator.ts` | Completion |
| **Block Start** | `streaming/claude.content.block.start.event.translator.ts` | Begin block |
| **Block Delta** | `streaming/claude.content.block.delta.event.translator.ts` | Incremental |
| **Block Stop** | `streaming/claude.content.block.stop.event.translator.ts` | End block |
| **Orchestrator** | `streaming/claude.stream.translator.ts` | Routes events |

### Validators

All types validated with ArkType:

- `ClaudeRequestValidator`
- `ClaudeResponseValidator`
- `ClaudeMessageValidator`
- `ClaudeRawMessageStreamEventValidator`
- Individual event validators

---

## Usage Examples

### Request Translation

```typescript
import { container } from 'tsyringe';
import { ClaudeTranslator } from './claude.translator';

const translator = container.resolve(ClaudeTranslator);

const holoReq = {
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: 'Hello!' }],
    temperature: 0.7,
    max_tokens: 1024
};

// Holo → Claude
const [claudeReq] = await translator.fromHoloMany(holoReq);

// (…call Claude API…)

// Claude → Holo
const [holoRes] = await translator.toHoloMany(claudeResponse);
```

### Streaming

```typescript
import { ClaudeStreamTranslator } from './translators/streaming';

const streamTranslator = container.resolve(ClaudeStreamTranslator);

for await (const event of claudeStream) {
    const holoChunks = await streamTranslator.toHoloMany(event);
    for (const chunk of holoChunks) {
        console.log(chunk);
    }
}
```

---

## Known Issues / Nuances

### Core Behaviors

**No Timestamp in Responses:**
- Claude responses have **no top-level timestamp** (`created` or `created_at` field)
- If your pipeline expects `HoloResponse.created`, synthesize it at receipt time: `created = Date.now()`

**Tool Call Extraction:**
- Tool calls arrive inside `content[]` as `{ type: 'tool_use', id, name, input }` blocks
- Translators must **extract** these to Holo `tool_calls[]` format
- Multiple tool calls may coexist as separate content blocks

**Tool Argument Streaming:**
- When streaming, Claude sends **object deltas** via `input_json_delta` (already parsed, not JSON strings)
- Accumulate by content block `index` to reconstruct full tool arguments
- No JSON.parse() needed (unlike OpenAI's string-based streaming)

### Edge Cases

**pause_turn Stop Reason:**
- Claude may return `stop_reason: 'pause_turn'` for multi-step reasoning (Claude 3.7+)
- This is not a true stop—model expects continuation
- Translators should map to Holo `finish_reason: 'stop'` but preserve in `metadata.stop_reason_original`

**Beta Feature Compatibility:**
- Some features require beta headers (e.g., `betas: ["prompt-caching-2024-07-31"]`)
- If a beta is removed from API, requests may fail with 400 errors
- Check [Claude API changelog](https://docs.anthropic.com/changelog) for beta lifecycle

---

## Claude API Documentation

- [Official API Docs](https://docs.anthropic.com/claude/reference)
- [Streaming Guide](https://docs.anthropic.com/claude/reference/streaming)
- [Tool Use](https://docs.anthropic.com/claude/docs/tool-use)
- [Vision](https://docs.anthropic.com/claude/docs/vision)
- [Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)

---

## Related Documentation

- **[TYPE_REFERENCE.md](../TYPE_REFERENCE.md)** § Claude Types
- **[TRANSLATION_GUIDE.md](../TRANSLATION_GUIDE.md)** § Claude ↔ Holo
- **[STREAMING_GUIDE.md](../STREAMING_GUIDE.md)** § Claude Orchestration

---

**Last Updated**: 2025-10-05
