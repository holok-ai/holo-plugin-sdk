# @holokai/sdk Documentation

## Overview

The HoloKai SDK provides a client library for the Holo API and a plugin architecture for building LLM provider
integrations. This documentation covers both the client SDK and the Holo universal format.

---

## Quick Start

```bash
npm install @holokai/sdk
```

```typescript
import {HoloClient} from '@holokai/sdk';

const client = new HoloClient({
    baseUrl: 'https://holo.example.com',
    token: 'my-token',
    defaultModel: 'gpt-4o',
});

// Fluent builder (recommended)
const response = await client.chat.user('Hello!').send();
console.log(response.output);

// Params object
const response2 = await client.chat.create({
    messages: [{role: 'user', content: 'Hello!'}],
});
```

---

## Client SDK

### Construction

```typescript
import {HoloClient} from '@holokai/sdk';

const client = new HoloClient({
    baseUrl: 'https://holo.example.com',
    token: 'my-token',
    defaultModel: 'gpt-4o',           // optional — used when no model is set per-request
    defaultApplication: 'my-app',      // optional — used when no application is set per-request
    fetch: customFetch,                // optional — custom fetch implementation
});
```

### Fluent Builder

The builder API lets you construct requests with chained method calls. Start directly from `client.chat`:

```typescript
// Single user message
const res = await client.chat.user('Summarize this article').send();

// System + user
const res = await client.chat
    .system('You are a helpful assistant.')
    .user('What is the capital of France?')
    .send();

// With parameters
const res = await client.chat
    .model('claude-sonnet-4-20250514')
    .user('Write a haiku about TypeScript')
    .temperature(0.9)
    .maxTokens(100)
    .send();

// Multi-turn conversation
const res = await client.chat
    .user('Remember: my name is Alice')
    .assistant('Got it! Your name is Alice.')
    .user('What is my name?')
    .send();
```

You can also use `client.chat.builder()` to get an empty builder, or start with `.model()`, `.system()`,
`.assistant()`, or `.messages()`.

### Params Object

For programmatic use or when you already have a messages array:

```typescript
const response = await client.chat.create({
    model: 'gpt-4o',
    messages: [
        {role: 'system', content: 'You are a helpful assistant.'},
        {role: 'user', content: 'Hello!'},
    ],
    temperature: 0.7,
    max_tokens: 1000,
});

console.log(response.output);
```

### Streaming

#### Fluent builder

```typescript
const stream = await client.chat
    .user('Tell me a long story')
    .stream();

// Async iteration
for await (const event of stream) {
    if (event.delta?.type === 'content_delta') {
        process.stdout.write(event.delta.delta.content ?? '');
    }
}

// Or use convenience methods
const stream2 = await client.chat.user('Hello').stream();
stream2.on('text', (text) => process.stdout.write(text));
stream2.on('end', (response) => console.log('\nDone:', response.usage));
await stream2.done();

// Collect full text
const stream3 = await client.chat.user('Summarize this').stream();
const fullText = await stream3.text();
```

#### Params object

```typescript
const stream = await client.chat.stream({
    messages: [{role: 'user', content: 'Tell me a story'}],
});

for await (const event of stream) {
    // ...
}
```

### Tool Runner

The tool runner manages agentic loops — it sends a request, executes any tool calls, feeds results back, and repeats
until the model stops calling tools.

```typescript
const runner = client.chat.runner({
    model: 'gpt-4o',
    messages: [{role: 'user', content: 'What is the weather in SF and NYC?'}],
    tools: [
        {
            type: 'function',
            function: {
                name: 'get_weather',
                description: 'Get current weather for a city',
                parameters: {
                    type: 'object',
                    properties: {
                        city: {type: 'string'},
                    },
                    required: ['city'],
                },
            },
        },
    ],
    execute: async (toolCall) => {
        // Called for each tool invocation
        return {content: `Sunny, 72°F in ${toolCall.function.arguments.city}`};
    },
    maxTurns: 5,
});

const response = await runner.run();
```

### Error Handling

```typescript
import {HoloApiError, HoloStreamError, HoloTimeoutError} from '@holokai/sdk';

try {
    const res = await client.chat.user('Hello').send();
} catch (err) {
    if (err instanceof HoloApiError) {
        console.error(`API error ${err.status}: ${err.message}`);
        console.error('Response body:', err.body);
    }
}
```

### Cancellation

```typescript
const response = await client.chat.create({
    messages: [{role: 'user', content: 'Hello'}],
});

// Cancel by request ID
await client.chat.cancel(response.id);
```

### Models & Applications

```typescript
const models = await client.models.list();
const apps = await client.applications.list();
const app = await client.applications.get('my-app');
```

---

## Documentation Structure

### Core Concepts

1. **[Holo Format](./HOLO_FORMAT.md)** - Universal format overview
    - Hub-and-spoke architecture
    - Design principles
    - Core types (HoloRequest, HoloResponse, HoloMessage)
    - Field categories (common, mapped, provider-specific)

2. **[Provider Mappings](./PROVIDER_MAPPINGS.md)** - Detailed field mappings
    - Request mappings (all providers → Holo)
    - Response mappings (all providers → Holo)
    - Content type mappings
    - Tool definition mappings
    - Streaming event mappings

3. **[Capability Analysis](./CAPABILITY_ANALYSIS.md)** - Verification & coverage
    - Complete capability inventory
    - Gap analysis
    - Type safety analysis

---

## Key Concepts

### Hub-and-Spoke Architecture

Holo format serves as the central hub, preventing N² translation complexity:

```
┌─────────┐
│ Claude  │────┐
└─────────┘    │
               │    ┌──────────┐
┌─────────┐    ├───→│   Holo   │←───┐
│ OpenAI  │────┘    │  Format  │    │
└─────────┘         └──────────┘    │
                                    │
┌─────────┐                         │
│ Ollama  │─────────────────────────┘
└─────────┘
```

**Benefits**:

- Add new providers with just 2 translations (to/from Holo)
- Consistent behavior across all providers
- Type-safe portable format
- Graceful degradation for unsupported features

### Field Categories

#### Common (All Providers)

Fields supported by Claude, OpenAI, and Ollama:

- `model`, `messages`, `temperature`, `top_p`, `stream`, `tools`

#### Mapped (≥2 Providers)

Fields with functional equivalents:

- `system`, `max_tokens`, `stop_sequences`, `response_format`, `tool_choice`, etc.

#### Provider-Specific

Fields unique to one provider (intentionally excluded from Holo):

- Claude: `thinking`, `betas`, `mcp_servers`
- OpenAI: `reasoning_effort`, `audio`, `logprobs`, `n`
- Ollama: `keep_alive`, `options`

---

## Provider Support Matrix

| Feature             | Claude | OpenAI | Ollama | Holo Support |
|---------------------|--------|--------|--------|--------------|
| **Basic Chat**      |        |        |        |
| Messages            | ✅      | ✅      | ✅      | ✅            |
| Streaming           | ✅      | ✅      | ✅      | ✅            |
| System prompts      | ✅      | ✅*     | ✅*     | ✅            |
| Temperature         | ✅      | ✅      | ✅      | ✅            |
| Max tokens          | ✅      | ✅      | ✅†     | ✅            |
| **Advanced**        |        |        |        |
| Tools/Functions     | ✅      | ✅      | ✅      | ✅            |
| Vision (images)     | ✅      | ✅      | ✅      | ✅            |
| JSON mode           | ❌      | ✅      | ✅      | ✅            |
| Stop sequences      | ✅      | ✅      | ✅      | ✅            |
| **Sampling**        |        |        |        |
| Top-p               | ✅      | ✅      | ✅      | ✅            |
| Top-k               | ✅      | ❌      | ✅      | ✅            |
| Frequency penalty   | ❌      | ✅      | ✅      | ✅            |
| Presence penalty    | ❌      | ✅      | ✅      | ✅            |
| Seed                | ❌      | ✅      | ✅      | ✅            |
| **Usage Tracking**  |        |        |        |
| Input tokens        | ✅      | ✅      | ✅      | ✅            |
| Output tokens       | ✅      | ✅      | ✅      | ✅            |
| Cache stats         | ✅      | ✅*     | ❌      | ✅            |
| Performance timings | ❌      | ❌      | ✅      | ✅            |

*Simulated or partial support
†Via `options.num_predict`

---

## Common Patterns

### Tool Call Linking

Ensure tool calls and results are properly linked:

```typescript
// Assistant makes tool call
const toolCall: HoloToolCall = {
    id: 'call_abc123',
    type: 'function',
    function: {
        name: 'get_weather',
        arguments: {location: 'SF'}
    }
};

// Tool result references the call
const toolResult: HoloMessage = {
    role: 'tool',
    tool_call_id: 'call_abc123',
    content: 'Sunny, 72°F'
};
```

### Content Type Normalization

Always normalize text to objects:

```typescript
const input: string | HoloContent[] = 'Hello';

const normalized: HoloContent[] = typeof input === 'string'
    ? [{type: 'text', text: input}]
    : input;
```

---

## Type Safety

### Strict Typing

Holo format uses strict TypeScript types:

```typescript
// Properly typed arguments
export interface HoloFunctionArguments {
    [key: string]: string | number | boolean | null
        | HoloFunctionArguments
        | HoloFunctionArguments[];
}

// Proper JSON Schema
export interface HoloJsonSchema {
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: { [key: string]: HoloJsonSchema };
    // ... full spec
}
```

### Runtime Validation

Use ArkType validators at boundaries:

```typescript
import {validateHoloRequest} from '@holokai/sdk/validators';

const result = validateHoloRequest(untrustedInput);
if (result.problems) {
    throw new Error(`Invalid request: ${result.problems}`);
}

const safeRequest: HoloRequest = result.data;
```

---

## Adding a New Provider

1. Study provider's API documentation
2. Create mapping tables (see [PROVIDER_MAPPINGS.md](./PROVIDER_MAPPINGS.md))
3. Implement `toHolo()` and `fromHolo()` functions
4. Add unit tests for all field mappings
5. Add integration tests with real SDK
6. Update documentation

---

## Resources

### Internal Documentation

- [Holo Format](./HOLO_FORMAT.md) - Format specification
- [Provider Mappings](./PROVIDER_MAPPINGS.md) - Translation tables
- [Capability Analysis](./CAPABILITY_ANALYSIS.md) - Coverage verification

### Provider Documentation

- [Claude API](https://docs.anthropic.com/claude/reference/messages_post)
- [OpenAI API](https://platform.openai.com/docs/api-reference/chat)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
