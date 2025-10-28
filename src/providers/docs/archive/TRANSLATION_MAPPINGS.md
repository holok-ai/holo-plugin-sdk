Here’s the updated **Holo → Claude Mappings** markdown with the refinements we just discussed:

---

# Holo → Claude Mappings (Requests & Responses)

> **Goal:** Translate the portable Holo request/response surface into Claude’s richer message and streaming model while
> preserving functional parity.

## 🟢 Request Mappings (Holo → Claude)

### **Direct 1:1 Mappings**

| Holo Field       | Claude Field     | Notes                      |
|------------------|------------------|----------------------------|
| `model`          | `model`          | ✅ Direct                   |
| `temperature`    | `temperature`    | ✅ Direct                   |
| `top_p`          | `top_p`          | ✅ Direct                   |
| `top_k`          | `top_k`          | ✅ Direct                   |
| `stream`         | `stream`         | ✅ Direct                   |
| `system`         | `system`         | ✅ Direct (string → string) |
| `max_tokens`     | `max_tokens`     | ✅ Direct                   |
| `stop_sequences` | `stop_sequences` | ✅ Direct (already array)   |

### **Structure Transformations**

| Holo Field     | Claude Field   | Transformation Required                                                 |
|----------------|----------------|-------------------------------------------------------------------------|
| `service_tier` | `service_tier` | Map: `'auto'` → `'auto'`, `'standard_only'` → `'standard_only'`         |
| `metadata`     | `metadata`     | Structure: `{user_id}` → `{user_id}` (direct)                           |
| `tools`        | `tools`        | Field rename: `parameters` → `input_schema`                             |
| `tool_choice`  | `tool_choice`  | `{type:'specific',name}` → `{type:'tool',name}`, `'required'` → `'any'` |
| `messages`     | `messages`     | Transform message content & tool calls                                  |

> **Note:** Claude request messages accept only `role: 'user'` and `role: 'assistant'`.  
> To send tool results, create a new `role:'user'` message with a `tool_result` block inside `content`.

### **Complex Message Transformations (Holo → Claude)**

| Holo Message Content     | Claude Content Block                               | Transformation                                 |
|--------------------------|----------------------------------------------------|------------------------------------------------|
| `content: string`        | `content: string`                                  | ✅ Direct                                       |
| `content: HoloContent[]` | `content: ClaudeContentBlockParam[]`               | Transform each item                            |
| `{type:'text',text}`     | `{type:'text',text}`                               | ✅ Direct                                       |
| `{type:'image',url}`     | `{type:'image',source:{type:'url'\|'base64',...}}` | Parse `data:` URI → base64 source or leave URL |

### **Tool Integration**

| Holo Tool Field                    | Claude Content Block                                                       | Transformation                        |
|------------------------------------|----------------------------------------------------------------------------|---------------------------------------|
| `tool_calls[]` (assistant)         | `{type:'tool_use',id,name,input}` (inside content[])                       | Embed as content blocks               |
| `role:'tool',tool_call_id,content` | `role:'user',content:[{type:'tool_result',tool_use_id,content,is_error?}]` | Send tool results as new user message |

### **Fields to Drop (Not Supported by Claude)**

- `response_format`
- `frequency_penalty`
- `presence_penalty`
- `seed`

---
Got it — I’ll revise the language so we consistently use **“Direct”** instead of “Direct copy,” and keep the terminology
consistent across requests and responses.

Here’s the **cleaned-up Claude → Holo mapping doc** with that adjustment:

---

# Claude → Holo Mappings

> **Goal:** Normalize Claude request/response payloads into Holo’s portable surface so downstream code can be
> provider-agnostic. Drop Claude-only fields with no cross-provider equivalent.

---

## 🟢 Request Mappings (Claude → Holo)

### **Direct 1:1 Mappings**

| Claude Field     | Holo Field       | Notes                                     |
|------------------|------------------|-------------------------------------------|
| `model`          | `model`          | ✅ Direct                                  |
| `temperature`    | `temperature`    | ✅ Direct                                  |
| `top_p`          | `top_p`          | ✅ Direct                                  |
| `top_k`          | `top_k`          | ✅ Direct                                  |
| `stream`         | `stream`         | ✅ Direct                                  |
| `system`         | `system`         | Direct (join array into string if needed) |
| `max_tokens`     | `max_tokens`     | ✅ Direct                                  |
| `stop_sequences` | `stop_sequences` | ✅ Direct                                  |

### **Structure Transformations**

| Claude Field                                   | Holo Field                         | Transformation                                                                             |
|------------------------------------------------|------------------------------------|--------------------------------------------------------------------------------------------|
| `service_tier`                                 | `service_tier`                     | Map: `'auto'` → `'auto'`, `'standard_only'` → `'standard_only'`                            |
| `metadata.user_id`                             | `metadata.user_id`                 | Direct mapping                                                                             |
| `tools[].input_schema`                         | `tools[].parameters`               | Rename `input_schema` → `parameters`                                                       |
| `tool_choice`                                  | `tool_choice`                      | Map `{type:'tool',name}` → `{type:'specific',name}`; `{type:'any'}` → `{type: 'required'}` |
| `messages[].content:string`                    | `messages[].content:string`        | Direct                                                                                     |
| `messages[].content:ClaudeContentBlockParam[]` | `messages[].content:HoloContent[]` | Transform each content block into portable HoloContent                                     |
| `content[].tool_use`                           | `messages[].tool_calls[]`          | Convert tool use blocks into HoloToolCall objects                                          |
| `content[].tool_result`                        | `messages[].role:'tool'`           | Convert to tool result messages with `tool_call_id`                                        |

### **Dropped Fields (Claude-Specific)**

| Claude Field      | Holo Handling |
|-------------------|---------------|
| `container`       | ❌ Dropped     |
| `mcp_servers`     | ❌ Dropped     |
| `betas`           | ❌ Dropped     |
| `thinking`        | ❌ Dropped     |
| `cache_control`   | ❌ Dropped     |
| `server_tool_use` | ❌ Dropped     |
| `search_result`   | ❌ Dropped     |

---

## 🟢 Response Mappings (Holo → Claude)

### **Direct 1:1 Mappings**

| Holo Field | Claude Field | Notes    |
|------------|--------------|----------|
| `id`       | `id`         | ✅ Direct |
| `model`    | `model`      | ✅ Direct |

### **Structure Mappings**

| Holo Field               | Claude Field                       | Transformation                                                                                                                                               |
|--------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `messages[0].role`       | `role`                             | Always `'assistant'`                                                                                                                                         |
| `messages[0].content`    | `content`                          | Transform to Claude blocks                                                                                                                                   |
| `messages[0].tool_calls` | `content[]: {type:'tool_use',...}` | Embed as tool_use blocks                                                                                                                                     |
| `finish_reason`          | `stop_reason`                      | Map: `'stop'` → `'end_turn'`, `'length'` → `'max_tokens'`, `'tool_calls'` → `'tool_use'`, `'content_filter'` → `'refusal'`, `'function_call'` → `'tool_use'` |
| `service_tier`           | `usage.service_tier`               | Move to `usage`                                                                                                                                              |

### **Usage Mappings**

| Holo Usage Field     | Claude Usage Field                  | Transformation |
|----------------------|-------------------------------------|----------------|
| `input_tokens`       | `usage.input_tokens`                | ✅ Direct       |
| `output_tokens`      | `usage.output_tokens`               | ✅ Direct       |
| `total_tokens`       | compute from input+output           | ✅ Derived      |
| `cache_read_tokens`  | `usage.cache_read_input_tokens`     | ✅ Direct       |
| `cache_write_tokens` | `usage.cache_creation_input_tokens` | ✅ Direct       |
| `service_tier`       | `usage.service_tier`                | ✅ Direct       |
| `timings`            | (no equivalent)                     | Drop           |

### **Response Structure**

| Holo Response                                 | Claude Response                                                                               | Transformation                                         |
|-----------------------------------------------|-----------------------------------------------------------------------------------------------|--------------------------------------------------------|
| {id, model, messages[], finish_reason, usage} | Non-streaming: {id, type: 'message', role: 'assistant', model, content[], stop_reason, usage} | Flatten messages[0] to top level + add type: 'message' |
| HoloStreamChunk                               | Streaming: {type: 'message_start'/'content_block_delta'/'message_stop', ...}                  | Map to appropriate Claude streaming event type         |

Flatten `messages[0]` into top-level fields and always set `type:'message'`.

### ***Claude Response Type Field**

| Context                | Claude type Field                                                              | Notes                             |
|------------------------|--------------------------------------------------------------------------------|-----------------------------------|
| Non-streaming response | type: 'message'                                                                | Always present on final responses |
| Streaming events       | type: 'message_start', type: 'content_block_delta', type: 'message_stop', etc. | Varies by streaming event         |

### **Content Transformations**

| Holo Message Content | Claude Content Block    | Transformation         |
|----------------------|-------------------------|------------------------|
| `content:string`     | `[{type:'text',text}]`  | Wrap as block          |
| `HoloContent[]`      | Array of blocks         | Transform one-by-one   |
| `tool_calls[]`       | `{type:'tool_use',...}` | Append tool_use blocks |

### **Streaming Mappings**

| Holo Stream Field            | Claude Stream Event          | Transformation        |
|------------------------------|------------------------------|-----------------------|
| `delta.type:'message_start'` | `type:'message_start'`       | ✅ Direct              |
| `delta.type:'content_delta'` | `type:'content_block_delta'` | Map text delta        |
| `delta.type:'message_delta'` | `type:'message_delta'`       | Map usage/stop_reason |
| `delta.type:'message_stop'`  | `type:'message_stop'`        | ✅ Direct              |

---

## 🟢 Response Mappings (Claude → Holo)

### **Direct 1:1 Mappings**

| Claude Field | Holo Field | Notes    |
|--------------|------------|----------|
| `id`         | `id`       | ✅ Direct |
| `model`      | `model`    | ✅ Direct |

### **Structure Mappings**

| Claude Field         | Holo Field                                    | Transformation                                                                                     |
|----------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------|
| `role:'assistant'`   | `messages[0].role:'assistant'`                | Always normalized into first message                                                               |
| `content[]` (text)   | `messages[0].content:string \| HoloContent[]` | Concatenate plain text or map to HoloContent                                                       |
| `content[].tool_use` | `messages[0].tool_calls[]`                    | Map tool use blocks to `HoloToolCall[]`                                                            |
| `stop_reason`        | `finish_reason`                               | Map: `end_turn`→`stop`, `max_tokens`→`length`, `tool_use`→`tool_calls`, `refusal`→`content_filter` |
| `usage.service_tier` | `usage.service_tier`                          | Direct mapping                                                                                     |

### **Usage Mappings**

| Claude Usage Field                  | Holo Usage Field     | Notes    |
|-------------------------------------|----------------------|----------|
| `usage.input_tokens`                | `input_tokens`       | ✅ Direct |
| `usage.output_tokens`               | `output_tokens`      | ✅ Direct |
| `usage.cache_read_input_tokens`     | `cache_read_tokens`  | ✅ Direct |
| `usage.cache_creation_input_tokens` | `cache_write_tokens` | ✅ Direct |
| `usage.service_tier`                | `service_tier`       | ✅ Direct |

### **Streaming Mappings**

| Claude Event Type     | Holo StreamingDelta                   | Notes                         |
|-----------------------|---------------------------------------|-------------------------------|
| `message_start`       | `{type:'message_start'}`              | Direct                        |
| `content_block_start` | `{type:'content_delta'}`              | Initialize content array      |
| `content_block_delta` | `{type:'content_delta', delta:{...}}` | Extract delta text and append |
| `message_delta`       | `{type:'message_delta'}`              | Map usage/stop_reason updates |
| `message_stop`        | `{type:'message_stop'}`               | Direct                        |

### **Dropped Response Fields**

| Claude Field      | Holo Handling |
|-------------------|---------------|
| `citations`       | ❌ Dropped     |
| `thinking`        | ❌ Dropped     |
| `server_tool_use` | ❌ Dropped     |
| `mcp_*`           | ❌ Dropped     |

---

## 🔧 Key Implementation Challenges

- **Flattening & Embedding:** Move Holo’s `tool_calls` array into Claude’s `content[]` blocks when sending, and do the
  inverse when receiving.
- **Role Normalization:** Claude requests only accept `user`/`assistant`. Tool outputs must be converted into `user`
  messages with `tool_result` blocks.
- **Content Block Conversion:** Ensure `string` content is wrapped in `{type:'text'}` and `image` URLs/data URIs are
  parsed into Claude’s `{source}` structure.
- **Streaming Event Handling:** Map Claude’s granular `content_block_*` events to a single `HoloStreamingDelta` per
  event while preserving block `index`.
  generate a **side-by-side Holo ↔ Claude** table (both directions in one table) so you can visually check the
  round-trip symmetry?
