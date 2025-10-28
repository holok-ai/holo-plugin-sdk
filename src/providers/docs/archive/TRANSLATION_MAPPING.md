# Ollama ↔ Holo Translation Mapping

This document defines the field mappings between Holo (portable) types and Ollama-specific types for requests.

## 🎯 **Request Translation: HoloRequest ↔ OllamaChatRequest**

### **📋 Field Mapping Table**

| **Holo Field** | **Ollama Field** | **Mapping Type** | **Notes** |
|----------------|------------------|------------------|-----------|
| `model` | `model` | **Direct** | ✅ String |
| `messages[]` | `messages[]` | **Complex** | 🔄 Flatten text to content, hoist images to images[] |
| `system` | `system` | **Direct** | 🎯 Prefer top-level; fallback to leading system message |
| `temperature` | `options.temperature` | **Nested** | 🎛️ Goes into options object |
| `top_p` | `options.top_p` | **Nested** | 🎛️ Goes into options object |
| `top_k` | `options.top_k` | **Nested** | 🎛️ Goes into options object |
| `stream` | `stream` | **Direct** | ✅ Boolean |
| `max_tokens` | `options.num_predict` | **Mapped** | 🔄 Field name change |
| `stop_sequences[]` | `options.stop` | **Mapped** | 🔄 Accepts string or string[] |
| `frequency_penalty` | `options.frequency_penalty` | **Nested** | 🎛️ Goes into options object |
| `presence_penalty` | `options.presence_penalty` | **Nested** | 🎛️ Goes into options object |
| `seed` | `options.seed` | **Nested** | 🎛️ Goes into options object |
| `tools[]` | `tools[]` | **Complex** | 🔄 Use OpenAI-style { type:'function', function:{...} } |
| `tool_choice` | ❌ **N/A** | **Missing** | ⚠️ Not supported in Ollama |
| `response_format` | `format` | **Complex** | 🔄 'text' → omit; 'json_object' → "json"; 'json_schema' → schema object; ignore strict |
| `service_tier` | ❌ **N/A** | **Missing** | ⚠️ Not supported |
| `metadata` | ❌ **N/A** | **Missing** | ⚠️ Not supported |

### **🔄 Complex Field Mappings**

#### **1. Messages: `HoloMessage[] → OllamaMessage[]`**

**Holo Message:**
```typescript
{
  role: 'user' | 'assistant' | 'tool',
  content: string | HoloContent[],
  tool_calls?: HoloToolCall[],
  tool_call_id?: string,
  name?: string
}
```

**Ollama Message:**
```typescript  
{
  role: string,
  content: string,
  images?: (Uint8Array[] | string[]),
  tool_calls?: OllamaToolCall[]
}
```

**Mapping Details:**
- ✅ **Roles**: Pass through (user, assistant, tool)
- 🔄 **Text Content**: 
  - If `content` is string → `content`
  - If `content` is `HoloContent[]` → concatenate `.text` parts with newlines into `content`
- 🔄 **Images**: Collect `HoloContent.image` into `images: string[]` (base64 or URLs). Keep any text alongside in `content`
- ✅ **Tool calls**: `Holo tool_calls[]` → `Ollama tool_calls[]` (OpenAI-style)
- ✅ **Tool results**: `Holo role:'tool' + tool_call_id` → `Ollama role:'tool'` message; include `tool_call_id` if supported

#### **2. Tools: `HoloTool[] → OllamaTool[]`**

**Holo Tool:**
```typescript
{
  name: string,
  description?: string,
  parameters?: Record<string, unknown>
}
```

**Ollama Tool:**
```typescript
{
  type: string,
  function: {
    name?: string,
    description?: string,
    type?: string,
    parameters?: {
      type?: string,
      properties?: Record<string, ToolProperty>,
      required?: string[]
    }
  }
}
```

**Mapping Details:**
- 🔄 **Structure**: `Holo Tool { name, description?, parameters? }` → `Ollama Tool { type:'function', function:{ name, description?, parameters? } }`
- ✅ **Parameters**: Leave parameters JSON Schema as-is
- ✅ **Name/Description**: Direct mapping

#### **3. Response Format: `HoloResponseFormat → format`**

**Holo Response Format:**
```typescript
{ type: 'text' } |
{ type: 'json_object' } |
{ type: 'json_schema', schema: object, strict?: boolean }
```

**Ollama Format:**
```typescript
string | object  // JSON schema object or format string
```

**Mapping:**
- `{ type: 'text' }` → omit `format`
- `{ type: 'json_object' }` → `format: "json"`
- `{ type: 'json_schema', schema: {...} }` → `format: <schema object>` (drop `strict`)

#### **4. Options Mapping: Nested Field Handling**

**Holo → Ollama Options:**
- `temperature` → `options.temperature`
- `top_p` → `options.top_p` 
- `top_k` → `options.top_k`
- `max_tokens` → `options.num_predict`
- `stop_sequences[]` → `options.stop[]`
- `frequency_penalty` → `options.frequency_penalty`
- `presence_penalty` → `options.presence_penalty`
- `seed` → `options.seed`

### **❌ Non-Portable Fields (Ollama-Only)**

These fields exist in `OllamaChatRequest` but are not translated (remain on original request):

| **Ollama Field** | **Type** | **Purpose** |
|------------------|----------|-------------|
| `keep_alive` | `string \| number` | Connection keep-alive duration |
| `options.numa` | `boolean` | NUMA optimization |
| `options.num_ctx` | `number` | Context window size |
| `options.num_batch` | `number` | Batch processing size |
| `options.num_gpu` | `number` | GPU count |
| `options.main_gpu` | `number` | Primary GPU selection |
| `options.low_vram` | `boolean` | Low VRAM mode |
| `options.f16_kv` | `boolean` | FP16 key-value cache |
| `options.logits_all` | `boolean` | Return all logits |
| `options.vocab_only` | `boolean` | Vocabulary only mode |
| `options.use_mmap` | `boolean` | Memory mapping |
| `options.use_mlock` | `boolean` | Memory locking |
| `options.embedding_only` | `boolean` | Embedding only mode |
| `options.num_thread` | `number` | Thread count |
| `options.num_keep` | `number` | Tokens to keep |
| `options.tfs_z` | `number` | TFS sampling parameter |
| `options.typical_p` | `number` | Typical sampling parameter |
| `options.repeat_last_n` | `number` | Repetition lookback |
| `options.repeat_penalty` | `number` | Repetition penalty |
| `options.mirostat` | `number` | Mirostat sampling mode |
| `options.mirostat_tau` | `number` | Mirostat tau parameter |
| `options.mirostat_eta` | `number` | Mirostat eta parameter |
| `options.penalize_newline` | `boolean` | Penalize newlines |

### **🎯 Edge Case Handling**

1. **Mixed Content**: When both text and images exist in a Holo message → text goes to `content`, images go to `images[]`
2. **System Message Priority**: If Holo messages includes a system role message AND Holo has top-level system → prefer top-level system, drop the message to avoid duplicating
3. **Empty Arrays**: 
   - If `stop_sequences` is empty array → omit `options.stop`
   - If `max_tokens` is 0/undefined → omit `options.num_predict`
4. **Tool Calls Without Tools**: If `tool_calls` exists but `tools[]` is empty → send the tools; Ollama needs tools declared to call them
5. **Streaming**: Request flag is direct; event normalization happens in response translator
6. **Tool Results**: Send as `role:'tool'` with `content` (best-effort compatibility)

### **⚠️ Key Limitations**

1. **No Tool Choice Support**: Ollama doesn't support `tool_choice` - all tools are available
2. **No Service Tiers**: Ollama doesn't have service tier concept  
3. **No Metadata**: Ollama doesn't support request metadata
4. **Options Nesting**: Most parameters go into nested `options` object
5. **Content Flattening**: Complex content structures get flattened to string + images

### **🎯 Translation Priorities**

**High Priority (Core Functionality):**
- ✅ Messages with role/content mapping
- ✅ Tools with structure conversion
- ✅ Basic parameters (temperature, top_p, top_k)
- ✅ Response format mapping

**Medium Priority (Enhanced Features):**
- ✅ Options mapping (num_predict, stop, penalties, seed)
- ✅ Image handling in messages
- ✅ System message placement

**Low Priority (Skip for now):**
- ❌ Tool choice (not supported)
- ❌ Service tiers (not supported)  
- ❌ Metadata (not supported)
- ❌ Ollama-specific options (non-portable)

This mapping provides the foundation for implementing Ollama translators using the same FieldTranslator composition pattern used for Claude, with proper handling of Ollama's unique characteristics like options nesting and content flattening.