# Consolidated Field Surface for Ollama Request Types

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **model** | `string` | **Required** | Model identifier (e.g., "llama2", "mistral") |
| **messages** | `Array<OllamaMessage>` | **Required** (Chat mode) | Array of conversation messages |
| **prompt** | `string` | **Required** (Generate mode) | **Generate-only**: Direct prompt input |
| **stream** | `boolean` | Optional | Enable streaming response |
| **format** | `string \| object` | Optional | Response format specification |
| **tools** | `Array<OllamaTool>` | Optional | Available tools/functions |
| **keep_alive** | `string \| number` | Optional | **Ollama-only**: Model keep-alive duration |
| **options** | `OllamaOptions` | Optional | **Ollama-only**: Advanced model configuration |
| **suffix** | `string` | Optional | **Generate-only**: Text to append after generation |
| **system** | `string` | Optional | **Generate-only**: System prompt/instructions |
| **template** | `string` | Optional | **Generate-only**: Custom prompt template |
| **context** | `Array<number>` | Optional | **Generate-only**: Previous conversation context |
| **raw** | `boolean` | Optional | **Generate-only**: Skip prompt formatting |
| **images** | `Array<Uint8Array> \| Array<string>` | Optional | **Generate-only**: Image inputs |

## Message Structure Breakdown

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **role** | `string` | **Required** | Message role (flexible string, not enum) |
| **content** | `string` | **Required** | Message content |
| **images** | `Array<Uint8Array> \| Array<string>` | Optional | Image attachments |
| **tool_calls** | `Array<OllamaToolCall>` | Optional | Tool calls made by assistant |

## Tool Structure Breakdown

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **type** | `string` | **Required** | Tool type (typically "function") |
| **function** | `OllamaToolFunction` | **Required** | Function definition |

### Tool Function Structure

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **name** | `string` | Optional | Function name |
| **description** | `string` | Optional | Function description |
| **type** | `string` | Optional | Function type |
| **parameters** | `OllamaToolParameters` | Optional | Parameter schema |

### Tool Parameters Structure

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **type** | `string` | Optional | Parameter type |
| **$defs** | `unknown` | Optional | Schema definitions |
| **items** | `unknown` | Optional | Array item schema |
| **required** | `Array<string>` | Optional | Required parameter names |
| **properties** | `Record<string, PropertySchema>` | Optional | Parameter definitions |

## Tool Call Structure

| Field | Type | Required/Optional | Notes |
|-------|------|------------------|-------|
| **function** | `{ name: string; arguments: Record<string, unknown> }` | **Required** | Function call details |

## Options Structure (Ollama-Specific Advanced Configuration)

| Field | Type | Purpose |
|-------|------|---------|
| **numa** | `boolean` | NUMA support |
| **num_ctx** | `number` | Context window size |
| **num_batch** | `number` | Batch size for processing |
| **num_gpu** | `number` | Number of GPU layers |
| **main_gpu** | `number` | Main GPU device |
| **low_vram** | `boolean` | Low VRAM mode |
| **f16_kv** | `boolean` | Use float16 for key/value cache |
| **logits_all** | `boolean` | Return logits for all tokens |
| **vocab_only** | `boolean` | Only load vocabulary |
| **use_mmap** | `boolean` | Use memory mapping |
| **use_mlock** | `boolean` | Use memory locking |
| **embedding_only** | `boolean` | Only compute embeddings |
| **num_thread** | `number` | Number of threads |
| **num_keep** | `number` | Number of tokens to keep from prompt |
| **seed** | `number` | Random seed |
| **num_predict** | `number` | Maximum tokens to predict |
| **top_k** | `number` | Top-K sampling |
| **top_p** | `number` | Top-P sampling |
| **tfs_z** | `number` | Tail free sampling |
| **typical_p** | `number` | Typical sampling |
| **repeat_last_n** | `number` | Look back N tokens for repetition |
| **temperature** | `number` | Sampling temperature |
| **repeat_penalty** | `number` | Repetition penalty |
| **presence_penalty** | `number` | Presence penalty |
| **frequency_penalty** | `number` | Frequency penalty |
| **mirostat** | `number` | Mirostat sampling algorithm |
| **mirostat_tau** | `number` | Mirostat target entropy |
| **mirostat_eta** | `number` | Mirostat learning rate |
| **penalize_newline** | `boolean` | Penalize newlines |
| **stop** | `Array<string>` | Stop sequences |

## Request Mode Comparison

### Chat Mode (`ChatRequest`)
- **Primary use**: Multi-turn conversations
- **Required**: `model`, `messages`
- **Message-based**: Uses structured message array
- **Tool support**: Full tool calling capabilities
- **Streaming**: Supported

### Generate Mode (`GenerateRequest`)
- **Primary use**: Single completion requests
- **Required**: `model`, `prompt`
- **Prompt-based**: Direct string input
- **Additional features**: `suffix`, `template`, `context`, `raw`, `images`
- **System support**: Built-in `system` field
- **Streaming**: Supported

## Ollama-Only Features

| Feature | Fields | Purpose |
|---------|--------|---------|
| **Keep Alive** | `string \| number` | Model memory management (e.g., "5m", 300) |
| **Advanced Options** | `OllamaOptions` object | Fine-grained model configuration |
| **Raw Mode** | `boolean` | Skip prompt formatting in generate mode |
| **Context Array** | `Array<number>` | Previous conversation state |
| **Template** | `string` | Custom prompt templates |
| **Flexible Roles** | `string` (not enum) | Any role string allowed |
| **Image Support** | `Uint8Array[] \| string[]` | Direct binary or base64 images |
| **Hardware Control** | GPU layers, NUMA, memory settings | Hardware optimization |

## Default Values

### Chat Mode Defaults
```typescript
{
    stream: true,
    messages: []
}
```

### Generate Mode Defaults
```typescript
{
    stream: false
}
```

## Notes and Caveats

- **Dual Mode Architecture**: Ollama supports both chat and generate modes with different field requirements
- **Flexible Typing**: Roles are strings (not enums), allowing custom role types
- **Hardware Optimization**: Extensive hardware control options for local deployment
- **Keep Alive Management**: Unique model memory management for resource optimization
- **Raw Prompt Mode**: Can bypass prompt formatting for direct model input
- **Context Preservation**: Can maintain conversation context as numeric arrays
- **Local-First Design**: Built for local deployment with hardware-aware features
- **Simple Tool Schema**: Less complex tool definition structure compared to Claude/OpenAI
- **Image Integration**: Direct support for image inputs in generate mode

Key architectural differences from Claude and OpenAI: Ollama's local-first design, dual request modes (chat vs. generate), extensive hardware configuration options, and simpler but more flexible message/tool structures.
