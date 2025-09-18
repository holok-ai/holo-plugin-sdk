# Holo ↔ OpenAI Translation Mappings

> **Goal:** Translate the portable Holo request/response surface into OpenAI’s Chat Completions while preserving parity.

---

## 🟢 Request Mappings (Holo → OpenAI)

### Direct

| Holo Field       | OpenAI Field | Notes |
|------------------|--------------|-------|
| `model`          | `model`      | Direct |
| `temperature`    | `temperature`| Direct |
| `top_p`          | `top_p`      | Direct |
| `stream`         | `stream`     | Direct |
| `max_tokens`     | `max_tokens` | Direct |
| `stop_sequences` | `stop`       | Direct (array→array) |
| `frequency_penalty` | `frequency_penalty` | Direct *(don’t drop; Holo includes it)* |
| `presence_penalty`  | `presence_penalty`  | Direct *(don’t drop; Holo includes it)* |
| `seed`              | `seed`              | Direct *(don’t drop; Holo includes it)* |

### Structure Transformations

| Holo Field     | OpenAI Field | Transformation |
|----------------|--------------|----------------|
| `service_tier` | `service_tier` | Map known: `'auto'`→`'auto'`, `'default'`→`'default'`; else drop |
| `metadata`     | `user`       | `{ user_id }` → `user: string` |
| `tools`        | `tools`      | `{name,description,parameters}` → `{ type:'function', function:{ name, description?, parameters } }` |
| `tool_choice`  | `tool_choice`| `'auto'|'none'|'required'` stay same; `{type:'specific',name}` → `{type:'function', function:{name}}` |
| `messages`     | `messages`   | Transform content parts & tool calls |
| `system`       | `messages[0]`| Inject `{ role:'system', content: system }` as first message |
| `response_format` | `response_format` | Map: `{type:'text'}`→omit; `{type:'json_object'}`→`{type:'json_object'}`; `{type:'json_schema', schema, strict?}`→`{type:'json_schema', json_schema:{name:'holo', schema, strict}}` |

> Note: Holo intentionally **omits** OpenAI’s `image_url.detail` knob. Leave `detail` unset.

### Complex Message Transformations (Holo → OpenAI)

| Holo Message Content     | OpenAI Content                                   | Notes |
|--------------------------|--------------------------------------------------|-------|
| `content: string`        | `content: string`                                | Direct |
| `content: HoloContent[]` | `content: Array<{type:'text'|'image_url',...}>`  | Map each item |
| `{type:'text',text}`     | `{type:'text',text}`                             | Direct |
| `{type:'image',url}`     | `{type:'image_url', image_url:{ url }}`          | No `detail` |

### Tool Integration

| Holo Field                            | OpenAI Field                                                         | Notes |
|--------------------------------------|----------------------------------------------------------------------|-------|
| `assistant.tool_calls[]`             | `choices[0].message.tool_calls[]` (on response) OR request `messages[].tool_calls` | Arguments must be **stringified JSON** |
| `role:'tool', tool_call_id, content` | `role:'tool', tool_call_id, content`                                | Direct |

### Drop (Holo fields with no OpenAI equivalent)

- `top_k` only (others are supported and should **not** be dropped)

---

## 🟢 Response Mappings (Holo → OpenAI)

### Direct

| Holo Field | OpenAI Field | Notes |
|------------|--------------|-------|
| `id`       | `id`         | Direct |
| `model`    | `model`      | Direct |

### Structure

| Holo Field               | OpenAI Field                                   | Transformation |
|--------------------------|------------------------------------------------|----------------|
| `messages[0].role`       | `choices[0].message.role`                      | Always `'assistant'` |
| `messages[0].content`    | `choices[0].message.content`                   | String or `null` if only tool calls |
| `messages[0].tool_calls` | `choices[0].message.tool_calls`                | Stringify arguments |
| `finish_reason`          | `choices[0].finish_reason`                     | `'stop'|'length'|'tool_calls'` map 1:1 |
| `created`                | `created`                                      | Use epoch seconds |
| `service_tier`           | `service_tier`                                 | Top-level passthrough |

### Usage

| Holo Usage Field     | OpenAI Usage Field                           | Notes |
|----------------------|----------------------------------------------|-------|
| `input_tokens`       | `usage.prompt_tokens`                        | Direct |
| `output_tokens`      | `usage.completion_tokens`                    | Direct |
| `total_tokens`       | `usage.total_tokens`                         | Direct |
| `cache_read_tokens`  | `usage.prompt_tokens_details.cached_tokens`  | When present |
| `cache_write_tokens` | —                                            | Drop |
| `service_tier`       | —                                            | Already mapped top-level (don’t copy into `usage`) |

### Response Envelope

| Holo Response                                 | OpenAI Response |
|-----------------------------------------------|-----------------|
| `{id,model,messages[],finish_reason,usage}`   | `{ id, object:'chat.completion', created, model, choices:[{ index:0, message, finish_reason }], usage }` |

### Streaming

| Holo Stream Field            | OpenAI Stream Field                      |
|------------------------------|------------------------------------------|
| `delta.type:'message_start'` | first chunk with `delta.role`            |
| `delta.type:'content_delta'` | `choices[0].delta.content`               |
| `delta.type:'tool_delta'`    | `choices[0].delta.tool_calls[].function.arguments` |
| `delta.type:'message_stop'`  | final `choices[0].finish_reason` chunk   |

---

## 🟢 Response Mappings (OpenAI → Holo)

### Direct

| OpenAI Field | Holo Field |
|--------------|------------|
| `id`         | `id`       |
| `model`      | `model`    |

### Structure

| OpenAI Field                     | Holo Field                                    | Notes |
|----------------------------------|-----------------------------------------------|-------|
| `choices[0].message.role`        | `messages[0].role:'assistant'`                | Normalize |
| `choices[0].message.content`     | `messages[0].content`                         | String or mapped multimodal parts |
| `choices[0].message.tool_calls`  | `messages[0].tool_calls[]`                    | Parse `function.arguments` JSON → object |
| `choices[0].finish_reason`       | `finish_reason`                               | `'stop'|'length'|'tool_calls'` 1:1 |
| `created`                        | `created`                                     | Keep as number or convert upstream |
| `service_tier`                   | `service_tier`                                | Top-level on HoloResponse |

### Usage

| OpenAI Usage Field                          | Holo Usage Field |
|---------------------------------------------|------------------|
| `usage.prompt_tokens`                       | `input_tokens`   |
| `usage.completion_tokens`                   | `output_tokens`  |
| `usage.total_tokens`                        | `total_tokens`   |
| `usage.prompt_tokens_details.cached_tokens` | `cache_read_tokens` |
| —                                           | `cache_write_tokens` (drop) |

### Streaming

| OpenAI Event Piece               | Holo StreamingDelta                |
|----------------------------------|------------------------------------|
| first `delta.role`               | `{ type:'message_start' }`         |
| `delta.content` chunks           | `{ type:'content_delta' }`         |
| `delta.tool_calls` argument deltas| `{ type:'tool_delta' }`           |
| final chunk `finish_reason`      | `{ type:'message_stop' }`          |

### Drop (OpenAI-only)

- `object`
- `system_fingerprint`
- `choices[].index`
- `choices[].logprobs`
- most `usage.*_details.*` (except `cached_tokens`)

---

## 🟢 Request Mappings (OpenAI → Holo)

### Direct

| OpenAI Field  | Holo Field |
|---------------|------------|
| `model`       | `model`    |
| `temperature` | `temperature` |
| `top_p`       | `top_p` |
| `stream`      | `stream` |
| `max_tokens`  | `max_tokens` |
| `stop`        | `stop_sequences` |
| `frequency_penalty` | `frequency_penalty` |
| `presence_penalty`  | `presence_penalty` |
| `seed`              | `seed` |

### Structure

| OpenAI Field                     | Holo Field             | Transformation |
|----------------------------------|------------------------|----------------|
| `service_tier`                   | `service_tier`         | Pass through known values |
| `user`                           | `metadata.user_id`     | `user` → `{ user_id: user }` |
| `tools[].function`               | `tools[]`              | unwrap to `{name,description?,parameters?}` |
| `tool_choice`                    | `tool_choice`          | `{type:'function',function:{name}}` → `{type:'specific',name}`; `'required'|'auto'|'none'` pass through |
| `messages[]` (incl. `system`)    | `messages[]` + `system`| Pull first system message to top-level `system`, leave rest unchanged |
| `response_format`                | `response_format`      | Map `json_object` or `json_schema` (extract `json_schema.schema`, `strict`) |

### Complex Message Transformations (OpenAI → Holo)

| OpenAI Content                   | Holo Content         | Notes |
|----------------------------------|----------------------|-------|
| `content: string`                | `content: string`    | Direct |
| `[{type:'text',text}]`           | `{type:'text',text}` | Direct |
| `[{type:'image_url',image_url}]` | `{type:'image',url}` | `url = image_url.url` |

---

## 🔧 Key Implementation Notes

- **System messages**: Extract/insert to maintain Holo’s top-level `system`.
- **Tool args**: OpenAI requires **stringified** JSON; Holo keeps **objects**.
- **Service tier**: Keep **top-level** on Holo for OpenAI; for Claude you already map to usage.
- **Image detail**: Holo doesn’t carry `image_url.detail`; leave unset when emitting.
- **Choices**: Holo assumes a single assistant result; use `choices[0]`.

---

## 🎯 Round-Trip Compatibility

| Feature | Holo → OpenAI → Holo | OpenAI → Holo → OpenAI |
|---------|----------------------|-------------------------|
| Basic Chat | ✅ | ✅ |
| System Messages | ✅ | ✅ |
| Tool Calls | ✅ | ✅ |
| Multimodal | ✅ (detail lost) | ✅ (detail added as default) |
| Usage Stats | ✅ (granularity may drop) | ✅ |
| Streaming | ✅ | ✅ |

**Known lossiness:** `image_url.detail`; most `usage.*_details.*`.
