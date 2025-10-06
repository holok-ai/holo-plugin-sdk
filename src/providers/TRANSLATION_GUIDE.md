# Translation Guide

> **Navigation**: [README](README.md) | [Architecture](ARCHITECTURE.md) | [Types](TYPE_REFERENCE.md) | [Streaming](STREAMING_GUIDE.md) | [Implementation](IMPLEMENTATION_GUIDE.md)

---

## Table of Contents

- [Overview](#overview)
- [Translation Principles](#translation-principles)
- [Common Patterns](#common-patterns)
- [Claude ↔ Holo](#claude--holo)
- [OpenAI ↔ Holo](#openai--holo)
- [Ollama ↔ Holo](#ollama--holo)
- [Field Transformation Types](#field-transformation-types)
- [Edge Cases](#edge-cases)

---

## Quick Start Cheat Sheet

**60-second orientation for new engineers:**

### Request Fields (Holo → Provider)

| Holo Field | Claude | OpenAI | Ollama | Notes |
|------------|--------|--------|--------|-------|
| `model` | ✅ Direct | ✅ Direct | ✅ Direct | Required by all |
| `messages` | ✅ Direct | ✅ Direct | ✅ Direct | Array of message objects |
| `system` | ✅ Top-level | ➡️ Inject as message | ✅ Top-level | OpenAI doesn't have top-level system |
| `temperature` | ✅ Direct | ✅ Direct | ➡️ `options.temperature` | Ollama nests in options |
| `top_p` | ✅ Direct | ✅ Direct | ➡️ `options.top_p` | Ollama nests in options |
| `top_k` | ✅ Direct | ❌ Dropped | ➡️ `options.top_k` | OpenAI doesn't support |
| `max_tokens` | ✅ Direct | ✅ Direct | ➡️ `options.num_predict` | Ollama renames + nests |
| `stop_sequences` | ✅ Direct | ➡️ `stop` | ➡️ `options.stop` | OpenAI/Ollama rename |
| `tools` | ✅ `input_schema` | ✅ Wrap in `function` | ✅ OpenAI-style | All support tools (Ollama: chat API only; generate has no tools) |
| `tool_choice` | ✅ Transform type | ✅ Transform type | ❌ Dropped | Ollama doesn't support |
| `response_format` | ❌ Dropped | ✅ Transform | ✅ `format` (string/object) | Claude uses system prompts |

### Response Fields (Provider → Holo)

| Provider Field | Holo Field | Transform |
|----------------|------------|-----------|
| **Claude** |
| `id` | `id` | Direct |
| `role` | `messages[0].role` | Direct |
| `content[]` | `messages[0].content` + `tool_calls` | Extract text + tools |
| `stop_reason` | `finish_reason` | Map: `end_turn`→`stop`, `tool_use`→`tool_calls` |
| `usage.*` | `usage.*` | Rename: `cache_read_input_tokens`→`cache_read_tokens` |
| **OpenAI** |
| `id` | `id` | Direct |
| `choices[0].message` | `messages[0]` | Extract role + content |
| `created` (sec) | `created` (ms) | Multiply by 1000 ⚠️ |
| `finish_reason` | `finish_reason` | Direct mapping |
| `usage.prompt_tokens` | `usage.input_tokens` | Rename |
| **Ollama** |
| `model` | `model` | Direct |
| `message` | `messages[0]` | Direct |
| `created_at` (ISO8601) | `created` (ms) | Parse date ⚠️ |
| `done_reason` | `finish_reason` | Map: `stop`→`stop`, `length`→`length` |
| `prompt_eval_count` | `usage.input_tokens` | Rename |

### Streaming Event Mapping

| Holo Event | Claude | OpenAI | Ollama |
|------------|--------|--------|--------|
| `message_start` | `message_start` | First chunk with `role` | First frame * |
| `content_delta` | `content_block_delta` | `delta.content` | `message.content` (done=false) |
| `message_delta` | `message_delta` | `delta` (usage/tools) | Usage at end (done=true) |
| `message_stop` | `message_stop` | `finish_reason` present | `done: true` |

**\* Note:** Ollama has no explicit `message_start` event; orchestrator emits `message_start` on first frame.

### Common Transformations

| Pattern | Example |
|---------|---------|
| **Rename** | `max_tokens` → `num_predict` (Ollama) |
| **Nest** | `temperature` → `options.temperature` (Ollama) |
| **Inject** | `system` → `messages[0]` (OpenAI) |
| **Transform** | `tool_choice.type:'specific'` → `{type:'tool', name}` (Claude) |
| **Extract** | `content[].tool_use` → `tool_calls[]` (Claude→Holo) |
| **Units** | `created` (sec) → (ms) ⚠️ (OpenAI) |

### Key Differences

- **Claude**: 6 streaming events, tool calls in `content[]`, no timestamps in responses
- **OpenAI**: Multi-choice (n>1), seconds timestamps, tool args as JSON strings
- **Ollama**: Dual mode (chat/generate), options nesting, ISO8601 timestamps, local deployment

---

## Overview

This guide provides **concise mapping tables** for translating between Holo (portable) and provider-specific formats.

### Hub-and-Spoke Model

```
        Claude ←→ Holo ←→ OpenAI
                   ↕
                 Ollama
```

All translations go through **Holo as the central hub** (N translations instead of N²).

### Generate vs Chat Modes

**Understanding the distinction:**

| Mode | Purpose | Message Structure | Example Use Case |
|------|---------|-------------------|------------------|
| **Chat** | Multi-turn dialogue | Full message array with roles (`user`, `assistant`, `system`, `tool`) | Conversation history, tool calling |
| **Generate** | Single-shot completion | Single prompt → single output | Text completion, one-off generation |

**Key Differences:**

**Chat Mode:**
- ✅ Supports message history
- ✅ Role-based messages (user/assistant/system)
- ✅ Tool calling
- ✅ Multimodal content
- **Format**: `HoloRequest.messages[]` → `HoloResponse.messages[0]`

**Generate Mode (Ollama's native API):**
- ✅ Single prompt input
- ✅ Context continuation (via context array)
- ❌ No message history
- ❌ No tool calling
- **Format**: Single string prompt → Single string response
- **Note**: Holo uses chat-shaped messages universally; translators flatten/expand for Ollama's generate endpoint when needed

**In Holo:**
- All requests use `HoloRequest.messages[]` (chat-like structure)
- Responses always return `HoloResponse.messages[0]` with role `'assistant'`
- Generate mode is abstracted: translators convert messages to/from single prompts

### Translation Types

| Type | Description | Example |
|------|-------------|---------|
| **Direct** | Same field name and type | `model` → `model` |
| **Renamed** | Different name, same meaning | `max_tokens` → `num_predict` |
| **Restructured** | Different nesting or shape | `temperature` → `options.temperature` |
| **Transformed** | Logic required | `tool_choice: {type, name}` → `{type:'tool', name}` |
| **Dropped** | Not supported by provider | `top_k` → ❌ (OpenAI) |

---

## Translation Principles

### 1. Lossless Where Possible

Preserve all information that can be represented in both formats.

```typescript
// ✅ Good - preserve all fields
{
    model: source.model,
    temperature: source.temperature,
    top_p: source.top_p
}

// ❌ Bad - lose information
{
    model: source.model
    // Missing temperature, top_p
}
```

### 2. Provider-Specific Fields Stay Provider-Specific

Don't translate fields that have no cross-provider equivalent.

```typescript
// ✅ Good - keep Claude-specific fields
if (request.thinking) {
    claudeRequest.thinking = request.thinking;  // Claude-only
}

// ❌ Bad - try to force into Holo
holoRequest.thinking = source.thinking;  // ❌ Not in Holo spec
```

### 3. Use Defaults for Missing Optional Fields

Apply sensible defaults when translating back to provider format.

```typescript
// Holo → OpenAI
const openaiRequest = {
    model: holoRequest.model,
    messages: holoRequest.messages,
    temperature: holoRequest.temperature ?? 1.0,  // ✅ Default
    top_p: holoRequest.top_p ?? 1.0
};
```

### 4. Validate After Translation

Use validators to ensure translated objects are valid.

```typescript
const translated = translateToHolo(claudeRequest);
const validated = HoloRequestValidator(translated);

if (validated instanceof ArkErrors) {
    throw new Error(`Translation failed: ${validated.summary}`);
}

return validated;
```

---

## Common Patterns

### Pattern 1: Field Renaming

**Simple name change**, same semantics.

```typescript
// Holo → Ollama
{
    max_tokens: holoRequest.max_tokens  // Holo field
}
→
{
    options: {
        num_predict: holoRequest.max_tokens  // Ollama name
    }
}
```

### Pattern 2: Nesting Changes

**Flatten or nest** fields.

```typescript
// Ollama → Holo (flatten)
{
    options: {
        temperature: 0.7,
        top_p: 0.9
    }
}
→
{
    temperature: 0.7,  // Flattened
    top_p: 0.9
}
```

### Pattern 3: Array to Single

**Extract first item** when provider only supports one.

```typescript
// Holo → OpenAI (system via messages)
{
    system: "You are helpful",
    messages: [...]
}
→
{
    messages: [
        { role: 'system', content: "You are helpful" },  // Injected
        ...originalMessages
    ]
}
```

### Pattern 4: Structure Transformation

**Change object shape** while preserving meaning.

```typescript
// Holo → Claude (tool_choice)
{
    tool_choice: {
        type: 'specific',
        name: 'get_weather'
    }
}
→
{
    tool_choice: {
        type: 'tool',
        name: 'get_weather'
    }
}
```

### Pattern 5: Content Structure Mapping

**Transform content arrays** between formats.

```typescript
// Holo → Claude (messages)
{
    role: 'user',
    content: [
        { type: 'text', text: 'Hello' },
        { type: 'image', url: 'https://...' }
    ]
}
→
{
    role: 'user',
    content: [
        { type: 'text', text: 'Hello' },
        { type: 'image', source: { type: 'url', url: 'https://...' } }
    ]
}
```

---

## Claude ↔ Holo

### Request: Holo → Claude

#### Direct Mappings
```typescript
{
    model: holo.model,                      // ✅ Direct
    temperature: holo.temperature,          // ✅ Direct
    top_p: holo.top_p,                      // ✅ Direct
    top_k: holo.top_k,                      // ✅ Direct
    max_tokens: holo.max_tokens,            // ✅ Direct
    stop_sequences: holo.stop_sequences,    // ✅ Direct
    stream: holo.stream,                    // ✅ Direct
    system: holo.system                     // ✅ Direct (string or array)
}
```

#### Transformed Mappings
```typescript
// Messages: transform content blocks
messages: holo.messages.map(msg => ({
    role: msg.role,  // user | assistant (no system, tool)
    content: transformContent(msg.content, msg.tool_calls)
}))

// Tools: rename parameters → input_schema
tools: holo.tools?.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters  // 🔄 Renamed
}))

// Tool choice: map specific → tool
tool_choice: holo.tool_choice?.type === 'specific'
    ? { type: 'tool', name: holo.tool_choice.name }  // 🔄 Transformed
    : holo.tool_choice  // auto (passes through) | Holo 'required' → Claude 'any'
```

#### Dropped Fields
```typescript
// Claude doesn't support:
// - response_format ❌
// - frequency_penalty ❌
// - presence_penalty ❌
// - seed ❌
```

### Response: Claude → Holo

#### Direct Mappings
```typescript
{
    id: claude.id,                          // ✅ Direct
    model: claude.model                     // ✅ Direct
}
```

#### Transformed Mappings
```typescript
// Messages: extract from response
messages: [{
    role: claude.role,  // Always 'assistant'
    content: extractContent(claude.content),  // Transform blocks
    tool_calls: extractToolCalls(claude.content)  // Extract from content[]
}]

// Finish reason: map stop_reason
finish_reason: {
    'end_turn': 'stop',
    'max_tokens': 'length',
    'tool_use': 'tool_calls',
    'stop_sequence': 'stop'
}[claude.stop_reason]

// Usage: map to Holo
usage: {
    input_tokens: claude.usage.input_tokens,
    output_tokens: claude.usage.output_tokens,
    total_tokens: claude.usage.input_tokens + claude.usage.output_tokens,
    cache_read_tokens: claude.usage.cache_read_input_tokens,
    cache_write_tokens: claude.usage.cache_creation_input_tokens,
    service_tier: claude.usage.service_tier
}
```

### Full Round-Trip Example (Claude)

**Input: HoloRequest**
```typescript
{
    model: 'claude-3-5-sonnet-20241022',
    messages: [
        { role: 'user', content: 'What is the weather in NYC?' }
    ],
    system: 'You are a helpful assistant',
    temperature: 0.7,
    max_tokens: 1024,
    tools: [{
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
            type: 'object',
            properties: {
                location: { type: 'string' }
            },
            required: ['location']
        }
    }],
    tool_choice: { type: 'specific', name: 'get_weather' }
}
```

**Translated: Claude Request**
```typescript
{
    model: 'claude-3-5-sonnet-20241022',
    messages: [
        { role: 'user', content: 'What is the weather in NYC?' }
    ],
    system: 'You are a helpful assistant',
    temperature: 0.7,
    max_tokens: 1024,
    tools: [{
        name: 'get_weather',
        description: 'Get weather for a location',
        input_schema: {  // ← Renamed from parameters
            type: 'object',
            properties: {
                location: { type: 'string' }
            },
            required: ['location']
        }
    }],
    tool_choice: { type: 'tool', name: 'get_weather' }  // ← type: 'specific' → 'tool'
}
```

**Claude Response**
```typescript
{
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    model: 'claude-3-5-sonnet-20241022',
    content: [{
        type: 'tool_use',
        id: 'toolu_456',
        name: 'get_weather',
        input: { location: 'NYC' }
    }],
    stop_reason: 'tool_use',
    usage: {
        input_tokens: 100,
        output_tokens: 50
    }
}
```

**Translated: HoloResponse**
```typescript
{
    id: 'msg_123',
    model: 'claude-3-5-sonnet-20241022',
    messages: [{
        role: 'assistant',
        content: '',  // Empty when only tool calls
        tool_calls: [{  // ← Extracted from content[]
            id: 'toolu_456',
            type: 'function',
            function: {
                name: 'get_weather',
                arguments: { location: 'NYC' }
            }
        }]
    }],
    finish_reason: 'tool_calls',  // ← Mapped from 'tool_use'
    usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
    }
}
```

**✅ Round-trip verified**: HoloRequest → Claude Request → Claude Response → HoloResponse

---

## OpenAI ↔ Holo

### Request: Holo → OpenAI

#### Direct Mappings
```typescript
{
    model: holo.model,                      // ✅ Direct
    temperature: holo.temperature,          // ✅ Direct
    top_p: holo.top_p,                      // ✅ Direct
    max_tokens: holo.max_tokens,            // ✅ Direct
    stream: holo.stream,                    // ✅ Direct
    stop: holo.stop_sequences,              // ✅ Direct (renamed)
    frequency_penalty: holo.frequency_penalty,  // ✅ Direct
    presence_penalty: holo.presence_penalty,    // ✅ Direct
    seed: holo.seed                         // ✅ Direct
}
```

#### Transformed Mappings
```typescript
// System: inject as first message
messages: [
    ...(holo.system ? [{ role: 'system', content: holo.system }] : []),
    ...holo.messages
]

// Tools: wrap in function structure
tools: holo.tools?.map(tool => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }
}))

// Tool choice: transform specific
tool_choice: holo.tool_choice?.type === 'specific'
    ? { type: 'function', function: { name: holo.tool_choice.name } }
    : holo.tool_choice  // 'auto' | 'none' | 'required'

// Metadata: user_id only
user: holo.metadata?.user_id

// Response format: transform
response_format: holo.response_format?.type === 'json_schema'
    ? {
        type: 'json_schema',
        json_schema: {
            name: 'holo',
            schema: holo.response_format.schema,
            strict: holo.response_format.strict
        }
    }
    : holo.response_format  // { type: 'json_object' } or undefined
```

#### Dropped Fields
```typescript
// OpenAI doesn't support:
// - top_k ❌
```

### Response: OpenAI → Holo

#### Direct Mappings
```typescript
{
    id: openai.id,                          // ✅ Direct
    model: openai.model,                    // ✅ Direct
    created: openai.created * 1000          // ✅ sec → ms
}
```

#### Transformed Mappings
```typescript
// Messages: extract from choices
messages: [{
    role: openai.choices[0].message.role,
    content: openai.choices[0].message.content,
    tool_calls: openai.choices[0].message.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: {
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)  // 🔄 Parse JSON string
        }
    }))
}]

// Finish reason: map 1:1
finish_reason: {
    'stop': 'stop',
    'length': 'length',
    'tool_calls': 'tool_calls',
    'content_filter': 'content_filter',
    'function_call': 'function_call'  // Rare; legacy function calling
}[openai.choices[0].finish_reason]

// Usage: rename fields
usage: {
    input_tokens: openai.usage.prompt_tokens,
    output_tokens: openai.usage.completion_tokens,
    total_tokens: openai.usage.total_tokens,
    cache_read_tokens: openai.usage.prompt_tokens_details?.cached_tokens
}
```

### Full Round-Trip Example (OpenAI)

**Input: HoloRequest**
```typescript
{
    model: 'gpt-4',
    messages: [
        { role: 'user', content: 'Tell me a joke' }
    ],
    system: 'You are a comedian',
    temperature: 0.9,
    max_tokens: 150
}
```

**Translated: OpenAI Request**
```typescript
{
    model: 'gpt-4',
    messages: [
        { role: 'system', content: 'You are a comedian' },  // ← Injected from system
        { role: 'user', content: 'Tell me a joke' }
    ],
    temperature: 0.9,
    max_tokens: 150
}
```

**OpenAI Response**
```typescript
{
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1234567890,
    model: 'gpt-4',
    choices: [{
        index: 0,
        message: {
            role: 'assistant',
            content: 'Why did the programmer quit? Because they didn\'t get arrays!'
        },
        finish_reason: 'stop'
    }],
    usage: {
        prompt_tokens: 20,
        completion_tokens: 15,
        total_tokens: 35
    }
}
```

**Translated: HoloResponse**
```typescript
{
    id: 'chatcmpl-123',
    model: 'gpt-4',
    created: 1234567890000,  // ← Converted sec → ms
    messages: [{
        role: 'assistant',
        content: 'Why did the programmer quit? Because they didn\'t get arrays!'
    }],
    finish_reason: 'stop',
    usage: {
        input_tokens: 20,  // ← Mapped from prompt_tokens
        output_tokens: 15,  // ← Mapped from completion_tokens
        total_tokens: 35
    }
}
```

**✅ Round-trip verified**: HoloRequest → OpenAI Request → OpenAI Response → HoloResponse

---

## Ollama ↔ Holo

### Request: Holo → Ollama

#### Direct Mappings
```typescript
{
    model: holo.model,                      // ✅ Direct
    messages: holo.messages,                // ✅ Direct (with content flattening)
    stream: holo.stream                     // ✅ Direct
}
```

#### Nested Mappings (options)
```typescript
options: {
    temperature: holo.temperature,          // 🔄 Nested
    top_p: holo.top_p,                      // 🔄 Nested
    top_k: holo.top_k,                      // 🔄 Nested
    num_predict: holo.max_tokens,           // 🔄 Renamed + nested
    stop: holo.stop_sequences,              // 🔄 Nested
    frequency_penalty: holo.frequency_penalty,  // 🔄 Nested
    presence_penalty: holo.presence_penalty,    // 🔄 Nested
    seed: holo.seed                         // 🔄 Nested
}
```

#### Transformed Mappings
```typescript
// System: prefer top-level
system: holo.system  // Or inject as first message if not supported

// Messages: flatten content
messages: holo.messages.map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string'
        ? msg.content
        : msg.content.map(c => c.type === 'text' ? c.text : '').join('\n'),
    images: typeof msg.content !== 'string'
        ? msg.content.filter(c => c.type === 'image').map(c => c.url)
        : undefined
}))

// Tools: OpenAI-style structure
tools: holo.tools?.map(tool => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
    }
}))

// Response format: string or object
format: holo.response_format?.type === 'json_object'
    ? 'json'
    : holo.response_format?.type === 'json_schema'
    ? holo.response_format.schema  // Schema object
    : undefined
```

#### Dropped Fields
```typescript
// Ollama doesn't support:
// - tool_choice ❌
// - service_tier ❌
// - metadata ❌
```

### Response: Ollama → Holo

#### Transformed Mappings
```typescript
// Messages: extract from response
messages: [{
    role: ollama.message.role,
    content: ollama.message.content,
    tool_calls: ollama.message.tool_calls  // If present
}]

// Finish reason: map done_reason
finish_reason: {
    'stop': 'stop',
    'length': 'length'
}[ollama.done_reason]

// Usage: map token fields
usage: {
    input_tokens: ollama.prompt_eval_count,
    output_tokens: ollama.eval_count,
    total_tokens: (ollama.prompt_eval_count || 0) + (ollama.eval_count || 0)
}
```

### Full Round-Trip Example (Ollama - Chat Mode)

**Input: HoloRequest**
```typescript
{
    model: 'llama2',
    messages: [
        { role: 'user', content: 'Explain async/await in JavaScript' }
    ],
    temperature: 0.7,
    max_tokens: 200
}
```

**Translated: Ollama Chat Request**
```typescript
{
    model: 'llama2',
    messages: [
        { role: 'user', content: 'Explain async/await in JavaScript' }
    ],
    options: {  // ← Parameters nested in options
        temperature: 0.7,
        num_predict: 200  // ← max_tokens renamed
    }
}
```

**Ollama Chat Response**
```typescript
{
    model: 'llama2',
    created_at: '2024-01-01T12:00:00Z',
    message: {
        role: 'assistant',
        content: 'async/await is syntactic sugar over Promises...'
    },
    done: true,
    done_reason: 'stop',
    total_duration: 5000000000,  // 5s in nanoseconds
    prompt_eval_count: 25,
    eval_count: 45
}
```

**Translated: HoloResponse**
```typescript
{
    model: 'llama2',
    created: 1704110400000,  // ← Parsed from ISO8601
    messages: [{
        role: 'assistant',
        content: 'async/await is syntactic sugar over Promises...'
    }],
    finish_reason: 'stop',
    usage: {
        input_tokens: 25,  // ← Mapped from prompt_eval_count
        output_tokens: 45,  // ← Mapped from eval_count
        total_tokens: 70   // ← Calculated
    }
}
```

**✅ Round-trip verified**: HoloRequest → Ollama Request → Ollama Response → HoloResponse

---

## Field Transformation Types

### Direct (No Change)

| Field | All Providers |
|-------|--------------|
| `model` | ✅ |
| `stream` | ✅ |

### Renamed (Same Meaning)

| Holo | Claude | OpenAI | Ollama |
|------|--------|--------|--------|
| `max_tokens` | `max_tokens` | `max_tokens` | `options.num_predict` |
| `stop_sequences` | `stop_sequences` | `stop` | `options.stop` |

### Nested (Different Structure)

| Holo (Flat) | Ollama (Nested) |
|-------------|-----------------|
| `temperature` | `options.temperature` |
| `top_p` | `options.top_p` |
| `top_k` | `options.top_k` |
| `frequency_penalty` | `options.frequency_penalty` |
| `presence_penalty` | `options.presence_penalty` |
| `seed` | `options.seed` |

### Transformed (Logic Required)

#### Tool Choice

| Holo | Claude | OpenAI | Ollama |
|------|--------|--------|--------|
| `{type:'specific', name}` | `{type:'tool', name}` | `{type:'function', function:{name}}` | ❌ |
| `{type:'required'}` | `{type:'any'}` * | `'required'` | ❌ |
| `{type:'auto'}` | `{type:'auto'}` | `'auto'` | ❌ |

**\* Note:** Claude's `{type:'any'}` forces a tool call but **not a specific tool**—the model chooses which tool to use. Use Holo `{type:'specific', name}` to target a single tool.

#### Content Blocks

**Holo text+image:**
```typescript
content: [
    { type: 'text', text: 'What is this?' },
    { type: 'image', url: 'https://...' }
]
```

**Claude:**
```typescript
content: [
    { type: 'text', text: 'What is this?' },
    { type: 'image', source: { type: 'url', url: 'https://...' } }
]
```

**OpenAI:**
```typescript
content: [
    { type: 'text', text: 'What is this?' },
    { type: 'image_url', image_url: { url: 'https://...' } }
]
```

**Ollama:**
```typescript
content: 'What is this?',
images: ['https://...']
```

---

## Edge Cases

### Empty Arrays

**Drop vs keep:**
```typescript
// ✅ Good - omit empty arrays
if (holo.tools && holo.tools.length > 0) {
    provider.tools = translateTools(holo.tools);
}

// ❌ Bad - send empty array
provider.tools = holo.tools || [];  // Don't send [] if not needed
```

### System Message Handling

**Claude** - Top-level or array:
```typescript
system: holo.system  // Direct
```

**OpenAI/Ollama** - Inject as message:
```typescript
messages: [
    ...(holo.system ? [{ role: 'system', content: holo.system }] : []),
    ...holo.messages
]
```

### Tool Arguments JSON

**OpenAI** - String:
```typescript
arguments: JSON.stringify(holo.arguments)  // String
```

**Claude** - Object:
```typescript
input: holo.arguments  // Object
```

### Partial Tool Call Arguments (Streaming)

**Problem:** Tool arguments arrive incrementally during streaming and may be incomplete JSON.

**OpenAI:**
- Tool args stream as JSON **strings** via `tool_calls[index].function.arguments`
- **Partial strings** are invalid JSON (e.g., `"{\"location\": \"NY"`)
- **Solution**: Accumulate by `tool_calls[index]` and only parse when valid JSON
- **Implementation**: Use try/catch around `JSON.parse()` or wait for `finish_reason: 'tool_calls'`

**Claude:**
- Tool args stream as **objects** via `input_json_delta` events
- Incremental objects are already parsed (no JSON string handling needed)
- **Solution**: Accumulate by `content[index]` (content block index)
- **Implementation**: Merge deltas into tool call object incrementally

**Ollama:**
- Tool calls typically appear **fully formed** in chat responses
- Partials are uncommon but possible if mimicking OpenAI streaming
- **Solution**: Same as OpenAI—accumulate and validate JSON

**Best Practice:**
```typescript
// OpenAI streaming
const toolCallBuffer: Record<number, string> = {};

for (const chunk of stream) {
    const tc = chunk.choices[0]?.delta?.tool_calls?.[0];
    if (tc) {
        toolCallBuffer[tc.index] = (toolCallBuffer[tc.index] || '') + (tc.function?.arguments || '');

        // Only parse when complete (check finish_reason or try/catch)
        if (chunk.choices[0].finish_reason === 'tool_calls') {
            const args = JSON.parse(toolCallBuffer[tc.index]);
            // Now safe to use args
        }
    }
}
```

### Timestamp Units

**OpenAI/Ollama** - Seconds:
```typescript
created: Math.floor(Date.now() / 1000)  // Seconds
```

**Holo** - Milliseconds:
```typescript
created: Date.now()  // Milliseconds
```

### Guard Failure Responses (Text vs JSON)

**Problem:** When security guards fail, responses must match the expected format (`text` vs `json_object`).

**Text Mode (Default):**
Stream error as normal content with friendly message:

```typescript
// Claude streaming
{ type: 'message_start', message: { id: 'guard-fail', role: 'assistant' } }
{ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
{ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Request blocked: [reasons]' } }
{ type: 'content_block_stop', index: 0 }
{ type: 'message_stop', stop_reason: 'stop' }

// OpenAI streaming
{ choices: [{ index: 0, delta: { role: 'assistant' } }] }
{ choices: [{ index: 0, delta: { content: 'Request blocked: [reasons]' } }] }
{ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }

// Ollama streaming
{ message: { role: 'assistant', content: 'Request blocked: [reasons]' }, done: false }
{ done: true, done_reason: 'stop' }
```

**JSON Mode (`response_format: { type: 'json_object' }`):**
Return structured error object:

```typescript
// Claude (use system prompt to enforce JSON)
{ type: 'content_block_delta', delta: { text: '{"errors": ["Detected PII", "Policy violation"]}' } }

// OpenAI
{ choices: [{ delta: { content: '{"errors": ["Detected PII", "Policy violation"]}' } }] }

// Ollama (format: 'json')
{ message: { content: '{"errors": ["Detected PII", "Policy violation"]}' } }

// Final HoloResponse (after translation)
{
  model: '<provider-model>',
  messages: [{
    role: 'assistant',
    content: '{"errors":["Detected PII","Policy violation"]}'
  }],
  finish_reason: 'stop'
}
```

**See also:** [GUARD_ERRORS.md](GUARD_ERRORS.md) for complete factory implementation.

### Streaming Delta Size Limits

**Important:** Deltas may contain full error payloads or large tool arguments—respect provider HTTP limits.

| Provider | HTTP Limit | Notes |
|----------|------------|-------|
| **Claude** | ~4MB per request/response | Large tool schemas or errors must fit within limit |
| **OpenAI** | ~4MB total HTTP body | Accumulate all chunks; each chunk is typically small |
| **Ollama** | Local transport (no strict limit) | Still respect memory constraints for large responses |

**Best Practices:**
- **JSON Mode**: Prefer structured output for large error objects (OpenAI/Ollama)
- **Content Blocks**: Break large content into multiple blocks (Claude supports this natively)
- **Tool Schemas**: Keep `parameters` schemas concise; use references if needed
- **Large Payloads**: If a single error JSON is >100–200KB, prefer one final non-stream frame or chunk into multiple deltas to avoid proxy buffer issues

### Missing Required Fields

**Warn and use defaults:**
```typescript
const model = holo.model || providerDefaults.model;
if (!model) {
    logger.warn('Model missing; orchestrator should provide via defaults');
}
```

---

## Validation Coverage

### Validator Enforcement Matrix

This table shows which validators enforce field validation at translation time.

| Field | Claude Validator | OpenAI Validator | Ollama Validator | Holo Validator |
|-------|------------------|------------------|------------------|----------------|
| **Request Fields** |
| `model` | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| `messages` | ✅ Required, array | ✅ Required, array | ✅ Required, array | ✅ Required, array |
| `system` | ✅ Optional, string/array | ❌ (injected as message) | ✅ Optional, string | ✅ Optional, string |
| `temperature` | ✅ Optional, 0-1 | ✅ Optional, 0-2 | ✅ Optional, 0-2 | ✅ Optional, 0-2 |
| `top_p` | ✅ Optional, 0-1 | ✅ Optional, 0-1 | ✅ Optional, 0-1 | ✅ Optional, 0-1 |
| `top_k` | ✅ Optional, number | ❌ Not supported | ✅ Optional, number | ✅ Optional, number |
| `max_tokens` | ✅ Optional, number | ✅ Optional, number | ✅ Optional (as num_predict) | ✅ Optional, number |
| `stop_sequences` | ✅ Optional, string[] | ✅ Optional (as stop) | ✅ Optional (as stop) | ✅ Optional, string[] |
| `stream` | ✅ Optional, boolean | ✅ Optional, boolean | ✅ Optional, boolean | ✅ Optional, boolean |
| `tools` | ✅ Optional, array | ✅ Optional, array | ✅ Optional, array | ✅ Optional, array |
| `tool_choice` | ✅ Optional, object | ✅ Optional, object/string | ❌ Not supported | ✅ Optional, object |
| `response_format` | ❌ Not supported | ✅ Optional, object | ✅ Optional (as format) | ✅ Optional, object |
| `frequency_penalty` | ❌ Not supported | ✅ Optional, -2 to 2 | ✅ Optional, 0-2 | ✅ Optional, -2 to 2 |
| `presence_penalty` | ❌ Not supported | ✅ Optional, -2 to 2 | ✅ Optional, 0-2 | ✅ Optional, -2 to 2 |
| `seed` | ❌ Not supported | ✅ Optional, integer | ✅ Optional, integer | ✅ Optional, number |
| **Response Fields** |
| `id` | ✅ Required, string | ✅ Required, string | ❌ Not present | ✅ Optional, string |
| `model` | ✅ Required, string | ✅ Required, string | ✅ Required, string | ✅ Required, string |
| `created` | ❌ Not present | ✅ Provided (seconds) ⚠️ | ✅ Provided (ISO8601 string) ⚠️ | ✅ Optional (ms) ⚠️ |
| `role` | ✅ Required, 'assistant' | ✅ Required, string | ✅ Required, string | ✅ Required, string |
| `content` | ✅ Array of blocks | ✅ String or null | ✅ String | ✅ String or array |
| `tool_calls` | ✅ In content[] | ✅ Separate field | ✅ In message | ✅ Separate field |
| `finish_reason` | ✅ Required (stop_reason) | ✅ Required | ✅ Required (done_reason) | ✅ Optional |
| `usage` | ✅ Required, object | ✅ Required, object | ✅ Optional, scattered | ✅ Optional, object |

### Validator Notes

**⚠️ Timestamp Unit Conversions:**
- **OpenAI**: Returns `created` in **seconds** (Unix epoch); translators convert to **milliseconds** for Holo
- **Ollama**: Returns `created_at` as **ISO8601 string** (e.g., `"2024-01-01T12:00:00Z"`); parser converts to **milliseconds** for Holo
- **Claude**: Does not provide timestamps in responses
- **Holo**: Standardizes on **milliseconds** (`Date.now()`) for consistency

**Service Tier Semantics:**
- `service_tier` in Holo usage is **best-effort** and **provider-specific**
- **OpenAI**: Returns `service_tier` (e.g., `'default'`, `'scale'`)
- **Claude**: Has internal tier concepts but not exposed in responses
- **Ollama**: Not applicable (local deployment)
- **Translators should omit `service_tier` when absent** rather than fabricating defaults
- May be **absent in back-translations** when provider doesn't support it

**Multi-Choice (n>1) Support:**
- **OpenAI**: Supports `n>1` for multiple completions per request
- **Claude/Ollama**: Only support single choice (`n=1`)
- **Holo**: Carries choice indices in `delta.choice` field for streaming
- **Translators**: Drop choice indices for single-choice providers (Claude/Ollama)

### Field Omission Justifications

**Why certain fields are dropped during translation:**

#### Claude → Holo Omissions

| Dropped Field | Justification |
|---------------|---------------|
| `response_format` | Claude lacks explicit JSON schema enforcement; uses system prompts instead |
| `frequency_penalty` | Not supported by Claude API |
| `presence_penalty` | Not supported by Claude API |
| `seed` | Claude doesn't support deterministic sampling |
| `n` (multi-choice) | Claude doesn't support multiple completions per request |

#### OpenAI → Holo Omissions

| Dropped Field | Justification |
|---------------|---------------|
| `top_k` | OpenAI doesn't expose top-k sampling parameter |
| `logit_bias` | OpenAI-specific token manipulation; no cross-provider equivalent |
| `logprobs` | OpenAI-specific probability output; provider-specific feature |
| `user` | OpenAI-specific identifier; mapped from `Holo.metadata.user_id` when present (see [OpenAI Request Translation](#request-holo--openai) § Metadata) |

#### Ollama → Holo Omissions

| Dropped Field | Justification |
|---------------|---------------|
| `tool_choice` | Ollama doesn't support explicit tool choice control |
| `keep_alive` | Ollama-specific memory management; no cross-provider equivalent |
| `options.num_gpu` | Hardware control specific to local deployment |
| `options.main_gpu` | Hardware control specific to local deployment |
| `options.numa` | NUMA optimization specific to local deployment |
| `raw` | Generate-mode formatting flag; mode-specific, not portable |
| `context` | Generate-mode context continuation; not applicable to chat-based Holo |

#### Holo → Provider Omissions

**When translating back to provider formats:**

| Holo Field | Omitted For | Justification |
|------------|-------------|---------------|
| `top_k` | OpenAI | OpenAI API doesn't support top-k sampling |
| `response_format` | Claude | Claude uses system prompt guidance instead of structured output |
| `frequency_penalty` | Claude | Not exposed in Claude API |
| `presence_penalty` | Claude | Not exposed in Claude API |
| `seed` | Claude | Claude doesn't support deterministic sampling |
| `tool_choice` | Ollama | Ollama auto-selects tools; no explicit control |

**General Principle:** Fields are omitted when the target provider has no equivalent capability. This is **by design** to maintain the hub-and-spoke model where Holo is the intersection of common features, not the union.

---

## Provider Version Notes

### API Evolution Tracking

**Claude API**
- **v3.5 (2024-09)** — Introduced `thinking` field for extended reasoning (Claude-specific, not mapped to Holo)
- **v3.5 (2024-06)** — Added `tool_choice.type: 'any'` for required tool use (mapped to Holo `tool_choice.type: 'required'`)
- **v3.0 (2024-03)** — Introduced `system` as array of text/cache blocks (Holo supports string or array)
- **v3.0 (2023-12)** — Added prompt caching with `cache_control` blocks (usage metrics mapped to Holo)

**OpenAI API**
- **v1 (2024-11)** — Added `reasoning_effort` for o1 models (OpenAI-specific, not in Holo)
- **v1 (2024-08)** — Introduced structured outputs with `response_format.json_schema.strict` (fully supported in Holo)
- **v1 (2024-07)** — Added `parallel_tool_calls` flag (OpenAI-specific, not in Holo)
- **v1 (2023-11)** — Released GPT-4 Turbo with JSON mode (`response_format: {type: 'json_object'}` supported in Holo)
- **v1 (2023-06)** — Function calling introduced (mapped to Holo `tools` and `tool_calls`)

**Ollama API**
- **v0.1.40 (2024-08)** — Exposed `num_predict` under `options` (mapped to Holo `max_tokens`)
- **v0.1.30 (2024-06)** — Added tool calling support with OpenAI-compatible format (fully supported in Holo)
- **v0.1.20 (2024-04)** — Introduced `format` field for JSON schema validation (mapped to Holo `response_format`)
- **v0.1.10 (2024-02)** — Added vision/multimodal support (images extracted to separate field in Ollama format)

### Breaking Changes

**Known incompatibilities requiring version-specific handling:**

- **Claude v2 → v3**: `stop_sequences` moved from top-level to request body (handled transparently)
- **OpenAI**: `functions` deprecated in favor of `tools` (use `tools` in Holo, translators handle both)
- **Ollama v0.1.40+**: `options` nesting required for parameters (translators automatically nest/flatten)

### Version Detection

Translators **do not perform version detection**.

**The orchestrator/provider service is responsible for:**
1. Selecting correct API version
2. Providing version-specific defaults
3. Handling version-specific error codes

Translators assume the **latest stable API version** for each provider.

---

## Quick Reference

### "How do I translate field X?"

| Field | Direction | Action |
|-------|-----------|--------|
| `system` | Holo → OpenAI | Inject as first message |
| `max_tokens` | Holo → Ollama | Rename to `options.num_predict` |
| `tool_choice` | Holo → Claude | Transform `{type:'specific'}` → `{type:'tool'}` |
| `arguments` | OpenAI → Holo | Parse JSON string to object |
| `created` | OpenAI → Holo | Multiply by 1000 (sec → ms) |

### "Which provider supports X?"

| Feature | Claude | OpenAI | Ollama |
|---------|--------|--------|--------|
| `top_k` | ✅ | ❌ | ✅ |
| `tool_choice` | ✅ | ✅ | ❌ |
| `response_format` | ❌ | ✅ | ✅ |
| `seed` | ❌ | ✅ | ✅ |
| Multi-choice (n>1) | ❌ | ✅ | ❌ |

---

## Related Documentation

- **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - Complete type definitions
- **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** - Streaming translations
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
