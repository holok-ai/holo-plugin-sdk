# Holo Chat Responses — Unified Response Surface (Claude • OpenAI • Ollama v0.5.15)

> Goal: a single “Holo” response type that normalizes Claude, OpenAI, and Ollama responses. Fields are grouped into **Common (Direct Mapping)**, **Mapped (Functional Equivalents)**, and **Provider‑Specific**.

| **Holo Field** | **Claude** | **OpenAI** | **Ollama Chat** | **Type** | **Category** | **Notes** |
|----------------|------------|------------|----------------|----------|-------------|-----------|
| **🟢 Common (Direct 1:1 Mapping)** |||||||
| `id` | `id` | `id` | ✗ | string | Core | Required Claude/OpenAI; Ollama has no id |
| `model` | `model` | `model` | `model` | string | Core | Required all |
| `role` | `role: "assistant"` | `message.role` | `message.role` | string | Content | Always "assistant" |
| `content` | `content` (blocks) | `message.content` | `message.content` | string/array | Content | Required all |
| **🟡 Mapped (Functional Equivalents)** |||||||
| `created` | ✗ | `created` | `created_at` | number/date | Core | OpenAI uses epoch seconds, Ollama uses ISO8601 |
| `object` | `type: "message"` | `object: "chat.completion"` | ✗ | string | Core | Response type indicator |
| `finish_reason` | `stop_reason` | `finish_reason` | derived from `done_reason` | string | Completion | Normalize to `stop`, `length`, etc. |
| `tool_calls` | `content[].type="tool_use"` | `message.tool_calls` | `message.tool_calls` | array | Tools | Function call structure differs |
| `service_tier` | `usage.service_tier` | `service_tier` | ✗ | string | Meta | Priority tier reported |
| **🟠 Usage Fields** |||||||
| `input_tokens` | `usage.input_tokens` | `usage.prompt_tokens` | `prompt_eval_count` | number | Usage | Required in Claude/OpenAI if usage present |
| `output_tokens` | `usage.output_tokens` | `usage.completion_tokens` | `eval_count` | number | Usage | Required if present |
| `total_tokens` | calculated | `usage.total_tokens` | calculated | number | Usage | Sum of input + output |
| `cache_read_tokens` | `usage.cache_read_input_tokens` | `usage.prompt_tokens_details.cached_tokens` | ✗ | number | Usage | Optional |
| `cache_write_tokens` | `usage.cache_creation_input_tokens` | ✗ | ✗ | number | Usage | Optional |
| **🔵 Claude‑Specific** |||||||
| `container` | `container` | ✗ | ✗ | object | Execution | Optional |
| `stop_sequence` | `stop_sequence` | ✗ | ✗ | string | Completion | Actual stop sequence hit |
| `thinking` | thinking content blocks | ✗ | ✗ | string | Reasoning | Reasoning output |
| `citations` | text block citations | ✗ | ✗ | array | Content | Advanced citations |
| `type` | stream event `type` | ✗ | ✗ | string | Stream | Stream event type |
| `index` | content block index | ✗ | ✗ | number | Stream | Content block index |
| `content_block` | stream `content_block` | ✗ | ✗ | object | Stream | Content block data |
| `delta` | stream delta object | ✗ | ✗ | object | Stream | Partial updates |
| **🟠 OpenAI‑Specific** |||||||
| `system_fingerprint` | ✗ | `system_fingerprint` | ✗ | string | Meta | Optional |
| `choices` | ✗ | `choices` | ✗ | array | Content | Required top-level array |
| `logprobs` | ✗ | `choices[].logprobs` | ✗ | object | Analysis | Optional |
| `refusal` | ✗ | `message.refusal` | ✗ | string | Safety | Refusal explanation |
| `function_call` | ✗ | `message.function_call` | ✗ | object | Tools | Legacy function call |
| `audio` | ✗ | `message.audio` | ✗ | object | Audio | Audio output content |
| `annotations` | ✗ | `message.annotations` | ✗ | array | Content | Optional |
| **🟣 Ollama‑Specific** |||||||
| `done` | ✗ | ✗ | `done` | boolean | Completion | Required |
| `context` | ✗ | ✗ | `context` (generate only) | number[] | State | Generate mode only |
| `response` | ✗ | ✗ | `response` (generate only) | string | Content | Generate mode only |
| `total_duration` | ✗ | ✗ | `total_duration` | number | Performance | Optional |
| `load_duration` | ✗ | ✗ | `load_duration` | number | Performance | Optional |
| `prompt_eval_duration` | ✗ | ✗ | `prompt_eval_duration` | number | Performance | Optional |
| `eval_duration` | ✗ | ✗ | `eval_duration` | number | Performance | Optional |

### HoloContent (Normalized Message Content)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `type` | `'text'\|'image'\|'tool_use'\|'tool_result'\|'thinking'\|'citation'` | `content[].type` (blocks) | `message.content` parts: `'text'\|'image_url'` | `message.content` (string); `images[]` separate | Normalize provider-specific kinds to Holo enums |
| `text` | string | `text` (text block) | text part value | `message.content` string | Present when `type='text'` |
| `image` | `{ url?: string; data?: string }` | image block `source` | `image_url.url` (+ `detail`) | `images[]` (base64/path) | Present when `type='image'` |
| `tool_use` | `{ id: string; name: string; input: unknown }` | `tool_use` block | `message.tool_calls[].function` | `message.tool_calls[].function` | Normalize function signature |
| `tool_result` | `{ tool_use_id: string; content?: HoloContent[]; is_error?: boolean }` | `tool_result` block | separate `role='tool'` message | separate tool message | Link to originating tool via id |
| `thinking` | `{ text?: string; signature?: string }` | `thinking`/`redacted_thinking` | ✗ | ✗ | Claude-only |
| `citation` | `{ span?: [number,number]; meta?: unknown }` | `citations` on text | ✗ | ✗ | Preserve in `HoloContent[]` |

### HoloToolCall (Normalized Tool Invocation)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `id` | string | `tool_use.id` | `tool_calls[].id` | no explicit id | Generate deterministic id in Holo when missing |
| `name` | string | `tool_use.name` | `tool_calls[].function.name` | `tool_calls[].function.name` | Function identifier |
| `arguments` | object | `tool_use.input` (unknown) | `JSON.parse(tool_calls[].function.arguments)` | `tool_calls[].function.arguments` (object) | Normalize to object; parse OpenAI string |
| `provider_raw` | unknown | full block | full tool_call | full tool_call | Optional debugging copy |

### HoloUsage (Tokens & Performance)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `input_tokens` | number | `usage.input_tokens` | `usage.prompt_tokens` | `prompt_eval_count` | Optional |
| `output_tokens` | number | `usage.output_tokens` | `usage.completion_tokens` | `eval_count` | Optional |
| `total_tokens` | number | calc | `usage.total_tokens` | calc | Input + output when known |
| `cache_read_tokens` | number | `usage.cache_read_input_tokens` | `usage.prompt_tokens_details.cached_tokens` | ✗ | Optional |
| `cache_write_tokens` | number | `usage.cache_creation_input_tokens` | ✗ | ✗ | Optional |
| `service_tier` | string | `usage.service_tier` | top-level `service_tier` | ✗ | Normalize to Holo |
| `timings.total` | number | ✗ | ✗ | `total_duration` | ns |
| `timings.load` | number | ✗ | ✗ | `load_duration` | ns |
| `timings.prompt_eval` | number | ✗ | ✗ | `prompt_eval_duration` | ns |
| `timings.eval` | number | ✗ | ✗ | `eval_duration` | ns |

### HoloChoice (Support for OpenAI Choices)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `index` | number | ✗ | `choices[].index` | ✗ | Preserve order when present |
| `message` | `HoloMessage` | single message | `choices[].message` | single message | Unified view |
| `finish_reason` | `'stop'\|'length'\|'tool_calls'\|'content_filter'\|'function_call'\|'refusal'\|null` | map from `stop_reason` | `choices[].finish_reason` | derive from `done_reason`/final | Use Finish Reason mapping |
| `logprobs` | object | ✗ | `choices[].logprobs` | ✗ | Optional |

### HoloMessage (Within Responses)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `role` | `'assistant'\|'tool'` | `role` | `message.role` | `message.role` | Assistant primary |
| `content` | `HoloContent[]\|string` | blocks | string/parts | string | Prefer `HoloContent[]` for rich content |
| `tool_calls` | `HoloToolCall[]` | from blocks | `message.tool_calls` | `message.tool_calls` | Normalize shape |
| `refusal` | `string\|null` | ✗ | `message.refusal` | ✗ | Optional |
| `audio` | object | ✗ | `message.audio` | ✗ | Optional |

### HoloLogprobs (OpenAI Only)
| **Holo Field** | **Type** | **OpenAI Mapping** | **Notes** |
|----------------|----------|--------------------|-----------|
| `tokens[].token` | string | `choices[].logprobs.content[].token` | Token text |
| `tokens[].logprob` | number | `choices[].logprobs.content[].logprob` | Log probability |
| `tokens[].bytes` | number[] | `choices[].logprobs.content[].bytes` | Optional bytes |
| `tokens[].top_logprobs[]` | array | `choices[].logprobs.content[].top_logprobs[]` | Alternatives per token |

### HoloStreamingDelta (Normalized Streaming)
| **Holo Field** | **Type** | **Claude Mapping** | **OpenAI Mapping** | **Ollama Mapping** | **Notes** |
|----------------|----------|--------------------|--------------------|--------------------|-----------|
| `provider` | `'claude'\|'openai'\|'ollama'` | n/a | n/a | n/a | Source identifier |
| `type` | `'message_start'\|'content_delta'\|'message_delta'\|'message_stop'` | `event.type` | implicit; via `choices[].delta` | none; via partial packets | Semantic stage |
| `index` | number | `content_block.index` | `choices[].index` | ✗ | Unit being updated |
| `delta` | partial message | `content_block_delta.delta` | `choices[].delta` | partial `message` | Fold into HoloMessage |
| `usage` | `HoloUsage\|null` | `message_delta.usage` | extra usage chunk | ✗ | When available |

## Streaming Semantics
| Provider | Streaming Model | Key Fields |
|----------|----------------|-----------|
| Claude | `BetaRawMessageStreamEvent` | `type`, `content_block`, `delta`, `index` |
| OpenAI | `ChatCompletionChunk` | `choices[].delta`, `finish_reason` |
| Ollama | same response with `done=false` | incremental `message.content` until final |

## Universal Finish Reason Mapping
| **Holo Value** | **Claude** | **OpenAI** | **Ollama** | Notes |
|----------------|-----------|-----------|-----------|-------|
| `stop` | `end_turn` | `stop` | `stop` | Natural completion |
| `length` | `max_tokens` | `length` | `length` | Token limit hit |
| `tool_calls` | `tool_use` | `tool_calls` | ✗ | Function call required |
| `content_filter` | `refusal` | `content_filter` | ✗ | Safety filtered |
| `function_call` | ✗ | `function_call` | ✗ | Deprecated OpenAI call |
| `pause_turn` | `pause_turn` | ✗ | ✗ | Claude-only pause |
| `refusal` | `refusal` | ✗ | ✗ | Explicit refusal |

## Service Tier Mapping
| **Holo Value** | **Claude** (`usage.service_tier`) | **OpenAI** (`service_tier`) | **Ollama** |
|----------------|----------------------------------|---------------------------|-----------|
| `standard` | `standard` | ✗ | ✗ |
| `priority` | `priority` | `priority` | ✗ |
| `batch` | `batch` | ✗ | ✗ |
| `auto` | ✗ | `auto` | ✗ |
| `default` | ✗ | `default` | ✗ |
| `flex` | ✗ | `flex` | ✗ |
| `scale` | ✗ | `scale` | ✗ |

### Implementation Notes
- **Minimal required fields:** `model`, `content`, and provider’s completion marker (`done` or `finish_reason`) should be considered required.
- **Usage aggregation:** Normalize input/output/total tokens across providers; emit `null` when not reported.
- **Streaming adapters:** Must reconstruct final `HoloResponse` by accumulating deltas (Claude content blocks, OpenAI delta chunks, Ollama incremental messages).
