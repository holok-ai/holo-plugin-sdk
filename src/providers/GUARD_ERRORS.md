# Guard Failure Error Response Design

> **Navigation**: [README](README.md) | [Architecture](ARCHITECTURE.md) | [Types](TYPE_REFERENCE.md) | [Streaming](STREAMING_GUIDE.md)

---

## Overview

When requests fail **pre-execution guard checks** (e.g., PII detection, profanity, policy violations), the system provides a **synthetic error response** that looks indistinguishable from a provider's natural streaming output.

### Design Goals

- **Statelessness** – Clients don't need to special-case errors
- **Losslessness** – Round-tripping between providers preserves fidelity
- **Uniformity** – All providers receive equivalent responses
- **Transparency** – Errors look like normal responses

---

## Canonical Holo Format

All guard-failure responses use the standard **HoloStreamChunk sequence**:

### Text Response
```
message_start → content_delta → message_stop
```

### JSON Response
```
message_start → content_delta (JSON string) → message_stop
```

### Rules

1. **MUST include** `message_start` and `message_stop`
2. **MUST wrap** error message in `content_delta`
3. **SHOULD send** entire error as one delta (no artificial chunking)
4. **MAY embed** structured JSON (stringified) if `response_format = json`

---

## HoloStreamChunk Examples

### Text Error Response

```jsonc
// 1. message_start
{
  "id": "err-guard-123",
  "model": "guard-checker",
  "delta": {
    "type": "message_start",
    "provider": "holo",
    "delta": { "role": "assistant" }
  }
}

// 2. content_delta (entire error message)
{
  "id": "err-guard-123",
  "model": "guard-checker",
  "delta": {
    "type": "content_delta",
    "provider": "holo",
    "delta": {
      "content": "We were unable to process your request due to failing security checks."
    }
  }
}

// 3. message_stop
{
  "id": "err-guard-123",
  "model": "guard-checker",
  "delta": {
    "type": "message_stop",
    "provider": "holo",
    "delta": {}
  },
  "finish_reason": "stop"
}
```

### JSON Error Response

```jsonc
// 1. message_start
{
  "id": "err-guard-124",
  "model": "guard-checker",
  "delta": {
    "type": "message_start",
    "provider": "holo",
    "delta": { "role": "assistant" }
  }
}

// 2. content_delta (stringified JSON)
{
  "id": "err-guard-124",
  "model": "guard-checker",
  "delta": {
    "type": "content_delta",
    "provider": "holo",
    "delta": {
      "content": "{\"error\":\"Request failed guard checks\",\"guards\":[{\"name\":\"PII_Detector\",\"errors\":[\"Detected SSN-like pattern\"]}]}"
    }
  }
}

// 3. message_stop
{
  "id": "err-guard-124",
  "model": "guard-checker",
  "delta": {
    "type": "message_stop",
    "provider": "holo",
    "delta": {}
  },
  "finish_reason": "stop"
}
```

---

## Error vs Normal Response Comparison

### Text Responses

| Stage | Normal Response | Guard Error Response |
|-------|----------------|---------------------|
| **message_start** | `role: assistant` | `role: assistant` ← Same |
| **content_delta** | `"Sure, here's the answer: 42."` | `"We were unable to process your request due to failing security checks."` |
| **message_stop** | `finish_reason: stop` | `finish_reason: stop` ← Same |

### JSON Responses

| Stage | Normal Response | Guard Error Response |
|-------|----------------|---------------------|
| **message_start** | `role: assistant` | `role: assistant` ← Same |
| **content_delta** | `{"result": 42}` | `{"error": "Request failed guard checks", "guards": [...]}` |
| **message_stop** | `finish_reason: stop` | `finish_reason: stop` ← Same |

### Key Insight

- **Structurally identical** – Same streaming primitives
- **Semantically different** – Answer vs error in content
- **No special handling** – Clients consume both the same way

---

## Provider Translation

### Claude

**Required events:**
```
message_start
→ content_block_start (index: 0, type: 'text')
→ content_block_delta (text: "error message")
→ content_block_stop (index: 0)
→ message_stop
```

**JSON handling:** Stringified inside content block

### OpenAI

**Required chunks:**
```
chunk { delta: { role: "assistant" } }         → message_start
chunk { delta: { content: "error message" } }  → content_delta
chunk { finish_reason: "stop" } }              → message_stop
```

**JSON handling:** Stringified in delta.content

### Ollama

**Required frames:**
```
{ response: "error message", done: false }     → content_delta
{ response: "", done: true }                   → message_stop
```

**JSON handling:** Stringified in response field

---

## Implementation

### Error Response Factory

```typescript
import { HoloStreamChunk } from './types';
import { uuidv4 } from './utils';

export function createGuardErrorResponse(
    errorMessage: string,
    options?: {
        responseFormat?: 'text' | 'json';
        guardDetails?: Array<{ name: string; errors: string[] }>;
    }
): HoloStreamChunk[] {
    const id = `err-guard-${uuidv4()}`;
    const model = 'guard-checker';

    // Determine content based on format
    const content = options?.responseFormat === 'json'
        ? JSON.stringify({
              error: errorMessage,
              guards: options.guardDetails || []
          })
        : errorMessage;

    return [
        // 1. message_start
        {
            id,
            model,
            delta: {
                provider: 'holo' as const,
                type: 'message_start' as const,
                delta: {
                    role: 'assistant' as const
                }
            }
        },
        // 2. content_delta (entire error)
        {
            id,
            model,
            delta: {
                provider: 'holo' as const,
                type: 'content_delta' as const,
                delta: {
                    content
                }
            }
        },
        // 3. message_stop
        {
            id,
            model,
            delta: {
                provider: 'holo' as const,
                type: 'message_stop' as const,
                delta: {}
            },
            finish_reason: 'stop' as const
        }
    ];
}
```

### Usage Example

```typescript
// Text error
const chunks = createGuardErrorResponse(
    'We were unable to process your request due to failing security checks.'
);

// JSON error with details
const jsonChunks = createGuardErrorResponse(
    'Request failed guard checks',
    {
        responseFormat: 'json',
        guardDetails: [
            {
                name: 'PII_Detector',
                errors: ['Detected SSN-like pattern']
            },
            {
                name: 'ProfanityFilter',
                errors: ['Detected offensive language']
            }
        ]
    }
);

// Stream to client
for (const chunk of chunks) {
    await sendStreamChunk(chunk);
}
```

### Guard Integration Pattern

```typescript
async function handleRequest(request: HoloRequest): AsyncIterator<HoloStreamChunk> {
    // Run pre-execution guards
    const guardResult = await runGuards(request);

    if (!guardResult.passed) {
        // Return error response as Holo stream
        const errorChunks = createGuardErrorResponse(
            'Request failed security checks',
            {
                responseFormat: request.response_format?.type || 'text',
                guardDetails: guardResult.failures
            }
        );

        // Translate to provider format
        const translator = getProviderTranslator(request.provider);
        for (const chunk of errorChunks) {
            const providerChunks = await translator.fromHoloMany(chunk);
            for (const providerChunk of providerChunks) {
                yield providerChunk;
            }
        }

        return;
    }

    // Normal flow - forward to provider
    // ...
}
```

---

## Provider-Specific Examples

### Claude Error Response

```typescript
// Holo chunks translated to Claude events
[
    {
        type: 'message_start',
        message: {
            id: 'msg_err123',
            role: 'assistant',
            content: [],
            model: 'guard-checker',
            stop_reason: null,
            usage: { input_tokens: 0, output_tokens: 0 }
        }
    },
    {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' }
    },
    {
        type: 'content_block_delta',
        index: 0,
        delta: {
            type: 'text_delta',
            text: 'We were unable to process your request due to failing security checks.'
        }
    },
    {
        type: 'content_block_stop',
        index: 0
    },
    {
        type: 'message_stop'
    }
]
```

### OpenAI Error Response

```typescript
// Holo chunks translated to OpenAI chunks
[
    {
        id: 'chatcmpl-err123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'guard-checker',
        choices: [{
            index: 0,
            delta: { role: 'assistant' },
            finish_reason: null
        }]
    },
    {
        id: 'chatcmpl-err123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'guard-checker',
        choices: [{
            index: 0,
            delta: {
                content: 'We were unable to process your request due to failing security checks.'
            },
            finish_reason: null
        }]
    },
    {
        id: 'chatcmpl-err123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'guard-checker',
        choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
        }]
    }
]
```

### Ollama Error Response

```typescript
// Holo chunks translated to Ollama frames
[
    {
        model: 'guard-checker',
        created_at: '2024-01-01T00:00:00Z',
        message: {
            role: 'assistant',
            content: 'We were unable to process your request due to failing security checks.'
        },
        done: false
    },
    {
        model: 'guard-checker',
        created_at: '2024-01-01T00:00:01Z',
        message: {
            role: 'assistant',
            content: ''
        },
        done: true,
        done_reason: 'stop'
    }
]
```

---

## Design Benefits

| Benefit | Description |
|---------|-------------|
| **Uniform Interface** | Clients handle all responses identically |
| **Provider Agnostic** | Works across Claude, OpenAI, Ollama |
| **Stateless** | No context needed - fully self-contained |
| **Type Safe** | Uses standard Holo types |
| **Testable** | Easy to unit test guard responses |
| **Auditable** | Clear error messages with details |

---

## Best Practices

### Error Messages

1. **Be specific** - Explain which guard(s) failed
2. **Be actionable** - Suggest how to fix (if appropriate)
3. **Be consistent** - Use same format across all guards
4. **Respect format** - Honor `response_format` (text/json)

### Guard Details (JSON Mode)

```typescript
{
    error: "Request failed guard checks",
    guards: [
        {
            name: "PII_Detector",
            errors: [
                "Detected SSN-like pattern",
                "Detected credit card number"
            ]
        },
        {
            name: "ProfanityFilter",
            errors: ["Detected offensive language"]
        }
    ],
    // Optional: helpful context
    suggestions: [
        "Remove personally identifiable information",
        "Rephrase your request without profanity"
    ]
}
```

### Testing

```typescript
describe('Guard Error Responses', () => {
    test('creates valid Holo stream', () => {
        const chunks = createGuardErrorResponse('Test error');

        expect(chunks).toHaveLength(3);
        expect(chunks[0].delta?.type).toBe('message_start');
        expect(chunks[1].delta?.type).toBe('content_delta');
        expect(chunks[2].delta?.type).toBe('message_stop');
        expect(chunks[2].finish_reason).toBe('stop');
    });

    test('translates to Claude correctly', async () => {
        const chunks = createGuardErrorResponse('Test error');
        const translator = new ClaudeStreamTranslator();

        const claudeEvents = [];
        for (const chunk of chunks) {
            const events = await translator.fromHoloMany(chunk);
            claudeEvents.push(...events);
        }

        expect(claudeEvents[0].type).toBe('message_start');
        expect(claudeEvents[claudeEvents.length - 1].type).toBe('message_stop');
    });
});
```

---

## Related Documentation

- **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** - Streaming architecture and patterns
- **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - HoloStreamChunk type definition
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design principles

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
