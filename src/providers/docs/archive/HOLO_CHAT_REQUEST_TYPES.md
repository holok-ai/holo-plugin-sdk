# Holo Chat Requests — Unified Request Surface (Claude • OpenAI • Ollama v0.5.15)

> Goal: a single “Holo” request that validates and maps to each provider. Fields are grouped into **Common (All
Providers)**, **Mapped (≥2 Providers)**, and **Provider‑Specific**. “Required/Optional” is specified per provider in *
*Notes**. No blank lines are used between section headers and their rows to preserve table rendering.

| **Holo**                      | **Claude**                              | **OpenAI**                        | **Ollama Chat**             | **Type**      | **Category**      | **Notes**                                                           |
|-------------------------------|-----------------------------------------|-----------------------------------|-----------------------------|---------------|-------------------|---------------------------------------------------------------------|
| **🟢 Common (All Providers)** |                                         |                                   |                             |               |                   |                                                                     |
| `model`                       | `model`                                 | `model`                           | `model`                     | string        | Core              | **Required:** Claude/OpenAI/Ollama                                  |
| `messages`                    | `messages`                              | `messages`                        | `messages` (can be empty)   | array         | Core              | **Required:** Claude/OpenAI; **Optional/empty allowed:** Ollama     |
| `temperature`                 | `temperature`                           | `temperature`                     | `options.temperature`       | number        | Sampling          | Optional (all)                                                      |
| `top_p`                       | `top_p`                                 | `top_p`                           | `options.top_p`             | number        | Sampling          | Optional (all)                                                      |
| `stream`                      | `stream`                                | `stream`                          | `stream`                    | boolean       | Response Control  | Optional (all)                                                      |
| `tools`                       | `tools`                                 | `tools`                           | `tools`                     | array         | Tools             | Optional (all)                                                      |
| **🟡 Mapped (≥ 2 Providers)** |                                         |                                   |                             |               |                   |                                                                     |
| `system`                      | `system` (string/array)                 | ✗ (via messages)                  | ✗ (via messages)            | string        | Core              | Optional; simulate in OpenAI/Ollama via a leading system message    |
| `max_tokens`                  | `max_tokens`                            | `max_tokens`                      | ✗                           | number        | Token Control     | Optional Claude/OpenAI; use `options.num_predict` in Ollama         |
| `max_completion_tokens`       | ✗                                       | `max_completion_tokens`           | ✗                           | number        | Token Control     | Optional OpenAI                                                     |
| `stop_sequences`              | `stop_sequences`                        | `stop` (string/string[])          | `options.stop`              | string[]      | Response Control  | Optional; names differ                                              |
| `response_format`             | ✗                                       | `response_format`                 | `format` (string/object)    | object        | Response Control  | Optional OpenAI/Ollama; emulate in Claude via tool/schema if needed |
| `service_tier`                | `service_tier` ('auto'/'standard_only') | `service_tier` ('auto'/'default') | ✗                           | string        | Response Control  | Optional Claude/OpenAI                                              |
| `tool_choice`                 | `tool_choice`                           | `tool_choice` (string/object)     | ✗                           | object        | Tools             | Optional Claude/OpenAI                                              |
| `top_k`                       | `top_k`                                 | ✗                                 | `options.top_k`             | number        | Sampling          | Optional Claude/Ollama                                              |
| `frequency_penalty`           | ✗                                       | `frequency_penalty`               | `options.frequency_penalty` | number        | Advanced Sampling | Optional OpenAI/Ollama                                              |
| `presence_penalty`            | ✗                                       | `presence_penalty`                | `options.presence_penalty`  | number        | Advanced Sampling | Optional OpenAI/Ollama                                              |
| `seed`                        | ✗                                       | `seed`                            | `options.seed`              | number        | Advanced Sampling | Optional OpenAI/Ollama                                              |
| `metadata`                    | `metadata`                              | `metadata`                        | ✗                           | object        | Metadata          | Optional Claude/OpenAI                                              |
| **🔵 Claude‑Specific**        |                                         |                                   |                             |               |                   |                                                                     |
| `container`                   | `container`                             | ✗                                 | ✗                           | string        | Execution         | Optional; execution container id (beta)                             |
| `thinking`                    | `thinking`                              | ✗                                 | ✗                           | object        | Reasoning         | Optional; enabled/disabled + budgets                                |
| `betas`                       | `betas`                                 | ✗                                 | ✗                           | string[]      | Config            | Optional; feature flags                                             |
| `mcp_servers`                 | `mcp_servers`                           | ✗                                 | ✗                           | array         | Config            | Optional; MCP server defs                                           |
| **🟠 OpenAI‑Specific**        |                                         |                                   |                             |               |                   |                                                                     |
| `reasoning_effort`            | ✗                                       | `reasoning_effort`                | ✗                           | string        | Reasoning         | Optional; 'low'/'medium'/'high'                                     |
| `audio`                       | ✗                                       | `audio`                           | ✗                           | object        | Audio             | Optional (multimodal)                                               |
| `modalities`                  | ✗                                       | `modalities`                      | ✗                           | string[]      | Modalities        | Optional                                                            |
| `logit_bias`                  | ✗                                       | `logit_bias`                      | ✗                           | record        | Sampling          | Optional                                                            |
| `logprobs`                    | ✗                                       | `logprobs`                        | ✗                           | boolean       | Sampling          | Optional                                                            |
| `top_logprobs`                | ✗                                       | `top_logprobs`                    | ✗                           | number        | Sampling          | Optional (1–20)                                                     |
| `n`                           | ✗                                       | `n`                               | ✗                           | number        | Response Control  | Optional; number of choices                                         |
| `parallel_tool_calls`         | ✗                                       | `parallel_tool_calls`             | ✗                           | boolean       | Tools             | Optional; default true                                              |
| `prediction`                  | ✗                                       | `prediction`                      | ✗                           | object        | Prediction        | Optional (if supported)                                             |
| `store`                       | ✗                                       | `store`                           | ✗                           | boolean       | Conversation      | Optional                                                            |
| `stream_options`              | ✗                                       | `stream_options`                  | ✗                           | object        | Streaming         | Optional (e.g., include_usage)                                      |
| `user`                        | ✗                                       | `user`                            | ✗                           | string        | Metadata          | Optional; end‑user id                                               |
| `web_search_options`          | ✗                                       | `web_search_options`              | ✗                           | object        | Web               | Optional                                                            |
| `prompt_cache_key`            | ✗                                       | `prompt_cache_key`                | ✗                           | string        | Caching           | Optional                                                            |
| `safety_identifier`           | ✗                                       | `safety_identifier`               | ✗                           | string        | Safety            | Optional                                                            |
| **🟣 Ollama‑Specific**        |                                         |                                   |                             |               |                   |                                                                     |
| `keep_alive`                  | ✗                                       | ✗                                 | `keep_alive`                | string/number | Runtime           | Optional; model lifetime ("5m", 0)                                  |
| `options`                     | ✗                                       | ✗                                 | `options`                   | object        | Config            | Optional; runtime knobs (e.g., `num_predict`, penalties, gpu)       |

## Holo Generate Request (Ollama Generate‑only)

> Generate mode is **mutually exclusive** with Chat mode. Use when calling `/api/generate` in Ollama; other providers
> don’t implement this mode directly.

| **Holo**     | **Claude** | **OpenAI** | **Ollama Generate** | **Type**              | **Category** | **Notes**                                            |
|--------------|------------|------------|---------------------|-----------------------|--------------|------------------------------------------------------|
| `model`      | ✗          | ✗          | `model` (required)  | string                | Core         | Required                                             |
| `prompt`     | ✗          | ✗          | `prompt` (required) | string                | Core         | Required; cannot be combined with `messages`         |
| `suffix`     | ✗          | ✗          | `suffix`            | string                | Completion   | Optional                                             |
| `system`     | ✗          | ✗          | `system`            | string                | Core         | Optional                                             |
| `template`   | ✗          | ✗          | `template`          | string                | Prompting    | Optional                                             |
| `context`    | ✗          | ✗          | `context`           | number[]              | Memory       | Optional; conversation state ids                     |
| `raw`        | ✗          | ✗          | `raw`               | boolean               | Prompting    | Optional; bypass templating                          |
| `images`     | ✗          | ✗          | `images`            | string[]/Uint8Array[] | Multimodal   | Optional                                             |
| `keep_alive` | ✗          | ✗          | `keep_alive`        | string/number         | Runtime      | Optional                                             |
| `options`    | ✗          | ✗          | `options`           | object                | Config       | Optional; includes `num_predict`, sampling, hardware |

## Holo Message Structure (Requests)

| **Holo Field** | **Claude**   | **OpenAI**     | **Ollama Chat** | **Type**     | **Category** | **Notes**                                                                              |
|----------------|--------------|----------------|-----------------|--------------|--------------|----------------------------------------------------------------------------------------|
| `role`         | `role`       | `role`         | `role`          | string       | Core         | Required on all; OpenAI enum; Ollama is free‑form                                      |
| `content`      | `content`    | `content`      | `content`       | string/array | Core         | Required; Claude supports content blocks; OpenAI allows text/parts; Ollama uses string |
| `name`         | ✗            | `name`         | ✗               | string       | Metadata     | Optional OpenAI                                                                        |
| `tool_calls`   | ✗            | `tool_calls`   | `tool_calls`    | array        | Tools        | Optional OpenAI/Ollama                                                                 |
| `tool_call_id` | ✗            | `tool_call_id` | ✗               | string       | Tools        | Optional OpenAI tool result linking                                                    |
| `images`       | in `content` | in `content`   | `images`        | array        | Multimodal   | Optional; different placement                                                          |
| `audio`        | ✗            | `audio`        | ✗               | object       | Multimodal   | Optional OpenAI                                                                        |

## Holo Tool Definition

| **Holo Field** | **Claude**                   | **OpenAI**                 | **Ollama Chat**            | **Type** | **Category** | **Notes**                                   |
|----------------|------------------------------|----------------------------|----------------------------|----------|--------------|---------------------------------------------|
| `name`         | `name`                       | `name`                     | `name`                     | string   | Tools        | Required                                    |
| `description`  | `description`                | `description`              | `description`              | string   | Tools        | Optional                                    |
| `parameters`   | `input_schema` (JSON Schema) | `parameters` (JSON Schema) | `parameters` (JSON Schema) | object   | Tools        | Optional; schema shape is provider‑specific |
| `type`         | ✗                            | `'function'`               | `'function'`               | string   | Tools        | Required OpenAI/Ollama                      |

## Holo Tool Choice Mapping

| **Holo Value**     | **Claude**                       | **OpenAI**                                         | **Ollama Chat** | **Type**      | **Category** | **Notes**                          |
|--------------------|----------------------------------|----------------------------------------------------|-----------------|---------------|--------------|------------------------------------|
| `'auto'`           | `{ type: 'auto' }`               | `'auto'`                                           | ✗               | string/object | Tools        | OpenAI uses string literal         |
| `'none'`           | `{ type: 'none' }`               | `'none'`                                           | ✗               | string/object | Tools        | Disable tools                      |
| `'required'`       | `{ type: 'any' }`                | `'required'`                                       | ✗               | string/object | Tools        | Claude’s `any` ≈ OpenAI `required` |
| `{ tool: 'func' }` | `{ type: 'tool', name: 'func' }` | `{ type: 'function', function: { name: 'func' } }` | ✗               | object        | Tools        | Select specific tool/function      |

# Holo Content Structure (Messages)

> `messages[].content` in Holo may be a plain `string` (treated as a single `HoloContent.text`) or an array of
`HoloContent` objects (discriminated by `type`).

| **HoloContent.type**                 | **Claude**                                                                 | **OpenAI**                                                                                                                       | **Ollama Chat**                                                      | **Fields**                                                                          | **Notes**                                                                |
|--------------------------------------|----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|-------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| **🟢 Core Content Types**            |                                                                            |                                                                                                                                  |                                                                      |                                                                                     |                                                                          |
| `text`                               | `{ type:'text', text, citations? }` or plain string                        | `messages[].content[]` part `{ type:'text', text }`                                                                              | `messages[].content` string                                          | `text:string`, `citations?:Citation[]`                                              | Citations are Claude-only; serialize inline or drop for others           |
| `image`                              | `{ type:'image', source:{url\|base64, mime} }`                             | `messages[].content[]` part `{ type:'image_url', image_url:{ url:string (https or data URI), detail?:'low'\|'high' \|'auto' } }` | `messages[].images[]` (base64/path/url) + keep any text in `content` | `url:string`, `mime?:string`, `detail?:'low'\|'high' \|'auto'`, `alt_text?:string`  | Normalize to a single `url` (HTTPS or `data:`). `detail` mirrors OpenAI. |
| **🟡 Tool Result & Structured**      |                                                                            |                                                                                                                                  |                                                                      |                                                                                     |                                                                          |
| `tool_result`                        | `{ type:'tool_result', tool_use_id, content?, is_error? }`                 | Separate message `{ role:'tool', tool_call_id, content }`                                                                        | Separate message `{ role:'tool', tool_call_id, content }`            | `tool_call_id:string`, `content:string  \|HoloContent[]`, `is_error?:boolean`       | Required to link to prior tool call                                      |
| `document`                           | `{ type:'document', source:{url \| base64,mime}, title?, context? }`       | ✗ (convert to text/link)                                                                                                         | ✗ (convert to text/link)                                             | `url?:string`, `base64?:string`, `mime?:string`, `title?:string`, `context?:string` | Convert to text summary and/or include link when targeting OpenAI/Ollama |
| **🔵 Claude-Specific (Mirror-Only)** |                                                                            |                                                                                                                                  |                                                                      |                                                                                     |                                                                          |
| `tool_use`                           | `{ type:'tool_use', id, name, input }`                                     | ✗ (declare via `tools`; use `tool_choice` to force)                                                                              | ✗ (declare via `tools`)                                              | `id:string`, `name:string`, `input:any`                                             | Request-time directive; not emitted in OpenAI/Ollama content             |
| `thinking`                           | `{ type:'thinking', thinking, signature }`                                 | ✗                                                                                                                                | ✗                                                                    | `thinking:string`, `signature?:string`                                              | Omit when emitting to other providers                                    |
| `redacted_thinking`                  | `{ type:'redacted_thinking', data }`                                       | ✗                                                                                                                                | ✗                                                                    | `data:string`                                                                       | Omit when emitting to other providers                                    |
| `server_tool_use`                    | `{ type:'server_tool_use', name:'web_search' \| 'code_execution', input }` | ✗                                                                                                                                | ✗                                                                    | `name:string`, `input:any`                                                          | Re-express as declared external tool or precompute results               |
| `search_result`                      | `{ type:'search_result', content[], source, title, citations? }`           | ✗                                                                                                                                | ✗                                                                    | `title?:string`, `source?:string`, `content:any[]`                                  | Serialize to readable text/links for non-Claude targets                  |
| `mcp_tool_use`                       | `{ type:'mcp_tool_use', id, name, server_name, input }`                    | ✗                                                                                                                                | ✗                                                                    | `id:string`, `name:string`, `server_name:string`, `input:any`                       | Treat as generic tool call; keep MCP fields in metadata if needed        |
| `mcp_tool_result`                    | `{ type:'mcp_tool_result', tool_use_id, content }`                         | ✗ (content type)                                                                                                                 | ✗ (content type)                                                     | `tool_call_id:string`, `content:string \| HoloContent[]`                            | Normalize as a `{ role:'tool' }` message for non-Claude                  |

## Holo Content Field Definitions

## HoloContent Type Equivalence (Portable Only)

| **HoloContent.type**       | **Claude**                                      | **OpenAI**                                                            | **Ollama Chat**                                           | **Fields (Portable Only)**                                | **Notes**                                                           |
|----------------------------|-------------------------------------------------|-----------------------------------------------------------------------|-----------------------------------------------------------|-----------------------------------------------------------|---------------------------------------------------------------------|
| **🟢 Core Portable Types** |                                                 |                                                                       |                                                           |                                                           |                                                                     |
| `text`                     | `{ type:'text', text }` or plain string         | `messages[].content[]` part `{ type:'text', text }`                   | `messages[].content` string                               | `text:string`                                             | Citations are **not** portable and thus omitted from Holo           |
| `image`                    | `{ type:'image', source:{ url \| base64 } }`    | `messages[].content[]` part `{ type:'image_url', image_url:{ url } }` | `messages[].images[]` (base64/path/url)                   | `url:string`, `mime?:string`, `alt_text?:string`          | OpenAI’s `image_url.detail` is **OpenAI‑only** → excluded from Holo |
| `tool_result`              | `{ type:'tool_result', tool_use_id, content? }` | Separate message `{ role:'tool', tool_call_id, content }`             | Separate message `{ role:'tool', tool_call_id, content }` | `tool_call_id:string`, `content?:string \| HoloContent[]` | `tool_use_id` ⇄ `tool_call_id` normalization                        |

## HoloContent Field Definitions **with Provider Mappings**

### `text`

| **Holo Field** | **Type** | **Claude Mapping**                              | **OpenAI Mapping** | **Ollama Mapping**            | **Notes**                                         |
|----------------|----------|-------------------------------------------------|--------------------|-------------------------------|---------------------------------------------------|
| `type`         | `'text'` | `type:'text'` (or implicit when sending string) | `type:'text'` part | N/A (whole message is string) | Discriminant; ignored by Ollama                   |
| `text`         | `string` | `text`                                          | `text`             | `content` (entire message)    | Plain text content only (no structured citations) |

### `image`

| **Holo Field** | **Type**            | **Claude Mapping**                                                    | **OpenAI Mapping**               | **Ollama Mapping**                | **Notes**                                                  |
|----------------|---------------------|-----------------------------------------------------------------------|----------------------------------|-----------------------------------|------------------------------------------------------------|
| `type`         | `'image'`           | `type:'image'`                                                        | `type:'image_url'`               | N/A                               | Discriminant                                               |
| `url`          | `string`            | `source:{ type:'base64' \| 'url', data:url }` (choose mode by scheme) | `image_url:{ url }`              | `images[]` append (base64 or URL) | Must be HTTPS or `data:` base64 for OpenAI portability     |
| `mime`         | `string` (optional) | `source.mime`                                                         | ✗                                | ✗                                 | Helpful for base64 payloads; ignored by OpenAI/Ollama      |
| `alt_text`     | `string` (optional) | ✗                                                                     | ✗                                | ✗                                 | Kept in Holo for accessibility; safe to drop when emitting |
| ✗ (excluded)   | —                   | `source.detail` ✗                                                     | `image_url.detail` (OpenAI‑only) | ✗                                 | **Excluded** from Holo to remain portable                  |

### `tool_result`

| **Holo Field** | **Type**                             | **Claude Mapping**           | **OpenAI Mapping**    | **Ollama Mapping**    | **Notes**                                             |
|----------------|--------------------------------------|------------------------------|-----------------------|-----------------------|-------------------------------------------------------|
| `type`         | `'tool_result'`                      | `type:'tool_result'`         | `role:'tool'` message | `role:'tool'` message | Discriminant                                          |
| `tool_call_id` | `string`                             | `tool_use_id`                | `tool_call_id`        | `tool_call_id`        | Required to pair with the original tool call          |
| `content`      | `string \| HoloContent[]` (optional) | `content` (string or blocks) | `content` (string)    | `content` (string)    | If structured, down‑convert to text for OpenAI/Ollama |

## Out‑of‑Scope Fields and Types (Not in Holo)

The following items are **provider‑specific** and intentionally **not translated** by Holo. If you need to preserve
them, carry them in `provider_fields.<provider>`:

- **Claude‑only content types**: `thinking`, `redacted_thinking`, `tool_use` (request directive), `server_tool_use`,
  `search_result`, `mcp_tool_use`, `mcp_tool_result`, `container_upload`
- **OpenAI‑only fields**: `image_url.detail`, logprobs structures in content parts, any audio/vision‑specific extras not
  mirrored elsewhere
- **Citations** (Claude): structured citations on text/doc blocks (can be serialized into text if desired)

## Mapping Guidance

- **Normalization**: Convert Claude `tool_use_id` ⇄ OpenAI/Ollama `tool_call_id` via the unified `tool_call_id` field.
- **Images**: Prefer HTTPS URLs when possible. Base64 `data:` URLs are acceptable for OpenAI and Ollama; include `mime`
  for clarity.
- **Lossy Conversions**: When targeting OpenAI/Ollama, any non‑portable structures in a `tool_result.content` array
  should be flattened/serialized to text.
- **Provider Passthrough**: For any excluded provider‑specific constructs, store under `provider_fields.claude` or
  `provider_fields.openai` and skip translation.

### Implementation Notes

- **Validation:** Use arktype to define `HoloRequest` with all fields optional except `model` and at least one of (
  `messages` or `prompt` in generate mode). Provider validators should **delete undeclared keys** post‑transform.
- **Mutual exclusivity:** `prompt` (generate) **must not** be sent with `messages` (chat).
- **Token limits:** Prefer `max_tokens` (Claude/OpenAI). For Ollama, map to `options.num_predict`.
- **Stop sequences:** Normalize to `stop_sequences` in Holo; map to provider equivalents.
- **System prompts:** If `system` unsupported, inject a leading system message.
- **Parallel tools:** OpenAI’s `parallel_tool_calls` vs Claude’s `{ disable_parallel_tool_use }` inversion—normalize to
  a **Holo boolean** `allow_parallel_tools` and invert for Claude during mapping.
