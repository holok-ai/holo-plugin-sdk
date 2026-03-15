# Provider → Holo Mapping Tables

## Overview

This document provides comprehensive field-by-field mappings between each provider's native format and the Holo
universal format. Use these tables when implementing translation logic in provider plugins.

---

## Table of Contents

1. [Request Mappings](#request-mappings)
    - [Claude → Holo Requests](#claude--holo-requests)
    - [OpenAI → Holo Requests](#openai--holo-requests)
    - [Ollama → Holo Requests](#ollama--holo-requests)
2. [Response Mappings](#response-mappings)
    - [Claude → Holo Responses](#claude--holo-responses)
    - [OpenAI → Holo Responses](#openai--holo-responses)
    - [Ollama → Holo Responses](#ollama--holo-responses)
3. [Content Mappings](#content-mappings)
4. [Tool Mappings](#tool-mappings)
5. [Streaming Mappings](#streaming-mappings)

---

## Request Mappings

### Claude → Holo Requests

| Claude Field                     | Holo Field                     | Transformation                                                    | Notes                         |
|----------------------------------|--------------------------------|-------------------------------------------------------------------|-------------------------------|
| **🟢 Direct 1:1**                |                                |                                                                   |                               |
| `model`                          | `model`                        | Direct                                                            | ✅ Required                    |
| `temperature`                    | `temperature`                  | Direct                                                            | Optional (0-1 for Claude)     |
| `top_p`                          | `top_p`                        | Direct                                                            | Optional                      |
| `top_k`                          | `top_k`                        | Direct                                                            | Optional                      |
| `stream`                         | `stream`                       | Direct                                                            | Optional                      |
| `max_tokens`                     | `max_tokens`                   | Direct                                                            | Required by Claude            |
| `stop_sequences`                 | `stop_sequences`               | Direct                                                            | Already array format          |
| **🟡 Structure Transforms**      |                                |                                                                   |                               |
| `system` (string or text blocks) | `system` (string)              | If array, join text blocks with `\n\n` and drop non-text metadata | Optional; lossy if structured |
| `metadata.user_id`               | `metadata.user_id`             | Direct                                                            | Optional                      |
| `tools[].input_schema`           | `tools[].parameters`           | Rename field                                                      | Optional                      |
| `tool_choice.type: 'tool'`       | `tool_choice.type: 'specific'` | Map type + extract name                                           | Optional                      |
| `tool_choice.type: 'any'`        | `tool_choice.type: 'required'` | Map type                                                          | Optional                      |
| `messages[]`                     | `messages[]`                   | Transform content blocks                                          | See Content Mappings          |
| **🔵 Claude-Specific (Drop)**    |                                |                                                                   |                               |
| `container`                      | ❌ Drop                         | -                                                                 | Execution container           |
| `thinking`                       | ❌ Drop                         | -                                                                 | Reasoning config              |
| `betas`                          | ❌ Drop                         | -                                                                 | Feature flags                 |
| `mcp_servers`                    | ❌ Drop                         | -                                                                 | MCP server config             |

### OpenAI → Holo Requests

| OpenAI Field                   | Holo Field               | Transformation                  | Notes                                                                      |
|--------------------------------|--------------------------|---------------------------------|----------------------------------------------------------------------------|
| **🟢 Direct 1:1**              |                          |                                 |                                                                            |
| `model`                        | `model`                  | Direct                          | ✅ Required                                                                 |
| `temperature`                  | `temperature`            | Direct                          | Optional (0-2)                                                             |
| `top_p`                        | `top_p`                  | Direct                          | Optional                                                                   |
| `stream`                       | `stream`                 | Direct                          | Optional                                                                   |
| `max_tokens`                   | `max_tokens`             | Direct                          | Optional                                                                   |
| `max_completion_tokens`        | `max_tokens`             | Prefer `max_completion_tokens`  | Optional (newer field)                                                     |
| `frequency_penalty`            | `frequency_penalty`      | Direct                          | Optional (-2 to 2)                                                         |
| `presence_penalty`             | `presence_penalty`       | Direct                          | Optional (-2 to 2)                                                         |
| `seed`                         | `seed`                   | Direct                          | Optional                                                                   |
| **🟡 Structure Transforms**    |                          |                                 |                                                                            |
| `stop` (string/array)          | `stop_sequences` (array) | Normalize to array              | Optional                                                                   |
| `response_format`              | `response_format`        | Direct structure                | Optional                                                                   |
| `service_tier`                 | `service_tier`           | Direct                          | Optional                                                                   |
| `metadata`                     | `metadata`               | Direct                          | Optional                                                                   |
| `tools[]`                      | `tools[]`                | Extract from `function` wrapper | Optional                                                                   |
| `tool_choice`                  | `tool_choice`            | Map string/object formats       | Optional                                                                   |
| `messages[]`                   | `messages[]`             | Transform parts to HoloContent  | See Content Mappings                                                       |
| **🟡 Simulate in Holo**        |                          |                                 |                                                                            |
| System message (role='system') | `system`                 | Extract first system message    | Move to top-level                                                          |
| **🟠 OpenAI-Specific (Drop)**  |                          |                                 |                                                                            |
| `reasoning_effort`             | ❌ Drop                   | -                               | Reasoning config                                                           |
| `audio`                        | ❌ Drop                   | -                               | Audio input                                                                |
| `modalities`                   | ❌ Drop                   | -                               | Output modalities                                                          |
| `logit_bias`                   | ❌ Drop                   | -                               | Token biasing                                                              |
| `logprobs`                     | ❌ Drop                   | -                               | Log probabilities                                                          |
| `top_logprobs`                 | ❌ Drop                   | -                               | Top log probs                                                              |
| `n`                            | ❌ Drop                   | -                               | Multiple completions (OpenAI-only; use streaming + choice index if needed) |
| `parallel_tool_calls`          | ❌ Drop                   | -                               | Parallel execution                                                         |
| `prediction`                   | ❌ Drop                   | -                               | Prediction API                                                             |
| `store`                        | ❌ Drop                   | -                               | Conversation storage                                                       |
| `stream_options`               | ❌ Drop                   | -                               | Streaming config                                                           |
| `user`                         | ❌ Drop                   | -                               | End-user ID                                                                |
| `web_search_options`           | ❌ Drop                   | -                               | Web search config                                                          |

### Ollama → Holo Requests

| Ollama Field                   | Holo Field          | Transformation               | Notes                    |
|--------------------------------|---------------------|------------------------------|--------------------------|
| **🟢 Direct 1:1**              |                     |                              |                          |
| `model`                        | `model`             | Direct                       | ✅ Required               |
| `messages`                     | `messages`          | Direct                       | Optional (can be empty)  |
| `stream`                       | `stream`            | Direct                       | Optional                 |
| `tools`                        | `tools`             | Direct                       | Optional                 |
| **🟡 Structure Transforms**    |                     |                              |                          |
| `format`                       | `response_format`   | Map to Holo structure        | Optional                 |
| `options.temperature`          | `temperature`       | Extract from options         | Optional                 |
| `options.top_p`                | `top_p`             | Extract from options         | Optional                 |
| `options.top_k`                | `top_k`             | Extract from options         | Optional                 |
| `options.frequency_penalty`    | `frequency_penalty` | Extract from options         | Optional                 |
| `options.presence_penalty`     | `presence_penalty`  | Extract from options         | Optional                 |
| `options.seed`                 | `seed`              | Extract from options         | Optional                 |
| `options.stop`                 | `stop_sequences`    | Extract from options         | Optional                 |
| `options.num_predict`          | `max_tokens`        | Extract from options         | Optional                 |
| **🟡 Simulate in Holo**        |                     |                              |                          |
| System message (role='system') | `system`            | Extract first system message | Move to top-level        |
| **🟣 Ollama-Specific (Drop)**  |                     |                              |                          |
| `keep_alive`                   | ❌ Drop              | -                            | Model lifetime           |
| `options.*` (other)            | ❌ Drop              | -                            | Runtime-specific options |

### Ollama Generate Mode → Holo

| Ollama Generate Field | Holo Field                 | Transformation                                       | Notes                                    |
|-----------------------|----------------------------|------------------------------------------------------|------------------------------------------|
| `model`               | `model`                    | Direct                                               | ✅ Required                               |
| `prompt`              | Synthetic `messages` array | Wrap as `messages: [{role:'user', content: prompt}]` | ✅ Required; cannot coexist with messages |
| `system`              | `system`                   | Direct                                               | Optional                                 |
| `template`            | ❌ Drop                     | -                                                    | Prompt template                          |
| `context`             | ❌ Drop                     | -                                                    | Conversation state                       |
| `raw`                 | ❌ Drop                     | -                                                    | Bypass templating                        |
| `images`              | Transform to content       | Convert to message content                           | Optional                                 |
| `suffix`              | ❌ Drop                     | -                                                    | Completion suffix                        |

**Note on generate mode**: The Ollama provider dispatches to generate vs chat based on `protocol.name` server-side.
The `prompt` is wrapped into a synthetic messages array: `messages: [{role:'user', content: prompt}]`. Tools are NOT
supported in generate mode (chat API only).

---

## Response Mappings

### Claude → Holo Responses

| Claude Field                        | Holo Field                      | Transformation                  | Notes                                   |
|-------------------------------------|---------------------------------|---------------------------------|-----------------------------------------|
| **🟢 Direct 1:1**                   |                                 |                                 |                                         |
| `id`                                | `id`                            | Direct                          | Always present                          |
| `model`                             | `model`                         | Direct                          | Always present                          |
| `role: 'assistant'`                 | `messages[0].role: 'assistant'` | Wrap in array                   | Always 'assistant'                      |
| **🟡 Structure Transforms**         |                                 |                                 |                                         |
| `content[]` (blocks)                | `output[0].content`           | Transform blocks to HoloContent | See Content Mappings                    |
| `stop_reason`                       | `finish_reason`                 | Map reason codes                | See Finish Reason table                 |
| `usage.input_tokens`                | `usage.input_tokens`            | Direct                          | Optional                                |
| `usage.output_tokens`               | `usage.output_tokens`           | Direct                          | Optional                                |
| Computed                            | `usage.total_tokens`            | `input + output`                | Derived                                 |
| `usage.cache_read_input_tokens`     | `usage.cache_read_tokens`       | Direct                          | Optional; see Capability Analysis       |
| `usage.cache_creation_input_tokens` | `usage.cache_write_tokens`      | Direct                          | Optional; see Capability Analysis       |
| `usage.service_tier`                | `service_tier`                  | Promote to top-level            | Optional; also keep in usage if desired |
| **🟡 OpenAI Compatibility**         |                                 |                                 |                                         |
| Wrap response                       | `object: 'chat.completion'`     | Add field                       | For compatibility                       |
| Wrap message                        | `choices[0]`                    | Create choice array             | For compatibility                       |
| **🔵 Claude-Specific (Drop)**       |                                 |                                 |                                         |
| `type: 'message'`                   | ❌ Drop                          | -                               | Response type                           |
| `stop_sequence`                     | ❌ Drop                          | -                               | Actual stop sequence                    |
| `container`                         | ❌ Drop                          | -                               | Container info                          |

### OpenAI → Holo Responses

| OpenAI Field                                | Holo Field                | Transformation                          | Notes                       |
|---------------------------------------------|---------------------------|-----------------------------------------|-----------------------------|
| **🟢 Direct 1:1**                           |                           |                                         |                             |
| `id`                                        | `id`                      | Direct                                  | Always present              |
| `model`                                     | `model`                   | Direct                                  | Always present              |
| `object`                                    | `object`                  | Direct                                  | 'chat.completion'           |
| `created`                                   | `created`                 | Multiply by 1000                        | OpenAI seconds → Holo ms    |
| `service_tier`                              | `service_tier`            | Direct                                  | Optional, top-level         |
| **🟡 Structure Transforms**                 |                           |                                         |                             |
| `choices[0].message`                        | `output[0]`             | Extract first choice                    | Canonical Holo response     |
| `choices[0].finish_reason`                  | `finish_reason`           | Direct                                  | See Finish Reason table     |
| `choices[]`                                 | `choices[]`               | Optional, for OpenAI compatibility only | Not used by core Holo logic |
| `usage.prompt_tokens`                       | `usage.input_tokens`      | Rename                                  | Optional                    |
| `usage.completion_tokens`                   | `usage.output_tokens`     | Rename                                  | Optional                    |
| `usage.total_tokens`                        | `usage.total_tokens`      | Direct                                  | Optional                    |
| `usage.prompt_tokens_details.cached_tokens` | `usage.cache_read_tokens` | Extract                                 | Optional                    |
| **🟠 OpenAI-Specific (Drop)**               |                           |                                         |                             |
| `system_fingerprint`                        | ❌ Drop                    | -                                       | System identifier           |
| `choices[].logprobs`                        | ❌ Drop                    | -                                       | Log probabilities           |
| `choices[].message.refusal`                 | ❌ Drop                    | -                                       | Refusal reason              |
| `choices[].message.function_call`           | ❌ Drop                    | -                                       | Legacy function call        |
| `choices[].message.audio`                   | ❌ Drop                    | -                                       | Audio output                |
| `choices[].message.annotations`             | ❌ Drop                    | -                                       | Content annotations         |

### Ollama → Holo Responses

| Ollama Field                  | Holo Field                  | Transformation                            | Notes                     |
|-------------------------------|-----------------------------|-------------------------------------------|---------------------------|
| **🟢 Direct 1:1**             |                             |                                           |                           |
| `model`                       | `model`                     | Direct                                    | Always present            |
| `message.role`                | `output[0].role`          | Wrap in array                             | Always 'assistant'        |
| `message.content`             | `output[0].content`       | Wrap in array                             | Text content              |
| **🟡 Structure Transforms**   |                             |                                           |                           |
| `created_at`                  | `created`                   | Parse ISO8601 to milliseconds since epoch | Optional                  |
| `done`                        | (not mapped)                | Used only to signal stream completion     | Orchestrator decides done |
| `done_reason`                 | `finish_reason`             | Map reason string ('stop', 'length')      | Optional                  |
| `prompt_eval_count`           | `usage.input_tokens`        | Direct                                    | Optional                  |
| `eval_count`                  | `usage.output_tokens`       | Direct                                    | Optional                  |
| Computed                      | `usage.total_tokens`        | `prompt_eval_count + eval_count`          | Derived                   |
| `total_duration` (ns)         | `usage.timings.total`       | Direct                                    | Optional                  |
| `load_duration` (ns)          | `usage.timings.load`        | Direct                                    | Optional                  |
| `prompt_eval_duration` (ns)   | `usage.timings.prompt_eval` | Direct                                    | Optional                  |
| `eval_duration` (ns)          | `usage.timings.eval`        | Direct                                    | Optional                  |
| **🟡 Generate Mode Only**     |                             |                                           |                           |
| `response`                    | `output[0].content`       | Direct (text)                             | Generate mode             |
| `context`                     | ❌ Drop                      | -                                         | Conversation state        |
| **🟡 OpenAI Compatibility**   |                             |                                           |                           |
| Generate                      | `id`                        | Generate UUID                             | Ollama has no ID          |
| Add                           | `object: 'chat.completion'` | Add field                                 | For compatibility         |
| Wrap message                  | `choices[0]`                | Create choice array                       | For compatibility         |
| **🟣 Ollama-Specific (Drop)** |                             |                                           |                           |
| `done`                        | -                           | Used in mapping                           | Internal field            |

---

## Content Mappings

### Text Content

| Provider | Native Format                                  | Holo Format                  | Notes               |
|----------|------------------------------------------------|------------------------------|---------------------|
| Claude   | `{type:'text', text:string}` or plain `string` | `{type:'text', text:string}` | Normalize to object |
| OpenAI   | `{type:'text', text:string}` or plain `string` | `{type:'text', text:string}` | Direct mapping      |
| Ollama   | Plain `string` in `message.content`            | `{type:'text', text:string}` | Wrap in object      |

### Image Content

| Provider | Native Format                                                               | Holo Format                                | Transformation                |
|----------|-----------------------------------------------------------------------------|--------------------------------------------|-------------------------------|
| Claude   | `{type:'image', source:{type:'url'\|'base64', url\|data, mime?}}`           | `{type:'image', url:string, mime?:string}` | Flatten source                |
| OpenAI   | `{type:'image_url', image_url:{url:string, detail?:'low'\|'high'\|'auto'}}` | `{type:'image', url:string}`               | Drop `detail` (not portable)  |
| Ollama   | `images[]` array (base64/path/URL)                                          | `{type:'image', url:string}`               | Convert to data URI if needed |

### Tool Use (Assistant)

| Provider | Native Format                                                 | Holo Format                                                      | Transformation            |
|----------|---------------------------------------------------------------|------------------------------------------------------------------|---------------------------|
| Claude   | `{type:'tool_use', id, name, input}` in content[]             | `tool_calls:[{id, type:'function', function:{name, arguments}}]` | Embed in message          |
| OpenAI   | `message.tool_calls:[{id, type, function:{name, arguments}}]` | Direct                                                           | Already Holo format       |
| Ollama   | `message.tool_calls:[{function:{name, arguments}}]`           | Add ID if missing                                                | Generate deterministic ID |

### Tool Results

| Provider | Native Format                                                             | Holo Format                            | Transformation            |
|----------|---------------------------------------------------------------------------|----------------------------------------|---------------------------|
| Claude   | User message with `{type:'tool_result', tool_use_id, content, is_error?}` | `{role:'tool', tool_call_id, content}` | Extract from user message |
| OpenAI   | `{role:'tool', tool_call_id, content}`                                    | Direct                                 | Already Holo format       |
| Ollama   | `{role:'tool', content}`                                                  | Add `tool_call_id` if available        | May need linking          |

---

## Tool Mappings

### Tool Definitions

| Provider | Native Format                                                  | Holo Format                        | Transformation                       |
|----------|----------------------------------------------------------------|------------------------------------|--------------------------------------|
| Claude   | `{name, description?, input_schema}`                           | `{name, description?, parameters}` | Rename `input_schema` → `parameters` |
| OpenAI   | `{type:'function', function:{name, description?, parameters}}` | `{name, description?, parameters}` | Unwrap from function                 |
| Ollama   | `{type:'function', function:{name, description?, parameters}}` | `{name, description?, parameters}` | Unwrap from function                 |

### Tool Choice

| Holo Value                | Claude                | OpenAI                               | Ollama | Notes          |
|---------------------------|-----------------------|--------------------------------------|--------|----------------|
| `{type:'auto'}`           | `{type:'auto'}`       | `'auto'` (string)                    | ❌ N/A  | Auto selection |
| `{type:'none'}`           | `{type:'none'}`       | `'none'` (string)                    | ❌ N/A  | Disable tools  |
| `{type:'required'}`       | `{type:'any'}`        | `'required'` (string)                | ❌ N/A  | Must use tool  |
| `{type:'specific', name}` | `{type:'tool', name}` | `{type:'function', function:{name}}` | ❌ N/A  | Specific tool  |

---

## Streaming Mappings

### Streaming Event Types

| Holo Type       | Claude Event                 | OpenAI Delta                  | Ollama                        | Notes               |
|-----------------|------------------------------|-------------------------------|-------------------------------|---------------------|
| `message_start` | `type:'message_start'`       | First chunk with `role`       | First chunk                   | Conversation begins |
| `content_delta` | `type:'content_block_delta'` | `choices[].delta.content`     | Incremental `message.content` | Content updates     |
| `message_delta` | `type:'message_delta'`       | Usage in final chunk          | N/A                           | Metadata updates    |
| `message_stop`  | `type:'message_stop'`        | `choices[].finish_reason` set | `done:true`                   | Stream complete     |

### Streaming Response Structures

| Provider | Structure                   | Key Fields                                   | Holo Mapping          | Raw Event Preservation                  |
|----------|-----------------------------|----------------------------------------------|-----------------------|-----------------------------------------|
| Claude   | `BetaRawMessageStreamEvent` | `type`, `index`, `content_block`, `delta`    | Map by event type     | Store full event in `provider_delta`    |
| OpenAI   | `ChatCompletionChunk`       | `choices[].delta`, `choices[].finish_reason` | Extract delta content | Store full chunk in `provider_delta`    |
| Ollama   | Incremental `ChatResponse`  | `message.content`, `done`                    | Accumulate content    | Store full response in `provider_delta` |

**Critical**: Translators MUST store the full raw provider event in `provider_delta` (not a lean subset) to guarantee
round-trip fidelity and enable provider-specific debugging. This is a normative requirement for third-party plugins.

**Ollama Streaming Completion**:

- `done === true` signals stream completion (orchestrator level)
- `done_reason` maps to Holo `finish_reason` ('stop', 'length', etc.)
- Do NOT map `done` boolean directly to `finish_reason`

---

## Finish Reason Mappings

| Holo Value       | Claude       | OpenAI           | Ollama   | Description                 |
|------------------|--------------|------------------|----------|-----------------------------|
| `stop`           | `end_turn`   | `stop`           | `stop`   | Natural completion          |
| `length`         | `max_tokens` | `length`         | `length` | Hit token limit             |
| `tool_calls`     | `tool_use`   | `tool_calls`     | -        | Tool call required          |
| `content_filter` | `refusal`    | `content_filter` | -        | Content policy violation    |
| `function_call`  | -            | `function_call`  | -        | Legacy OpenAI function call |
| `null`           | -            | `null`           | -        | Streaming in progress       |

---

## Service Tier Mappings

| Holo Value | Claude       | OpenAI       | Ollama | Notes              |
|------------|--------------|--------------|--------|--------------------|
| `standard` | `'standard'` | -            | -      | Claude standard    |
| `priority` | `'priority'` | `'priority'` | -      | High priority      |
| `batch`    | `'batch'`    | -            | -      | Batch processing   |
| `auto`     | -            | `'auto'`     | -      | OpenAI auto-select |
| `default`  | -            | `'default'`  | -      | OpenAI default     |
| `flex`     | -            | `'flex'`     | -      | OpenAI flexible    |
| `scale`    | -            | `'scale'`    | -      | OpenAI scale       |

---

## Implementation Notes

### Request Translation Order

1. **Extract provider-specific fields** first (may need to drop)
2. **Map direct 1:1 fields** (simple renames)
3. **Transform structures** (nested objects, arrays)
4. **Handle special cases** (system messages, tool wrapping)
5. **Validate** against Holo schema

### Response Translation Order

1. **Extract core fields** (id, model, messages)
2. **Map usage statistics** (token counts)
3. **Transform content** (blocks to HoloContent)
4. **Map finish reasons** (provider codes to Holo)
5. **Add compatibility fields** if needed (choices, object type)

### Round-Trip Considerations

- **Lossless core**: Essential fields must survive round-trip
- **Graceful degradation**: Provider-specific features dropped safely
- **ID preservation**: Maintain IDs when present
- **Token accounting**: Preserve usage data when available

---

**Version**: 1.0.0
**Last Updated**: 2025-12-09
