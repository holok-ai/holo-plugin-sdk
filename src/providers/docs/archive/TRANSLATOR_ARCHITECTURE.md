# Translator Architecture

This document explains the translation architecture used throughout the provider translation system to convert between Holo (portable) types and provider-specific types.

## 🏗️ **Core Architecture**

All translations use the `BaseStreamTranslator` class which provides:

1. **Stateless Translation** - No state tracking between calls
2. **Bidirectional Translation** - Both `toHolo` and `fromHolo` directions
3. **Validator Integration** - Input/output validation with ArkType
4. **providerDefaults** - Orchestrator-injected defaults for model/id/metadata

This unified architecture works for both streaming and non-streaming translations.

---

## 🌊 **BaseStreamTranslator Architecture**

All translators extend `BaseStreamTranslator<HoloType, ProviderType>` for consistent, stateless translation.

### **Key Components**

| Component | Purpose | Example |
|-----------|---------|---------|
| `BaseStreamTranslator<HoloType, ProviderType>` | Base class for all translations | `OpenAIMessageStopTranslator` |
| `toHoloManyImpl()` | Provider → Holo transformation (returns array) | Convert OpenAI chunk to Holo events |
| `fromHoloManyImpl()` | Holo → Provider transformation (returns array) | Convert Holo event to OpenAI chunks |
| **Validators** | Input/output validation using ArkType | `HoloStreamChunkValidator`, `OpenAIChatCompletionChunkValidator` |
| **providerDefaults** | Orchestrator-injected defaults | `{ model: 'gpt-4', id: uuidv4() }` |

### **Base Class Structure**

```typescript
@injectable()
export class ProviderEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ProviderEventType> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ProviderEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ProviderEventType> = {};

    constructor() {
        super();
    }

    protected async toHoloManyImpl(source: ProviderEventType): Promise<Partial<HoloStreamChunk>[]> {
        // Provider → Holo (stateless)
        // Returns array to support per-choice emission
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderEventType>[]> {
        // Holo → Provider (stateless)
        // Fast pass-through check for same-provider streaming
    }
}
```

---

## 🎯 **Key Principles**

1. **Stateless Translators** - No state tracking between calls
2. **1:1 Event Mapping** - Each provider event maps to exactly one Holo event
3. **Lossless Round-Tripping** - Preserve raw events in `provider_delta`
4. **Per-Choice Emission** - Support multi-choice streams (n>1)
5. **Bidirectional by Design** - Always implement both `toHolo` and `fromHolo`

---

## 📋 **Translator Types**

### **For Streaming**

| Translator Type | Purpose | Example |
|----------------|---------|---------|
| **Message Start** | First chunk with role | `OpenAIMessageStartTranslator` |
| **Content Delta** | Incremental text content | `OpenAIContentDeltaTranslator` |
| **Message Delta** | Tool calls, usage, metadata | `OpenAIMessageDeltaTranslator` |
| **Message Stop** | Finish reason and completion | `OpenAIMessageStopTranslator` |
| **Orchestrator** | Routes events to sub-translators | `OpenAIStreamTranslator` |

### **For Request/Response**

| Translator Type | Purpose | Example |
|----------------|---------|---------|
| **Request** | Translate request objects | `ClaudeRequestTranslator` |
| **Response** | Translate response objects | `ClaudeResponseTranslator` |
| **Message** | Translate message arrays | `OpenAIMessageTranslator` |
| **Tool** | Translate tool definitions | `ClaudeToolTranslator` |

---

## 🎨 **Key Patterns**

### **1. Per-Choice Event Emission**

For multi-choice support (n>1), emit one event per choice:

```typescript
protected async toHoloManyImpl(source: ProviderChunk): Promise<Partial<HoloStreamChunk>[]> {
    const results: Partial<HoloStreamChunk>[] = [];

    // Emit one event per choice
    for (const choice of source.choices) {
        if (!choice.finish_reason) continue;

        const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0
            ? choice.index : 0;

        results.push(pickDefined({
            id: source.id,
            model: source.model,
            created: source.created * 1000, // sec → ms
            delta: {
                provider: 'openai' as const,
                type: 'message_stop' as const,
                choice: choiceIndex,
                delta: {},
                provider_delta: source // Full raw chunk
            },
            finish_reason: this.mapFinishReason(choice.finish_reason)
        }));
    }

    return results;
}
```

### **2. Fast Pass-Through**

For same-provider streaming, validate and pass through directly:

```typescript
protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderChunk>[]> {
    const d = source.delta;
    if (!d || d.type !== 'expected_type') return [];

    // Fast pass-through if we already have a provider chunk
    if (d.provider === 'openai' && d.provider_delta) {
        const validated = this.providerValidator(d.provider_delta);
        if (!(validated instanceof ArkErrors)) {
            return [validated];
        }
    }

    // Otherwise reconstruct chunk...
}
```

### **3. providerDefaults Usage**

Orchestrator injects defaults before translation:

```typescript
// Orchestrator sets defaults
translator.providerDefaults = {
    id: uuidv4(),
    model: 'gpt-4',
    system_fingerprint: 'fp_123',
    service_tier: 'default'
};

// Translator uses defaults when reconstructing
const id = source.id || this.providerDefaults.id || uuidv4();
const model = source.model || this.providerDefaults.model;

if (!model) {
    const logger = this.mlog(this.fromHoloManyImpl);
    logger.warn('Translator: model missing; orchestrator should supply via providerDefaults');
}
```

### **4. Timestamp Conversion**

Always convert between provider units and Holo milliseconds:

```typescript
// Provider → Holo (sec → ms for OpenAI/Ollama)
created: source.created * 1000

// Holo → Provider (ms → sec)
created: source.created
    ? Math.floor(source.created / 1000)
    : Math.floor(Date.now() / 1000)
```

### **5. Streaming JSON Parsing**

For tool call arguments that stream as JSON fragments:

```typescript
// Parse tool call arguments with safeParse
const rawArgs = tc.function?.arguments;
const parsedArgs = safeParse(rawArgs);
const isPartialJson = rawArgs && Object.keys(parsedArgs).length === 0;

if (!isPartialJson) {
    // Emit complete tool call with parsed arguments
    results.push({
        delta: {
            type: 'message_delta',
            delta: {
                tool_calls: [{
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.function?.name,
                        arguments: parsedArgs // Parsed object
                    }
                }]
            },
            provider_delta: source
        }
    });
} else {
    // Emit shell event for partial JSON
    results.push({
        delta: {
            type: 'message_delta',
            delta: {}, // Empty delta
            provider_delta: source // Full chunk for accumulation
        }
    });
}
```

---

## 💡 **Design Benefits**

| Benefit | Description |
|---------|-------------|
| **Modularity** | Each translator is independent and testable |
| **Validation** | Built-in input/output validation with meaningful error messages |
| **Extensibility** | Easy to add new translators without changing existing code |
| **Consistency** | Uniform interface across all translators |
| **Type Safety** | Full TypeScript support with runtime validation |
| **Lossless** | Full raw chunks preserved in `provider_delta` |
| **Stateless** | No instance state - easy to reason about and test |

---

## 📝 **Implementation Guidelines**

### **Always**

1. **Stateless** - No instance variables tracking state between calls
2. **Preserve `provider_delta`** - Store full raw chunk (not lean subsets)
3. **Validate choice index** - Use `Number.isInteger()` checks
4. **Convert timestamps** - Match provider's time units ↔ Holo ms
5. **Support per-choice** - Emit one event per choice when applicable
6. **Use `pickDefined()`** - Clean undefined optional fields
7. **Add logging** - Use `this.mlog(methodName)` for debugging
8. **Fast pass-through** - Validate `provider_delta` for same-provider streaming

### **Never**

1. **Trim whitespace** - Content is semantically meaningful
2. **Fabricate defaults** - Use `providerDefaults` or return `null`
3. **Set `done` flag** - Let orchestrator decide
4. **Create lean `provider_delta`** - Always store full source
5. **Invent finish_reason defaults** - Return `null` for unknown
6. **Skip partial data** - Emit shell events with `provider_delta`
7. **Use `as any`** - Let validators enforce contracts

---

## 🔍 **Testing**

### **Testing Translators**

```typescript
test('OpenAIMessageStopTranslator toHolo', async () => {
    const chunk: OpenAIChatCompletionChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop'
        }]
    };

    const translator = new OpenAIMessageStopTranslator();
    const result = await translator.toHoloMany(chunk);

    expect(result).toHaveLength(1);
    expect(result[0].delta?.type).toBe('message_stop');
    expect(result[0].delta?.choice).toBe(0);
    expect(result[0].finish_reason).toBe('stop');
    expect(result[0].created).toBe(1234567890000); // ms
    expect(result[0].delta?.provider_delta).toEqual(chunk);
});
```

### **Testing Round-Trip**

```typescript
test('OpenAI round-trip fidelity', async () => {
    const original: OpenAIChatCompletionChunk = /* ... */;

    // Provider → Holo
    const holoEvents = await translator.toHoloMany(original);

    // Holo → Provider (with pass-through)
    const reconstructed = await translator.fromHoloMany(holoEvents[0]);

    expect(reconstructed[0]).toEqual(original);
});
```

### **Testing Multi-Choice**

```typescript
test('Multi-choice emission (n>1)', async () => {
    const chunk: OpenAIChatCompletionChunk = {
        id: 'chatcmpl-123',
        choices: [
            { index: 0, delta: { role: 'assistant' }, finish_reason: null },
            { index: 1, delta: { role: 'assistant' }, finish_reason: null }
        ],
        /* ... */
    };

    const result = await translator.toHoloMany(chunk);

    expect(result).toHaveLength(2);
    expect(result[0].delta?.choice).toBe(0);
    expect(result[1].delta?.choice).toBe(1);
});
```

---

## 📚 **Documentation Structure**

For detailed implementation guidance, see:

- **[TRANSLATOR_METHODOLOGY.md](./TRANSLATOR_METHODOLOGY.md)** - Step-by-step guide for implementing stream translators
- **Provider STREAM_RESPONSE.md** - Provider-specific streaming event documentation

---

This unified `BaseStreamTranslator` architecture provides a robust, extensible foundation for all provider translations while maintaining type safety, statelessness, and clear separation of concerns.
