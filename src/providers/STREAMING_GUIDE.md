# Streaming Architecture Guide

> **Navigation**: [README](README.md) | [Architecture](ARCHITECTURE.md) | [Types](TYPE_REFERENCE.md) | [Translation](TRANSLATION_GUIDE.md) | [Implementation](IMPLEMENTATION_GUIDE.md)

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Event Lifecycle](#event-lifecycle)
- [Provider Comparison](#provider-comparison)
- [Implementation Patterns](#implementation-patterns)
- [Provider-Specific Details](#provider-specific-details)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

---

## Overview

All streaming translators follow a **stateless, event-driven architecture** that converts provider-specific streaming formats into the unified **Holo streaming format**.

### Streaming Architecture

```
Provider Stream → Event Translator → Holo Stream → Client
     ↓                  ↓                 ↓
  Chunks           Stateless         Normalized
  Events           Mapping           Events
  Frames
```

### Key Principles

1. **Stateless Translators** - No state between calls
2. **1→N Mapping** - One provider chunk → 0-N Holo events
3. **Lossless** - Preserve raw events in `provider_delta`
4. **Per-Choice Emission** - Support multi-choice (OpenAI n>1)
5. **Tool Fragment Handling** - Accumulate JSON fragments

---

## Core Concepts

### Stateless Translation

Every translator processes **one chunk at a time** with no memory of previous chunks.

**Why stateless?**
- ✅ Parallelizable
- ✅ Testable
- ✅ No race conditions
- ✅ Composable

**Where state lives:**
- Orchestrator layer (minimal - Claude only)
- Client accumulation (tool arguments)

### HoloStreamChunk Structure

```typescript
{
  id?: string;              // Stream identifier
  model: string;            // Model being used
  created?: number;         // Timestamp (milliseconds)
  delta?: {
    provider: 'claude' | 'openai' | 'ollama' | 'holo';
    type: 'message_start' | 'content_delta' | 'message_delta' | 'message_stop';
    choice?: number;        // For multi-choice (OpenAI n>1)
    index?: number;         // Content block index (Claude)
    delta: Partial<HoloMessage>;
    provider_delta?: unknown;  // Full raw provider event
  };
  finish_reason?: string;   // Completion reason
  usage?: HoloUsage;        // Token counts
  done?: boolean;           // Stream complete
}
```

### HoloStreamingDelta Types

| Type | Purpose | When Emitted |
|------|---------|--------------|
| `message_start` | Initialize message | First event with role |
| `content_delta` | Incremental text | Each text token/chunk |
| `message_delta` | Metadata/tools/usage | Tool calls, usage updates |
| `message_stop` | Completion marker | Final event with finish_reason |

---

## Event Lifecycle

### Universal Pattern

```
message_start → content_delta* → message_delta* → message_stop
```

**Rules:**
1. Stream MUST begin with `message_start` (or first content_delta for Ollama)
2. Stream MUST end with `message_stop`
3. Content and metadata deltas MAY be interleaved
4. Each event is independent (stateless)

### Event Sequence Examples

#### Simple Text Response
```
message_start { role: "assistant" }
→ content_delta { content: "Hello" }
→ content_delta { content: " world" }
→ message_stop { finish_reason: "stop" }
```

#### Tool Call Response
```
message_start { role: "assistant" }
→ message_delta { tool_calls: [{ id, name, arguments: {} }] }  ← Shell
→ message_delta { provider_delta: { args_fragment: "{\"lo" } }  ← Fragment 1
→ message_delta { provider_delta: { args_fragment: "c\":\"" } }  ← Fragment 2
→ message_delta { provider_delta: { args_fragment: "NYC\"}" } }  ← Fragment 3
→ message_delta { tool_calls: [{ arguments: {loc:"NYC"} }] }     ← Complete
→ message_stop { finish_reason: "tool_calls" }
```

#### With Usage Updates
```
message_start { role: "assistant" }
→ content_delta { content: "Answer..." }
→ message_delta { usage: { input_tokens: 10, output_tokens: 5 } }
→ message_stop { finish_reason: "stop", usage: {...} }
```

---

## Provider Comparison

### Event Type Mapping

| Holo Event | Claude | OpenAI | Ollama | Purpose |
|------------|--------|--------|--------|---------|
| `message_start` | `type: 'message_start'` | First chunk `delta.role` | ❌ No explicit | Initialize |
| `content_delta` | `content_block_delta` (text_delta) | `delta.content` | `response` (done=false) | Text tokens |
| `message_delta` | `message_delta` (usage) | `delta.tool_calls[]` or usage chunk | Tool calls / final frame | Metadata |
| `message_stop` | `type: 'message_stop'` | `finish_reason` non-null | `done: true` | Complete |

### Provider Lifecycles

#### Claude (6 Event Types + Orchestrator)

```
message_start
  { type: 'message_start', message: { id, role, content: [] } }
↓
content_block_start [index=0]
  { type: 'content_block_start', index: 0, content_block: { type: 'text' } }
↓
content_block_delta (text_delta) [index=0]
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: "Hello" } }
↓
content_block_delta (more text) [index=0]
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: " world" } }
↓
content_block_stop [index=0]
  { type: 'content_block_stop', index: 0 }
↓
message_delta (usage)
  { type: 'message_delta', usage: {...}, delta: { stop_reason: 'end_turn' } }
↓
message_stop
  { type: 'message_stop' }
```

**Special Notes:**
- **Stateful orchestrator** needed to inject `content_block_start/stop`
- **Content block indexing** for multiple blocks
- **Granular events** for fine-grained control

#### OpenAI (Single Chunk Type + Deltas)

```
chunk { id, object: 'chat.completion.chunk', choices: [{ delta: { role: "assistant" } }] }
  → message_start
↓
chunk { choices: [{ delta: { content: "Hello" } }] }
  → content_delta
↓
chunk { choices: [{ delta: { content: " world" } }] }
  → content_delta
↓
chunk { choices: [{ finish_reason: "stop" }] }
  → message_stop
↓
chunk { usage: {...}, choices: [] }  ← Optional usage-only chunk
  → message_delta (usage only)
```

**Special Notes:**
- **Multi-choice support** (n>1) - emit one Holo event per choice
- **Tool call indexing** - `tool_calls[i].index` for parallel calls
- **Usage chunk** - separate optional chunk at end
- **Streaming JSON** - tool arguments as fragments

#### Ollama (Frame-Based)

```
{ model, created_at, message: { content: "Hello" }, done: false }
  → content_delta
↓
{ message: { content: " world" }, done: false }
  → content_delta
↓
{ message: { content: "" }, done: true, done_reason: "stop", eval_count: 42 }
  → message_delta (usage) + message_stop
```

**Special Notes:**
- **No explicit start** - first frame begins content
- **Simple structure** - no choices array
- **Performance metrics** - timing in nanoseconds
- **Dual mode** - chat vs generate endpoints

---

## Implementation Patterns

### Pattern 1: Stateless Event Translation

**All translators are stateless** - process one chunk, emit 0-N events.

```typescript
@injectable()
export class OpenAIContentDeltaTranslator extends Stream {
    protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
        const results: HoloStreamChunk[] = [];

        // Process each choice independently (no state)
        for (const choice of source.choices) {
            if (!choice.delta.content) continue;

            const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0
                ? choice.index : 0;

            results.push(pickDefined({
                id: source.id,
                model: source.model,
                created: source.created * 1000,  // sec → ms
                delta: {
                    provider: 'openai' as const,
                    type: 'content_delta' as const,
                    choice: choiceIndex,
                    delta: { content: choice.delta.content },
                    provider_delta: source  // Full raw chunk
                }
            }));
        }

        return results;  // 0-N events
    }
}
```

### Pattern 2: Per-Choice Emission (Multi-Choice)

**Support OpenAI n>1** by emitting one event per choice.

```typescript
protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    const results: HoloStreamChunk[] = [];

    // Emit one event per choice
    for (const choice of source.choices) {
        if (!choice.finish_reason) continue;

        const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0
            ? choice.index : 0;

        results.push({
            id: source.id,
            model: source.model,
            delta: {
                provider: 'openai',
                type: 'message_stop',
                choice: choiceIndex,  // ← Preserve choice index
                delta: {},
                provider_delta: source
            },
            finish_reason: this.mapFinishReason(choice.finish_reason)
        });
    }

    return results;
}
```

### Pattern 3: Tool Call Fragment Accumulation

**Problem:** Tool arguments stream as JSON fragments - can't parse until complete.

**Solution:** Emit shell + full provider_delta for client accumulation.

```typescript
protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    const results: HoloStreamChunk[] = [];

    for (const choice of source.choices) {
        if (!choice.delta.tool_calls) continue;

        for (const tc of choice.delta.tool_calls) {
            const rawArgs = tc.function?.arguments;
            const parsedArgs = safeParse(rawArgs);
            const isPartialJson = rawArgs && Object.keys(parsedArgs).length === 0;

            if (!isPartialJson) {
                // Complete JSON - emit parsed tool call
                results.push({
                    delta: {
                        type: 'message_delta',
                        delta: {
                            tool_calls: [{
                                id: tc.id,
                                type: 'function',
                                function: {
                                    name: tc.function?.name,
                                    arguments: parsedArgs  // ← Parsed object
                                }
                            }]
                        },
                        provider_delta: source
                    }
                });
            } else {
                // Partial JSON - emit shell for accumulation
                results.push({
                    delta: {
                        type: 'message_delta',
                        delta: {},  // ← Empty delta
                        provider_delta: source  // ← Full chunk for client accumulation
                    }
                });
            }
        }
    }

    return results;
}
```

### Pattern 4: Fast Pass-Through

**Same-provider streaming** validates provider_delta and passes through.

```typescript
protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<OpenAIChunk[]> {
    const d = source.delta;
    if (!d || d.type !== 'content_delta') return [];

    // Fast pass-through if we already have OpenAI chunk
    if (d.provider === 'openai' && d.provider_delta) {
        const validated = this.providerValidator(d.provider_delta);
        if (!(validated instanceof ArkErrors)) {
            return [validated];  // ← Zero-cost pass-through
        }
    }

    // Reconstruct from Holo
    return [{
        id: source.id || this.providerDefaults.id || uuidv4(),
        object: 'chat.completion.chunk',
        created: source.created ? Math.floor(source.created / 1000) : Math.floor(Date.now() / 1000),
        model: source.model || this.providerDefaults.model,
        choices: [{
            index: d.choice ?? 0,
            delta: { content: d.delta.content },
            finish_reason: null
        }]
    }];
}
```

### Pattern 5: Timestamp Conversion

**Always convert** between provider units and Holo milliseconds.

```typescript
// Provider → Holo
created: source.created * 1000  // OpenAI: sec → ms

// Holo → Provider
created: source.created
    ? Math.floor(source.created / 1000)  // ms → sec
    : Math.floor(Date.now() / 1000)
```

### Pattern 6: Choice Index Safety

**Always validate** choice index before use.

```typescript
const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0
    ? choice.index
    : 0;  // Safe fallback
```

---

## Provider-Specific Details

### Claude: Stateful Orchestration

**Challenge:** Claude requires synthetic events (`content_block_start/stop`) not in Holo.

**Solution:** Orchestrator maintains minimal state to inject lifecycle events.

```typescript
class ClaudeOrchestrator {
    private state = {
        messageStarted: false,
        activeBlockIndex: null as number | null,
        activeBlockType: null as string | null
    };

    feed(holoChunk: HoloStreamChunk): ClaudeRawMessageStreamEvent[] {
        const out: ClaudeRawMessageStreamEvent[] = [];

        // Inject message_start
        if (!this.state.messageStarted) {
            out.push({ type: 'message_start', message: {...} });
            this.state.messageStarted = true;
        }

        // Handle content_delta
        if (holoChunk.delta?.type === 'content_delta') {
            // Inject content_block_start if needed
            if (this.state.activeBlockIndex === null) {
                out.push({ type: 'content_block_start', index: 0, content_block: { type: 'text' } });
                this.state.activeBlockIndex = 0;
            }

            // Emit content_block_delta
            out.push({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: holoChunk.delta.delta.content } });
        }

        // Handle message_stop
        if (holoChunk.delta?.type === 'message_stop') {
            // Close active block
            if (this.state.activeBlockIndex !== null) {
                out.push({ type: 'content_block_stop', index: this.state.activeBlockIndex });
            }

            // Emit message_stop
            out.push({ type: 'message_stop' });
        }

        return out;
    }
}
```

### OpenAI: Multi-Choice Complexity

**Challenge:** OpenAI supports n>1 parallel completions.

**Solution:** Per-choice emission with choice index preservation.

```typescript
// One OpenAI chunk with n=2 → Two Holo events
const chunk = {
    choices: [
        { index: 0, delta: { content: "First" } },
        { index: 1, delta: { content: "Second" } }
    ]
};

const holoEvents = await translator.toHoloMany(chunk);
// [
//   { delta: { choice: 0, delta: { content: "First" } } },
//   { delta: { choice: 1, delta: { content: "Second" } } }
// ]
```

### Ollama: Simplest Model

**Challenge:** No explicit start event.

**Solution:** Begin with first content_delta.

```typescript
// Ollama frame → Holo event (no message_start emitted)
{ response: "Hello", done: false }
  → { delta: { type: 'content_delta', delta: { content: "Hello" } } }

// Client handles missing message_start gracefully
```

---

## Common Patterns

### Whitespace Preservation

**Never trim whitespace** - it's semantically meaningful.

```typescript
// ❌ Bad
delta: { content: choice.delta.content?.trim() }

// ✅ Good
delta: { content: choice.delta.content }
```

### Empty Content Handling

**Skip empty content** - don't emit no-op events.

```typescript
if (!choice.delta.content || choice.delta.content === '') {
    continue;  // Skip this choice
}
```

### Finish Reason Mapping

**Map 1:1** - don't invent defaults.

```typescript
private mapFinishReason(reason: string | null): HoloFinishReason | null {
    const mapping: Record<string, HoloFinishReason> = {
        'stop': 'stop',
        'length': 'length',
        'tool_calls': 'tool_calls',
        'content_filter': 'content_filter'
    };

    return reason ? (mapping[reason] ?? null) : null;  // ← null for unknown
}
```

### Usage Consolidation

**Map to Holo format** with consistent field names.

```typescript
// OpenAI → Holo
usage: source.usage ? {
    input_tokens: source.usage.prompt_tokens,
    output_tokens: source.usage.completion_tokens,
    total_tokens: source.usage.total_tokens,
    cache_read_tokens: source.usage.prompt_tokens_details?.cached_tokens
} : undefined

// Ollama → Holo
usage: source.done ? {
    input_tokens: source.prompt_eval_count,
    output_tokens: source.eval_count,
    total_tokens: (source.prompt_eval_count || 0) + (source.eval_count || 0)
} : undefined
```

---

## Anti-Patterns

### ❌ Adding State to Translators

```typescript
// ❌ Bad - stateful
export class BadTranslator {
    private messageStartSent = false;  // ❌ State between calls
}

// ✅ Good - stateless
export class GoodTranslator {
    protected async toHoloManyImpl(source) {
        // Pure function - no instance state
    }
}
```

### ❌ Creating Lean provider_delta

```typescript
// ❌ Bad - lean subset (violates lossless principle)
provider_delta: {
    id: source.id,
    choices: [{ delta: choice.delta }]
}

// ✅ Good - full source
provider_delta: source
```

### ❌ Fabricating Defaults

```typescript
// ❌ Bad - fabricated empty string
model: source.model || ''

// ✅ Good - use providerDefaults or warn
model: source.model || this.providerDefaults.model
if (!model) logger.warn('Model missing')
```

### ❌ Setting done Flag

```typescript
// ❌ Bad - translator decides done
return [{ delta: {...}, done: true }]

// ✅ Good - orchestrator decides
return [{ delta: {...} }]  // Let orchestrator set done
```

### ❌ Trimming Whitespace

```typescript
// ❌ Bad - loses semantic meaning
content: source.content.trim()

// ✅ Good - preserve whitespace
content: source.content
```

### ❌ Inventing Finish Reasons

```typescript
// ❌ Bad - coerce to 'stop'
finish_reason: source.finish_reason || 'stop'

// ✅ Good - preserve null for unknown
finish_reason: this.mapFinishReason(source.finish_reason)  // returns null for unknown
```

---

## Testing Streaming

### Unit Tests

```typescript
test('OpenAI content delta translation', async () => {
    const chunk: OpenAIChatCompletionChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [{
            index: 0,
            delta: { content: 'Hello world' },
            finish_reason: null
        }]
    };

    const translator = new OpenAIContentDeltaTranslator();
    const result = await translator.toHoloMany(chunk);

    expect(result).toHaveLength(1);
    expect(result[0].delta?.type).toBe('content_delta');
    expect(result[0].delta?.delta.content).toBe('Hello world');
    expect(result[0].created).toBe(1234567890000);  // ms
    expect(result[0].delta?.provider_delta).toEqual(chunk);
});
```

### Integration Tests

```typescript
test('Full streaming pipeline', async () => {
    const orchestrator = new OpenAIStreamTranslator();
    const holoEvents: HoloStreamChunk[] = [];

    for await (const chunk of openaiStream) {
        const events = await orchestrator.toHoloMany(chunk);
        holoEvents.push(...events);
    }

    expect(holoEvents[0].delta?.type).toBe('message_start');
    expect(holoEvents[holoEvents.length - 1].delta?.type).toBe('message_stop');
});
```

---

## Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Stream pattern
- **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - HoloStreamChunk types
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Step-by-step guide

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
