# @holokai/sdk Documentation

## Overview

The HoloKai SDK provides a universal format and plugin architecture for building LLM provider integrations. This
documentation covers the Holo universal format, provider mappings, and implementation guidance.

---

## Quick Start

```bash
npm install @holokai/sdk
```

```typescript
import type {HoloRequest, HoloResponse} from '@holokai/sdk';

// Use Holo types in your plugin
const request: HoloRequest = {
    model: 'gpt-4',
    messages: [
        {role: 'user', content: 'Hello!'}
    ],
    temperature: 0.7,
    max_tokens: 1000
};
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
    - Comprehensive transformation tables

3. **[Capability Analysis](./CAPABILITY_ANALYSIS.md)** - Verification & coverage
    - Complete capability inventory
    - Gap analysis (none found!)
    - Type safety analysis
    - Recommendations

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

#### 🟢 Common (All Providers)

Fields supported by Claude, OpenAI, and Ollama:

- `model`, `messages`, `temperature`, `top_p`, `stream`, `tools`

#### 🟡 Mapped (≥2 Providers)

Fields with functional equivalents:

- `system`, `max_tokens`, `stop_sequences`, `response_format`, `tool_choice`, etc.

#### 🔵 Provider-Specific

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

## Translation Examples

### Example 1: OpenAI → Holo → Claude

```typescript
// OpenAI Request
const openaiRequest = {
    model: 'gpt-4',
    messages: [
        {role: 'system', content: 'You are helpful.'},
        {role: 'user', content: 'Hello!'}
    ],
    max_tokens: 1000,
    temperature: 0.7
};

// → Holo (extract system message)
const holoRequest: HoloRequest = {
    model: 'gpt-4',
    system: 'You are helpful.', // Extracted from messages
    messages: [
        {role: 'user', content: 'Hello!'}
    ],
    max_tokens: 1000,
    temperature: 0.7
};

// → Claude (system is top-level)
const claudeRequest = {
    model: 'claude-3-5-sonnet-20241022',
    system: 'You are helpful.', // Direct mapping
    messages: [
        {role: 'user', content: 'Hello!'}
    ],
    max_tokens: 1000,
    temperature: 0.7
};
```

### Example 2: Claude → Holo → Ollama

```typescript
// Claude Response
const claudeResponse = {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    content: [{type: 'text', text: 'Hello!'}],
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: 'end_turn',
    usage: {
        input_tokens: 10,
        output_tokens: 5
    }
};

// → Holo (normalize structure)
const holoResponse: HoloResponse = {
    id: 'msg_123',
    model: 'claude-3-5-sonnet-20241022',
    output: [{
        role: 'assistant',
        content: 'Hello!' // Flatten text blocks
    }],
    finish_reason: 'stop', // Map end_turn → stop
    usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15 // Derived
    }
};

// → Ollama (different structure)
const ollamaResponse = {
    model: 'llama2',
    created_at: '2025-12-09T12:00:00Z',
    message: {
        role: 'assistant',
        content: 'Hello!' // Direct text
    },
    done: true,
    prompt_eval_count: 10, // input_tokens
    eval_count: 5 // output_tokens
};
```

---

## Common Patterns

### Handling Missing IDs

Ollama doesn't provide response IDs. Generate them:

```typescript
import {randomUUID} from 'crypto';

const holoResponse: HoloResponse = {
    id: ollamaResponse.id ?? randomUUID(), // Generate if missing
    model: ollamaResponse.model,
    output: [/* ... */]
};
```

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
    tool_call_id: 'call_abc123', // Links to above
    content: 'Sunny, 72°F'
};
```

### Content Type Normalization

Always normalize text to objects:

```typescript
// Input (may be string or object)
const input: string | HoloContent[] = 'Hello';

// Normalize to array
const normalized: HoloContent[] = typeof input === 'string'
    ? [{type: 'text', text: input}]
    : input;
```

### Streaming Accumulation

Accumulate streaming deltas:

```typescript
let fullContent = '';
let usage: HoloUsage | undefined;

for await (const chunk of stream) {
    if (chunk.delta?.type === 'content_delta') {
        fullContent += chunk.delta.delta.content ?? '';
    }
    if (chunk.usage) {
        usage = chunk.usage;
    }
}

const finalResponse: HoloResponse = {
    id: 'msg_123',
    model: 'gpt-4',
    output: [{
        role: 'assistant',
        content: fullContent
    }],
    finish_reason: 'stop',
    usage
};
```

---

## Type Safety

### Strict Typing

Holo format uses strict TypeScript types:

```typescript
// ✅ Properly typed arguments
export interface HoloFunctionArguments {
    [key: string]: string | number | boolean | null
        | HoloFunctionArguments
        | HoloFunctionArguments[];
}

// ✅ Proper JSON Schema
export interface HoloJsonSchema {
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: { [key: string]: HoloJsonSchema };
    // ... full spec
}

// ❌ Avoid flexible types
// DON'T: parameters?: Record<string, unknown>
// DO: parameters?: HoloJsonSchema
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

## Best Practices

### 1. Validate at Boundaries

Always validate external data before using as Holo format:

```typescript
// External API request
const externalData = await fetchFromAPI();

// Validate before treating as HoloRequest
const validated = validateHoloRequest(externalData);
if (!validated.ok) throw new Error('Invalid format');

const holoRequest: HoloRequest = validated.data;
```

### 2. Preserve IDs

Maintain request/response IDs when present:

```typescript
// Keep provider IDs when available
const holoResponse: HoloResponse = {
    id: providerResponse.id ?? generateId(),
    // ... rest
};
```

### 3. Map Finish Reasons

Use the standard finish reason mappings:

```typescript
function mapFinishReason(
    claudeReason: string
): HoloFinishReason {
    const mapping: Record<string, HoloFinishReason> = {
        'end_turn': 'stop',
        'max_tokens': 'length',
        'tool_use': 'tool_calls',
        'refusal': 'content_filter'
    };
    return mapping[claudeReason] ?? 'stop';
}
```

### 4. Handle Tool Choice Formats

Different providers use different tool choice formats:

```typescript
// Holo to Claude
if (holo.tool_choice?.type === 'specific') {
    claude.tool_choice = {
        type: 'tool',
        name: holo.tool_choice.name
    };
}

// Holo to OpenAI
if (holo.tool_choice?.type === 'specific') {
    openai.tool_choice = {
        type: 'function',
        function: {name: holo.tool_choice.name}
    };
}
```

### 5. Gracefully Drop Unsupported Fields

Provider-specific fields should be safely ignored:

```typescript
// When translating to Holo, drop provider-specific fields
function toHolo(claudeRequest: ClaudeRequest): HoloRequest {
    return {
        model: claudeRequest.model,
        messages: claudeRequest.messages,
        // ... map supported fields
        // ❌ DON'T include: thinking, betas, mcp_servers
    };
}
```

---

## Testing

### Unit Tests

Test individual translations:

```typescript
import {toHolo, fromHolo} from './translator';

describe('Claude → Holo translation', () => {
    it('should map basic request', () => {
        const claude = {
            model: 'claude-3-5-sonnet-20241022',
            messages: [{role: 'user', content: 'Hi'}],
            max_tokens: 100
        };

        const holo = toHolo(claude);

        expect(holo).toEqual({
            model: 'claude-3-5-sonnet-20241022',
            messages: [{role: 'user', content: 'Hi'}],
            max_tokens: 100
        });
    });
});
```

### Round-Trip Tests

Verify lossless translations:

```typescript
it('should preserve core fields in round-trip', () => {
    const original: HoloRequest = {
        model: 'gpt-4',
        messages: [{role: 'user', content: 'Test'}],
        temperature: 0.7,
        max_tokens: 100
    };

    const openai = fromHolo(original);
    const roundTrip = toHolo(openai);

    expect(roundTrip).toEqual(original);
});
```

### Integration Tests

Test with real provider SDKs:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import {toHolo} from './claude-translator';

it('should handle real Claude response', async () => {
    const claude = new Anthropic({apiKey: 'test'});

    const response = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{role: 'user', content: 'Hi'}],
        max_tokens: 10
    });

    const holo = toHolo(response);

    expect(holo.model).toBe('claude-3-5-sonnet-20241022');
    expect(holo.output[0].role).toBe('assistant');
});
```

---

## FAQ

### Q: Why not just use OpenAI's format?

**A**: OpenAI's format doesn't cover Claude-specific features like:

- Cache control
- Service tiers
- Tool result error states
- Content block structure

Holo format is a true superset that handles all portable features.

### Q: How do I handle provider-specific features?

**A**: Use provider-specific plugins that extend beyond Holo:

```typescript
interface ClaudeExtendedRequest extends HoloRequest {
    claude_specific?: {
        thinking?: ClaudeThinkingConfig;
        betas?: string[];
    };
}
```

### Q: What about streaming?

**A**: Holo provides normalized streaming events. See [Provider Mappings](./PROVIDER_MAPPINGS.md#streaming-mappings) for
details.

### Q: Can I add custom fields?

**A**: Yes, but keep them separate:

```typescript
interface MyCustomRequest extends HoloRequest {
    custom_fields?: {
        my_feature?: string;
    };
}
```

### Q: How do I migrate from legacy types?

**A**: Import from SDK and update type annotations:

```typescript
// Before
import {HoloRequest} from '../types/holo';

// After
import type {HoloRequest} from '@holokai/sdk';
```

---

## Contributing

### Adding a New Provider

1. Study provider's API documentation
2. Create mapping tables (see [PROVIDER_MAPPINGS.md](./PROVIDER_MAPPINGS.md))
3. Implement `toHolo()` and `fromHolo()` functions
4. Add unit tests for all field mappings
5. Add integration tests with real SDK
6. Update documentation

### Reporting Issues

Found a gap in the Holo format? Open an issue with:

- Provider name and feature
- Example API request/response
- Why it's portable (≥2 providers)

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

### SDK Reference

- [TypeScript Types](../src/holo/types.ts) - Type definitions
- [Plugin Guide](../README.md#plugins) - Building plugins

---

**Version**: 1.0.0
**Last Updated**: 2025-12-09
