# Ollama Provider

> [Provider System](../README.md) | [OpenAI](../openai/README.md) | [Claude](../claude/README.md) | [Holo](../holo/README.md)

---

## Overview

**Ollama provider implementation** with complete bidirectional translation between Ollama API and Holo (portable) format.

### Key Features

- ✅ Full request/response translation
- ✅ Dual mode support (chat + generate)
- ✅ Streaming support (frame-based)
- ✅ Tool calling support
- ✅ Vision/multimodal support
- ✅ Local model deployment
- ✅ Hardware control (GPU, NUMA)

---

## Quick Reference

### Ollama-Specific Features

| Feature | Field | Purpose |
|---------|-------|---------|
| **Keep Alive** | `keep_alive: string \| number` | Model memory duration ("5m", 300) |
| **Hardware Control** | `options.num_gpu`, `options.main_gpu` | GPU configuration |
| **NUMA Support** | `options.numa` | NUMA optimization |
| **Context Window** | `options.num_ctx` | Override context size |
| **Raw Mode** | `raw: boolean` | Skip prompt formatting (generate only) |
| **Dual Mode** | Chat vs Generate | Different endpoints |

**Note on tool_choice**: Ollama does not support explicit tool selection control. If a Holo request includes `tool_choice`, translators should drop it silently (model auto-selects tools when provided).

### Request Fields

| Holo Field | Ollama Field | Notes |
|------------|-------------|-------|
| `model` | `model` | Direct |
| `messages` | `messages` | Flatten text, extract images |
| `messages[].content[].type='image'` | `messages[].images: string[]` | Chat mode: extract image URLs to separate array; Generate mode: not supported |
| `system` | `system` (top-level) | Direct or inject as message (Chat); Generate: prepend to prompt |
| `temperature` | `options.temperature` | Nested in options |
| `top_p` | `options.top_p` | Nested in options |
| `top_k` | `options.top_k` | Nested in options |
| `max_tokens` | `options.num_predict` | Renamed + nested |
| `stop_sequences` | `options.stop` | Nested in options |
| `tools` | `tools` | OpenAI-style structure (Chat mode only; Generate mode: ❌); model returns tool_calls in response |
| `tool_choice` | ❌ | Not supported (model auto-selects); translators should log & degrade to `auto` when provided |
| `response_format` | `format` | Holo `{type:'json_object'}` → `"json"` (string); Holo `{type:'json_schema', schema}` → schema object |

### Response Fields

| Ollama Field | Holo Field | Notes |
|-------------|------------|-------|
| `model` | `model` | Direct |
| `message.role` | `messages[0].role` | Always 'assistant' |
| `message.content` | `messages[0].content` | Direct |
| `message.tool_calls` | `messages[0].tool_calls` | If present |
| `done_reason` | `finish_reason` | Map: `stop`→`stop`, `length`→`length`; if `done=true` && `!done_reason`, default to `'stop'` |
| `prompt_eval_count` | `usage.input_tokens` | Renamed (available in final response only) |
| `eval_count` | `usage.output_tokens` | Renamed (available in final response only) |
| `total_duration`, `load_duration`, `eval_duration` | `metadata.performance.*` | Performance metrics in **nanoseconds**; only in `done=true` frame; stored raw (don't convert) |
| `context` | `metadata.context` | Token ID array (Generate mode only); for context continuation across calls |
| `created_at` | `created` | **ISO8601 string → milliseconds** (`Date.parse(created_at)`) |

**Timestamp Normalization:**
- Ollama returns `created_at` as ISO8601 string (e.g., `"2024-01-01T12:00:00Z"`)
- Translators must convert to Holo `created` in **milliseconds**: `created = Date.parse(created_at)`
- Applies to both non-streaming responses and each streaming frame

### Streaming

Ollama uses **simple frame-based streaming**:

**Frame Structure:**
```typescript
{
    model: string;
    created_at: string;  // ISO8601 (e.g., "2024-01-01T12:00:00Z")
    message: { role, content };  // Chat mode
    response?: string;            // Generate mode
    done: boolean;
    // Performance metrics (if done=true)
    total_duration?: number;      // Nanoseconds
    eval_count?: number;
}
```

**ID Synthesis:**
- Ollama responses **do not include an `id`**
- Translators MUST synthesize a Holo `id` (e.g., UUIDv4) for both final responses and stream chunks

**Event Mapping (Mode-Specific):**

**Chat Mode:**
- `{ message: { role, content }, done: false }` → `content_delta` (from `message.content`)
- `{ done: true }` → `message_delta` (usage) + `message_stop`

**Generate Mode:**
- `{ response: "text", done: false }` → `content_delta` (from `response`)
- `{ done: true }` → `message_delta` (usage) + `message_stop`

**No explicit start** - first frame begins content immediately.

---

## Implementation

### Translators

| Component | File | Purpose |
|-----------|------|---------|
| **Main Facade** | `ollama.translator.ts` | Routes to sub-translators |
| **Chat Request** | `translators/ollama.chat.request.translator.ts` | Chat request |
| **Generate Request** | `translators/ollama.generate.request.translator.ts` | Generate request |
| **Chat Response** | `translators/ollama.chat.response.translator.ts` | Chat response |
| **Generate Response** | `translators/ollama.generate.response.translator.ts` | Generate response |
| **Messages** | `translators/ollama.message.translator.ts` | Message translation |

### Streaming Translators

| Event Type | File | Purpose |
|------------|------|---------|
| **Content Delta** | `streaming/ollama.content.delta.translator.ts` | Incremental text (done=false) |
| **Message Delta** | `streaming/ollama.message.delta.translator.ts` | Usage updates |
| **Message Stop** | `streaming/ollama.message.stop.translator.ts` | Completion (done=true) |
| **Orchestrator** | `streaming/ollama.stream.translator.ts` | Routes events |

### Validators

All types validated with ArkType:

- `OllamaChatRequestValidator`
- `OllamaGenerateRequestValidator`
- `OllamaChatResponseValidator`
- `OllamaGenerateResponseValidator`

**Validator Expectations:**
- Chat requests require `messages[]`; Generate requests require `prompt` (string)
- `options.*` fields are optional; validators accept flat Holo params, translators nest into `options`
- `images[]` is optional and only validated in Chat mode
- `format` accepts `string | object`; validators enforce JSON schema structure when object provided
- Streaming frames validate incrementally; usage fields only required in `done=true` frame
- Responses may omit `done_reason` (validator allows undefined; translator defaults to `'stop'`)
- Usage fields (`prompt_eval_count`, `eval_count`) are optional in streaming frames; only required in final response
- Performance metrics (`total_duration`, etc.) only present when `done=true`

---

## Usage Examples

### Chat Mode

```typescript
import { container } from 'tsyringe';
import { OllamaChatRequestTranslator } from './translators';

const translator = container.resolve(OllamaChatRequestTranslator);

const holoRequest = {
    model: 'llama2',
    messages: [{ role: 'user', content: 'Hello!' }],
    temperature: 0.7,
    max_tokens: 1024
};

// Holo → Ollama Chat
const [ollamaRequest] = await translator.fromHoloMany(holoRequest);
// {
//   model: 'llama2',
//   messages: [{ role: 'user', content: 'Hello!' }],
//   options: {
//     temperature: 0.7,
//     num_predict: 1024
//   }
// }
```

### Generate Mode

```typescript
import { OllamaGenerateRequestTranslator } from './translators';

const translator = container.resolve(OllamaGenerateRequestTranslator);

const holoRequest = {
    model: 'llama2',
    messages: [{ role: 'user', content: 'Complete this: Once upon a time' }],
    temperature: 0.7
};

// Holo → Ollama Generate
const [ollamaRequest] = await translator.fromHoloMany(holoRequest);
// {
//   model: 'llama2',
//   prompt: 'Complete this: Once upon a time',
//   options: { temperature: 0.7 }
// }
```

### Streaming - Chat Mode

```typescript
import { OllamaStreamTranslator } from './translators/streaming';

const streamTranslator = container.resolve(OllamaStreamTranslator);

// Ollama Chat streaming frames
for await (const frame of ollamaStream) {
    // Frame 1: { model: 'llama2', created_at: '...', message: { role: 'assistant', content: 'Hello' }, done: false }
    // Frame 2: { model: 'llama2', created_at: '...', message: { role: 'assistant', content: ' there' }, done: false }
    // Frame 3: { model: 'llama2', created_at: '...', done: true, done_reason: 'stop', prompt_eval_count: 10, eval_count: 5 }

    const holoChunks = await streamTranslator.toHoloMany(frame);
    // Chunk 1 → [{ delta: { type: 'message_start' } }, { delta: { type: 'content_delta', delta: { content: 'Hello' } } }]
    // Chunk 2 → [{ delta: { type: 'content_delta', delta: { content: ' there' } } }]
    // Chunk 3 → [{ delta: { type: 'message_delta', usage } }, { delta: { type: 'message_stop' }, finish_reason: 'stop' }]

    for (const chunk of holoChunks) {
        console.log(chunk);
    }
}
```

### Streaming - Generate Mode

```typescript
// Ollama Generate streaming frames
for await (const frame of ollamaStream) {
    // Frame 1: { model: 'llama2', created_at: '...', response: 'Once', done: false }
    // Frame 2: { model: 'llama2', created_at: '...', response: ' upon', done: false }
    // Frame 3: { model: 'llama2', created_at: '...', response: '', done: true, done_reason: 'stop', context: [...] }

    const holoChunks = await streamTranslator.toHoloMany(frame);
    // Chunk 1 → [{ delta: { type: 'message_start' } }, { delta: { type: 'content_delta', delta: { content: 'Once' } } }]
    // Chunk 2 → [{ delta: { type: 'content_delta', delta: { content: ' upon' } } }]
    // Chunk 3 → [{ delta: { type: 'message_stop' }, finish_reason: 'stop' }]

    for (const chunk of holoChunks) {
        console.log(chunk);
    }
}
```

---

## Known Issues / Nuances

### Important

**No Explicit `message_start` Event**:
- Ollama streaming has no explicit start event; orchestrator must emit `message_start` on first frame
- Streaming frames begin with content immediately (no role-only initialization chunk)

**ID Synthesis Required**:
- Ollama responses lack stable `id` fields; translators MUST synthesize UUIDs or deterministic hashes
- Ensure consistent IDs across all chunks in a single stream

**Dual Mode Complexity**:
- Chat mode uses `messages[]`, Generate mode uses `prompt` (string)
- Tool calling only works in Chat mode; translators should reject tools in Generate requests
- `context` arrays (Generate mode) are out-of-band and not mapped to Holo

**Missing finish_reason in some models:**
- Some Ollama models return `done_reason: null` even when complete
- Translators default `finish_reason = 'stop'` when `done=true && !done_reason`
- Already handled in response translators

**Empty frames during slow tokenization:**
- Ollama may emit `{ response: "", done: false }` frames during pauses
- Translators should skip these frames (don't emit empty `content_delta` events)

**Usage timing:**
- Usage metrics (`prompt_eval_count`, `eval_count`) only appear in the final frame (`done=true`)
- Streaming frames before completion do not include token counts

**Context continuation (Generate mode only):**
- The `context` array is a token ID sequence for stateless context carry-over
- Should be preserved in `metadata.context` for application-level context management
- Not applicable to Chat mode (use message history instead)

---

## Streaming Examples

### Chat Mode Streaming

```typescript
// Ollama chat stream
{ model: 'llama2', created_at: '2024-01-01T12:00:00Z', message: { role: 'assistant', content: 'Hello' }, done: false }
{ model: 'llama2', created_at: '2024-01-01T12:00:01Z', message: { role: 'assistant', content: ' there' }, done: false }
{ model: 'llama2', created_at: '2024-01-01T12:00:02Z', message: { role: 'assistant', content: '!' }, done: true, prompt_eval_count: 10, eval_count: 3, done_reason: 'stop' }

// Translated to Holo
{ model: 'llama2', created: 1704110400000, delta: { type: 'content_delta', provider: 'ollama', delta: { content: 'Hello' } } }
{ model: 'llama2', created: 1704110401000, delta: { type: 'content_delta', provider: 'ollama', delta: { content: ' there' } } }
{ model: 'llama2', created: 1704110402000, delta: { type: 'message_delta', provider: 'ollama', delta: {} }, usage: { input_tokens: 10, output_tokens: 3 }, finish_reason: 'stop' }
{ model: 'llama2', delta: { type: 'message_stop', provider: 'ollama', delta: {} }, done: true }
```

### Generate Mode Streaming

```typescript
// Ollama generate stream
{ model: 'llama2', created_at: '2024-01-01T12:00:00Z', response: 'Once', done: false }
{ model: 'llama2', created_at: '2024-01-01T12:00:01Z', response: ' upon', done: false }
{ model: 'llama2', created_at: '2024-01-01T12:00:02Z', response: ' a time', done: true, prompt_eval_count: 5, eval_count: 4, done_reason: 'stop', context: [123, 456] }

// Translated to Holo
{ model: 'llama2', created: 1704110400000, delta: { type: 'content_delta', provider: 'ollama', delta: { content: 'Once' } } }
{ model: 'llama2', created: 1704110401000, delta: { type: 'content_delta', provider: 'ollama', delta: { content: ' upon' } } }
{ model: 'llama2', created: 1704110402000, delta: { type: 'message_delta', provider: 'ollama', delta: {} }, usage: { input_tokens: 5, output_tokens: 4 }, finish_reason: 'stop' }
{ model: 'llama2', delta: { type: 'message_stop', provider: 'ollama', delta: {} }, done: true }
```

**Note**: The `context` array from Generate mode is preserved in `metadata.context` (not shown in abbreviated examples).

---

## Ollama API Documentation

- [Official API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Model Library](https://ollama.com/library)
- [Model Files](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)
- [FAQ](https://github.com/ollama/ollama/blob/main/docs/faq.md)

---

## Dual Mode Reference

### When to Use Chat vs Generate

| Use Case | Mode | Endpoint |
|----------|------|----------|
| Conversation history | **Chat** | `/api/chat` |
| Multiple messages | **Chat** | `/api/chat` |
| Tool calling | **Chat** | `/api/chat` |
| Single completion | **Generate** | `/api/generate` |
| Stateless prompts | **Generate** | `/api/generate` |
| Context continuation | **Generate** | `/api/generate` (with context) |

### Chat Mode Features

- ✅ Message history
- ✅ System prompts
- ✅ Tool calling
- ✅ Vision/multimodal
- ❌ Context array (for continuation)

### Generate Mode Features

- ✅ Single prompts
- ✅ Context continuation (via `context` number array; out-of-band state, not in Holo)
- ✅ Raw mode (skip formatting)
- ❌ Message history
- ❌ Tool calling

**Note:** The `context` field is a **stateful continuation mechanism** in Generate mode. Holo translators do not map this field—orchestrators must manage context arrays externally when chaining Generate requests.

---

**Last Updated**: 2025-11-11
