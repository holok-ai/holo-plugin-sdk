# Provider Translation Architecture

> **Navigation**: [README](README.md) | [Types](TYPE_REFERENCE.md) | [Translation](TRANSLATION_GUIDE.md) | [Streaming](STREAMING_GUIDE.md) | [Implementation](IMPLEMENTATION_GUIDE.md)

---

## Table of Contents

- [Overview](#overview)
- [Core Principles](#core-principles)
- [System Architecture](#system-architecture)
- [BaseStreamTranslator Pattern](#basestreamtranslator-pattern)
- [Validator Architecture](#validator-architecture)
- [Error Handling](#error-handling)
- [Dependency Injection](#dependency-injection)
- [Design Benefits](#design-benefits)
- [Implementation Guidelines](#implementation-guidelines)
- [Testing Strategy](#testing-strategy)

---

## Overview

The provider translation system provides a **universal abstraction layer** for LLM providers using **Holo** as the portable interchange format.

### Hub-and-Spoke Architecture

```
                    ┌─────────────────┐
                    │  Holo (Portable)│ ← Universal Format
                    │   Canonical Hub │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼───────┐  ┌────────▼───────┐
│ Claude         │  │ OpenAI         │  │ Ollama         │
│ Translator     │  │ Translator     │  │ Translator     │
└───────┬────────┘  └────────┬───────┘  └────────┬───────┘
        │                    │                    │
┌───────▼────────┐  ┌────────▼───────┐  ┌────────▼───────┐
│ Claude SDK     │  │ OpenAI SDK     │  │ Ollama SDK     │
└────────────────┘  └────────────────┘  └────────────────┘
```

**Benefits:**
- **N translations** instead of N² (3 providers → 3 translators vs 6)
- **Single source of truth** for portable format
- **Independent evolution** of provider implementations
- **Testable isolation** of each translation layer

---

## Core Principles

### 1. Stateless Translators

**Every translator is stateless** - no instance variables track state between calls.

```typescript
// ✅ Good - stateless
export class OpenAIMessageStopTranslator extends BaseStreamTranslator {
    protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
        return [this.mapToHolo(source)];  // Pure function
    }
}

// ❌ Bad - stateful
export class BadTranslator extends BaseStreamTranslator {
    private messageStartSent = false;  // ❌ State between calls

    protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
        if (!this.messageStartSent) {  // ❌ Depends on previous calls
            this.messageStartSent = true;
            // ...
        }
    }
}
```

**Why stateless?**
- ✅ Easy to test and reason about
- ✅ Parallelizable
- ✅ No race conditions
- ✅ Composable
- ✅ Cacheable
- ✅ Thread-safe and reentrant under parallel calls

**Thread Safety:**
- Translator classes are safe for concurrent use across parallel streams
- Shared utilities (JSON schema compilers, validators) must be immutable or pooled
- No locks required—pure stateless functions

**Where state lives:**
- Orchestrator layer (minimal state for lifecycle events, de-duplication, buffering)
- Client accumulation (tool arguments keyed by `(id, choice, toolIndex)` with memory caps)

See [STREAMING_GUIDE.md](STREAMING_GUIDE.md) for orchestrator responsibilities.

### 2. Bidirectional Translation

All translators support **both directions**:
- `toHolo` (Provider → Holo)
- `fromHolo` (Holo → Provider)

```typescript
export class OpenAIMessageTranslator extends BaseStreamTranslator<HoloMessage, OpenAIMessage> {
    // Provider → Holo
    protected async toHoloManyImpl(source: OpenAIMessage): Promise<Partial<HoloMessage>[]> {
        // ...
    }

    // Holo → Provider
    protected async fromHoloManyImpl(source: HoloMessage): Promise<Partial<OpenAIMessage>[]> {
        // ...
    }
}
```

### 3. Lossless Round-Tripping

**Preserve raw provider events** in `provider_delta` for perfect reconstruction:

```typescript
protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    return [{
        id: source.id,
        model: source.model,
        delta: {
            provider: 'openai',
            type: 'content_delta',
            delta: { content: source.choices[0].delta.content },
            provider_delta: source  // ← Full raw chunk preserved (unmodified)
        }
    }];
}
```

**Benefits:**
- ✅ Zero-cost pass-through for same-provider streaming
- ✅ Perfect round-trip fidelity
- ✅ Debugging and auditing
- ✅ Cross-provider translation

**Size & Persistence:**
- Store `provider_delta` unmodified (no lean subsets)
- Opaque compression allowed in transport (lossless at rest)
- Upper bound: soft cap per stream with truncation warnings (see Memory Bounds below)

**Security:**
- **NEVER log `provider_delta` at info level** (may contain PII/secrets)
- Surface with redaction or hash in debug logs only
- Orchestrator may attach redaction metadata outside `provider_delta` to preserve losslessness

### 4. Validator-First Design

**ArkType validators enforce contracts** at runtime:

```typescript
export class OpenAIMessageStopTranslator extends BaseStreamTranslator {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = OpenAIChatCompletionChunkValidator;

    protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
        // source already validated by BaseStreamTranslator
        // result will be validated before return
        return [this.mapToHolo(source)];
    }
}
```

**Validators serve three purposes:**
1. **Runtime type checking** - catch errors early
2. **Documentation** - show what fields are required/optional
3. **Type narrowing** - safe to use after validation

### 5. Per-Choice Emission

**Support multi-choice streams** (OpenAI n>1):

```typescript
protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    const results: HoloStreamChunk[] = [];

    // Emit one Holo event per OpenAI choice
    for (const choice of source.choices) {
        const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0
            ? choice.index : 0;

        results.push({
            id: source.id,
            delta: {
                provider: 'openai',
                choice: choiceIndex,  // ← Preserve choice index
                // ...
            }
        });
    }

    return results;  // 0-N events
}
```

**Ordering & Idempotency:**
- **`toHoloMany` MUST NOT reorder frames** from the same provider chunk
- Orchestrator MUST de-duplicate identical provider chunks (SDKs may retry on network flaps)
- Recommend `(id, choice, seq)` tuple or provider-native offset for downstream de-dup
- Consumers should handle at-least-once delivery semantics

**Multi-choice + Tools:**
- `delta.choice` indexes choices (0-based)
- Tool indices remain provider-native within each choice
- NEVER overload tool indices into `delta.choice`

### 6. Clock & Timestamps

**Conversion rules:**
- OpenAI: seconds → milliseconds (multiply by 1000)
- Ollama: ISO 8601 string → milliseconds (parse with Date)
- Claude: none → use orchestrator default at ingress

**NEVER synthesize timestamps mid-stream:**
- Only set `created` on frames that include a provider timestamp
- If provider omits timestamp, leave `created` undefined
- Orchestrator may inject default at stream start (not per-chunk)

**Clock Skew:**
- When both upstream proxy time and provider time exist, prefer provider timestamp
- Document source of timestamp in `provider_delta` metadata if needed

**Table: Time Unit Conversions**

| Provider | Format | Conversion | Example |
|----------|--------|------------|---------|
| OpenAI | `number` (seconds) | `created: source.created * 1000` | `1609459200` → `1609459200000` |
| Ollama | ISO 8601 string | `created: new Date(source.created_at).getTime()` | `"2021-01-01T00:00:00Z"` → `1609459200000` |
| Claude | Not provided | Leave `undefined`; orchestrator injects | `undefined` → orchestrator default |

See provider-specific READMEs for details: [Claude](claude/README.md), [OpenAI](openai/README.md), [Ollama](ollama/README.md)

### 7. Backpressure & Cancellation

**Cancellation Behavior:**
- Translators are stateless; cancellation is orchestrator responsibility
- Orchestrator must propagate cancellation to provider SDK
- **NEVER inject synthetic `message_stop`** on cancellation
- Leave stream open/closed policy to orchestrator (not translator)

**Backpressure:**
- Consumer cancellation → orchestrator stops emitting partial reconstructions
- No downstream buffer management in translators
- Orchestrator handles backpressure from slow consumers

### 8. Retry & Reconnection

**Transient failures:**
- If provider stream reconnects (e.g., transient 5xx), orchestrator handles reconnection
- Reconnection MUST NOT cause duplicate Holo events
- Use `(id, choice, seq)` for de-duplication (see "Ordering & Idempotency" above)
- Consumers implement at-least-once delivery semantics

### 9. Pass-Through Contract

**Fast path for same-provider:**

In `fromHoloMany`, attempt fast pass-through when `provider_delta` is present:

```typescript
protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<TProvider[]> {
    const d = source.delta;
    if (!d || d.type !== 'expected_type') return [];

    // Fast pass-through: validate provider_delta first
    if (d.provider === 'openai' && d.provider_delta) {
        const validated = this.providerValidator(d.provider_delta);
        if (!(validated instanceof ArkErrors)) {
            return [validated];  // ← Byte-for-byte pass-through
        }
        // Validation failed → fall through to reconstruction
    }

    // Reconstruct from Holo (slow path)
    return [this.reconstructFromHolo(source)];
}
```

**Contract:**
1. First try validating `provider_delta` with `providerValidator`
2. If valid → return as-is (zero-cost pass-through)
3. If invalid → reconstruct from Holo canonical fields (cross-provider translation)

### 10. Defaults Provenance

**Where defaults come from:**
- Defaults come from `providerDefaults` injected by orchestrator (model, service tier, region)
- Translators MUST NOT hardcode provider defaults (e.g., `model: 'gpt-4'`)
- Orchestrator injects defaults based on request context

**Example:**

```typescript
// ❌ BAD - hardcoded default
const model = source.model || 'gpt-4';

// ✅ GOOD - orchestrator-injected default
const model = source.model || this.providerDefaults.model;
if (!model) {
    logger.warn('Model missing; orchestrator should supply via providerDefaults');
}
```

---

## System Architecture

### Translation Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│              (Controllers, Services, etc.)               │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Holo Translator                        │
│            (Facade - routes to providers)                │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Claude     │ │   OpenAI    │ │   Ollama   │
│ Translator   │ │ Translator  │ │ Translator │
└───────┬──────┘ └──────┬──────┘ └─────┬──────┘
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Claude     │ │   OpenAI    │ │   Ollama   │
│   Provider   │ │   Provider  │ │   Provider │
└───────┬──────┘ └──────┬──────┘ └─────┬──────┘
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Claude SDK  │ │  OpenAI SDK │ │ Ollama SDK │
└──────────────┘ └─────────────┘ └────────────┘
```

### Component Responsibilities

| Layer | Responsibility | Stateful? |
|-------|---------------|-----------|
| **HoloTranslator** | Route to provider translator | No |
| **Provider Translator** | Facade for request/response/streaming | No |
| **Request Translator** | Translate request objects | No |
| **Response Translator** | Translate response objects | No |
| **Stream Orchestrator** | Route streaming events, inject lifecycle | Minimal (Claude only) |
| **Event Translators** | Translate individual streaming events | No |
| **Provider** | SDK integration, API calls | No |

---

## BaseStreamTranslator Pattern

### Class Hierarchy

```
BaseStreamTranslator<THolo, TProvider>
    ├── BaseTranslator<THolo, TProvider>         (request/response)
    │   ├── ClaudeRequestTranslator
    │   ├── ClaudeResponseTranslator
    │   ├── ClaudeMessageTranslator
    │   └── ClaudeToolTranslator
    └── Individual Event Translators              (streaming)
        ├── OpenAIMessageStartTranslator
        ├── OpenAIContentDeltaTranslator
        ├── OpenAIMessageDeltaTranslator
        └── OpenAIMessageStopTranslator
```

### Base Class Structure

```typescript
@injectable()
export abstract class BaseStreamTranslator<THolo, TProvider> {
    // Validators (must be defined by subclass)
    protected abstract holoValidator: Type<THolo>;
    protected abstract providerValidator: Type<TProvider>;

    // Defaults (orchestrator-injected)
    protected holoDefaults: Partial<THolo> = {};
    protected providerDefaults: Partial<TProvider> = {};

    // Public API (validation wrapper)
    public async toHoloMany(
        source: TProvider,
        options?: { validateSource?: boolean; validateTarget?: boolean; failQuietly?: boolean }
    ): Promise<THolo[]> {
        // 1. Validate source (if requested)
        let validatedSource = source;
        if (options?.validateSource) {
            const result = this.providerValidator(source);
            if (result instanceof ArkErrors) {
                if (!options.failQuietly) throw new Error(result.summary);
                // Continue with unvalidated source
            } else {
                validatedSource = result;
            }
        }

        // 2. Translate (stateless)
        const partialResults = await this.toHoloManyImpl(validatedSource);

        // 3. Apply defaults
        const withDefaults = partialResults.map(r => ({ ...this.holoDefaults, ...r }));

        // 4. Validate results (if requested)
        if (options?.validateTarget) {
            return withDefaults.map(r => {
                const validated = this.holoValidator(r);
                if (validated instanceof ArkErrors) {
                    if (!options.failQuietly) throw new Error(validated.summary);
                    return r as THolo;
                }
                return validated;
            });
        }

        return withDefaults as THolo[];
    }

    // Subclass implements (stateless)
    protected abstract toHoloManyImpl(source: TProvider): Promise<Partial<THolo>[]>;
    protected abstract fromHoloManyImpl(source: THolo): Promise<Partial<TProvider>[]>;
}
```

### Key Design Decisions

#### 1. Many-to-Many (toHoloMany / fromHoloMany)

**Returns arrays** to support:
- Per-choice emission (OpenAI n>1)
- Multiple events from single chunk
- No-op cases (return empty array)

```typescript
// 1 provider chunk → 2 Holo events (for n=2 choices)
const result = await translator.toHoloMany(openaiChunk);
// result.length === 2
```

#### 2. Partial Results with Defaults

**Implementation returns `Partial<T>`** to avoid duplication:
- Translator focuses on mapping logic
- BaseStreamTranslator applies defaults
- Clean separation of concerns

```typescript
// Translator: only map what's present
protected async toHoloManyImpl(source: OpenAIChunk): Promise<Partial<HoloStreamChunk>[]> {
    return [{
        id: source.id,  // Only required fields
        delta: { /* ... */ }
    }];
}

// BaseStreamTranslator: apply defaults
public async toHoloMany(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    const partials = await this.toHoloManyImpl(source);
    return partials.map(p => ({ ...this.holoDefaults, ...p }));
}
```

#### 3. Optional Validation

**Validation is opt-in** for performance:
- Source validation: useful for debugging
- Target validation: expensive in production
- failQuietly: drop malformed chunks vs throwing

```typescript
// Development: strict validation
const result = await translator.toHoloMany(chunk, {
    validateSource: true,
    validateTarget: true,
    failQuietly: false
});

// Production: fast path
const result = await translator.toHoloMany(chunk);
```

**Recommended Presets:**

| Environment | validateSource | validateTarget | failQuietly | Notes |
|-------------|----------------|----------------|-------------|-------|
| **Dev** | `true` | `true` | `false` | Catch all errors immediately |
| **Prod** | `false` | sampling (1%) | `true` | Emit metric, continue |
| **Schema migration** | `false` | `true` | `true` | Validate new schema version |

**Schema Versioning:**
- Define `HOLO_SCHEMA_VERSION` constant (e.g., "2025.10")
- Validators are versioned; translators target current version
- Orchestrator provides compatibility shim for older schemas
- Refuse unknown versions unless shim available

---

## Validator Architecture

### ArkType Integration

**All types have corresponding validators**:

```typescript
// Type definition
export type HoloStreamChunk = {
    id?: string;
    model: string;
    created?: number;
    delta?: HoloStreamingDelta;
    finish_reason?: HoloFinishReason;
    usage?: HoloUsage;
};

// Validator (source of truth for required/optional)
export const HoloStreamChunkValidator = type({
    'id?': 'string',
    model: 'string',                    // Required (no ?)
    'created?': 'number',
    'delta?': HoloStreamingDeltaValidator,
    'finish_reason?': HoloFinishReasonValidator,
    'usage?': HoloUsageValidator
});
```

### Validator Best Practices

#### 1. Validators Define Contracts

**Check validator first** to understand requirements:

```typescript
// DON'T guess what's required
const chunk = { id: source.id, model: source.model ?? '' };  // ❌ Fabricated default

// DO check validator to see model is required
const HoloStreamChunkValidator = type({
    model: 'string'  // ← Required (no ?)
});

// Then handle properly
if (!source.model) {
    logger.warn('Model missing; orchestrator should supply via providerDefaults');
}
const model = source.model || this.providerDefaults.model;
```

#### 2. Validate Then Cast

**After validation, casting is safe**:

```typescript
// Validate first
const validated = this.holoValidator(data);
if (validated instanceof ArkErrors) {
    throw new Error(validated.summary);
}

// Now safe to use (type narrowed)
return validated;  // Type: HoloStreamChunk (not Partial)
```

#### 3. Union Validators

**For polymorphic types**:

```typescript
export const HoloProviderDeltaValidator = type({
    kind: "'openai.tool_call.args.delta'",
    index: 'number',
    'id?': 'string',
    fragment: 'string'
}).or({
    kind: "'claude.tool_use.input.delta'",
    index: 'number',
    fragment: 'string'
});
```

---

## Error Handling

### Error Taxonomy

**Classify errors for appropriate handling and metrics:**

| Error Type | Description | HTTP Mapping | Metric | Action |
|------------|-------------|--------------|--------|--------|
| **validation_error** | ArkType validation failure | 400 Bad Request | `translator.validation_error` | Fail request (dev), emit metric + continue (prod) |
| **mapping_error** | Missing required field, cannot map | 502 Bad Gateway | `translator.mapping_error` | Log warning, reconstruct from `provider_delta` if available |
| **provider_invariant_violation** | Provider broke contract (e.g., missing `id`) | 502 Bad Gateway | `translator.invariant_violation` | Log error, drop chunk |
| **transient_transport** | Network flap, retry | 503 Service Unavailable | `translator.transport_error` | Orchestrator retries, de-dup downstream |

**Emit distinct metrics** for each error type; allows targeted alerting.

### Error Handling Patterns

#### 1. Validation Errors

```typescript
const validated = this.providerValidator(source);
if (validated instanceof ArkErrors) {
    this.log.error(`Source validation failed: ${validated.summary}`);
    metrics.increment('translator.validation_error', { provider: 'openai' });

    if (!failQuietly) {
        throw new Error(`Invalid source: ${validated.summary}`);
    }

    // Continue with unvalidated source
    validatedSource = source;
}
```

#### 2. No-Op Cases

**Return empty array** for no-op (don't throw):

```typescript
protected async toHoloManyImpl(source: OpenAIChunk): Promise<HoloStreamChunk[]> {
    // No content - no-op
    if (!source.choices[0].delta.content) {
        return [];  // ← Empty array, not error
    }

    // Map normally
    return [this.mapToHolo(source)];
}
```

#### 3. Missing Defaults

**Warn but continue**:

```typescript
const model = source.model || this.providerDefaults.model;
if (!model) {
    const logger = this.mlog(this.fromHoloManyImpl);
    logger.warn('Translator: model missing; orchestrator should supply via providerDefaults');
    metrics.increment('translator.missing_default', { field: 'model' });
}
```

#### 4. Unknown Finish Reasons

**Map to `null`, preserve original in `provider_delta`:**

```typescript
// DON'T fabricate "stop" for unknown reasons
const finish_reason = this.mapFinishReason(source.finish_reason);  // Returns null for unknown

// Original preserved in provider_delta for debugging
```

### Error Logging

**Method-scoped logging** for context:

```typescript
protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<OpenAIChunk[]> {
    const logger = this.mlog(this.fromHoloManyImpl);  // ← Method-scoped

    if (!source.model) {
        logger.warn('Model missing in Holo chunk');
    }

    // ...
}
```

---

## Streaming Invariants

**Minimal sequence accepted per provider:**

### OpenAI
- At least one of `{delta.role | delta.content | finish_reason}` per chunk
- Empty deltas (all fields undefined) are legal but no-op → return `[]`

### Claude
- Block lifecycle: `start` → `delta` → `stop` balanced by index
- `content_block_start` must precede first `content_block_delta` for that index
- `content_block_stop` must follow last `content_block_delta` for that index
- Index must be consistent within block lifecycle

### Ollama
- `done=false` frames may legally emit empty `response` field (some builds)
- Treat as no-op → return `[]`
- `done=true` frame marks stream end; may include usage

**Tool Arguments Accumulation:**

When accumulating tool arguments across deltas:

```typescript
// Buffers keyed by (id, choice, toolIndex)
const toolBuffers = new Map<string, { args: string; lastSeen: number }>();

// Memory cap: 10MB per stream
const MAX_BUFFER_SIZE = 10 * 1024 * 1024;

// Evict on message_stop or when buffer exceeds cap
if (delta.type === 'message_stop' || totalSize > MAX_BUFFER_SIZE) {
    toolBuffers.clear();
}
```

**Recipe:**
- Buffer keyed by `(id, choice, toolIndex)`
- Append fragments in order
- Parse JSON on `finish_reason` or tool close
- Memory cap with eviction on `message_stop`
- Drop fragments if out-of-order (emit warning metric)

---

## Memory Bounds

**Buffering guidance:**

| Component | Soft Cap | Action on Exceed |
|-----------|----------|------------------|
| Tool args buffer | 1MB per tool | Drop with warning, set `truncated: true` in diagnostics |
| `provider_delta` | 100KB per chunk | Compress (lossless) in transport |
| Long JSON deltas | 10MB per stream | Truncate, emit metric, include `truncated: true` |

**Truncation metadata:**
- NEVER include `truncated` flag in Holo canonical payload
- Add to `provider_delta` diagnostics (outside Holo schema)
- Orchestrator emits metric: `translator.truncated`

**Large content handling:**
- For large tool schemas or long streaming JSON, set soft cap per stream
- Drop with warning if exceeded
- Continue processing (don't fail entire stream)

---

## Metrics & Tracing

**Recommended counters:**

| Metric | Description | Labels |
|--------|-------------|--------|
| `translator.events_in` | Provider chunks received | `provider`, `event_type` |
| `translator.events_out` | Holo events emitted | `provider`, `holo_type` |
| `translator.toHolo_latency_ms` | Time to translate provider → Holo | `provider`, `event_type` |
| `translator.fromHolo_latency_ms` | Time to translate Holo → provider | `provider`, `holo_type` |
| `translator.validation_failures` | Validation errors | `provider`, `source_or_target` |
| `translator.pass_through_rate` | % of events using fast pass-through | `provider` |
| `translator.bytes_provider_delta` | Size of `provider_delta` field | `provider` |

**Trace attributes:**

Add to distributed tracing spans:

```typescript
span.setAttributes({
    'translator.provider': 'openai',
    'translator.model': source.model,
    'translator.choice': choiceIndex,
    'translator.event_type': delta.type,
    'translator.finish_reason': source.finish_reason,
    'translator.pass_through': !!d.provider_delta
});
```

**Benefits:**
- Identify slow translators (latency metrics)
- Monitor validation failure rates
- Track pass-through efficiency
- Detect memory issues (`bytes_provider_delta`)

---

## Dependency Injection

### tsyringe Integration

**All translators use dependency injection**:

```typescript
import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';

@injectable()
export class OpenAIStreamTranslator extends BaseStreamTranslator {
    constructor(
        // Inject sub-translators
        private readonly messageStartTranslator: OpenAIMessageStartTranslator,
        private readonly contentDeltaTranslator: OpenAIContentDeltaTranslator,
        private readonly messageDeltaTranslator: OpenAIMessageDeltaTranslator,
        private readonly messageStopTranslator: OpenAIMessageStopTranslator
    ) {
        super();
    }

    // ...
}
```

### Container Registration

**Automatic registration** via `@injectable()`:

```typescript
import { container } from 'tsyringe';

// Auto-registered by @injectable() decorator
const translator = container.resolve(OpenAIStreamTranslator);
```

---

## Design Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Modularity** | Each translator is independent | Easy to test, modify, replace |
| **Validation** | Built-in runtime type checking | Catch errors early |
| **Extensibility** | Add providers without changing existing code | Low risk changes |
| **Consistency** | Uniform interface across all translators | Easy onboarding |
| **Type Safety** | Full TypeScript + runtime validation | Fewer bugs |
| **Lossless** | Raw events preserved in provider_delta | Perfect round-trips |
| **Stateless** | No instance state | Parallelizable, cacheable |
| **Testable** | Pure functions | Simple unit tests |

---

## Implementation Guidelines

### Always

1. ✅ **Stateless** - No instance variables tracking state between calls
2. ✅ **Preserve `provider_delta`** - Store full raw chunk (not lean subsets)
3. ✅ **Validate choice index** - Use `Number.isInteger()` checks
4. ✅ **Convert timestamps** - Match provider's time units ↔ Holo ms (see Clock & Timestamps)
5. ✅ **Support per-choice** - Emit one event per choice when applicable
6. ✅ **Use `pickDefined()`** - Clean undefined optional fields (preserves falsy values like `0` and `''`)
7. ✅ **Add logging** - Use `this.mlog(methodName)` for debugging
8. ✅ **Fast pass-through** - Validate `provider_delta` for same-provider streaming
9. ✅ **Emit metrics** - Track validation failures, pass-through rate, latency
10. ✅ **Maintain order** - Never reorder frames from same provider chunk

### Never

1. ❌ **Trim whitespace** - Content is semantically meaningful
2. ❌ **Fabricate defaults** - Use `providerDefaults` or return `null`
3. ❌ **Set `done` flag** - Let orchestrator decide
4. ❌ **Create lean `provider_delta`** - Always store full source
5. ❌ **Invent finish_reason defaults** - Return `null` for unknown, preserve original in `provider_delta`
6. ❌ **Skip partial data** - Emit shell events with `provider_delta`
7. ❌ **Use `as any`** - Let validators enforce contracts
8. ❌ **Synthesize timestamps mid-stream** - Only set `created` when provider includes timestamp
9. ❌ **Log `provider_delta` at info level** - May contain PII/secrets
10. ❌ **Inject synthetic `message_stop`** on cancellation - Orchestrator responsibility

### pickDefined Helper

**Preserves falsy values** like `0` and `''`:

```typescript
function pickDefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;
}

// Example:
pickDefined({ a: 0, b: '', c: null, d: undefined })
// → { a: 0, b: '', c: null }  ✅ Preserves 0, '', null
```

### Code Template

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseStreamTranslator } from '../../../base.stream.translator';
import { HoloStreamChunk, HoloStreamChunkValidator } from '../../../holo';
import { ProviderEventType, ProviderEventValidator } from '../../validators';
import { pickDefined } from '../../../utils';

@injectable()
export class ProviderEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ProviderEventType> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ProviderEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ProviderEventType> = {};

    protected async toHoloManyImpl(source: ProviderEventType): Promise<Partial<HoloStreamChunk>[]> {
        // Stateless implementation
        return [pickDefined({
            id: source.id,
            model: source.model,
            delta: {
                provider: 'provider_name' as const,
                type: 'event_type' as const,
                delta: { /* ... */ },
                provider_delta: source  // Full raw source
            }
        })];
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderEventType>[]> {
        const d = source.delta;
        if (!d || d.type !== 'expected_type') return [];

        // Fast pass-through
        if (d.provider === 'provider_name' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        // Reconstruct from Holo
        return [pickDefined({
            id: source.id || this.providerDefaults.id,
            model: source.model || this.providerDefaults.model,
            // ...
        })];
    }
}
```

---

## Testing Strategy

### Unit Tests

**Test each translator in isolation**:

```typescript
describe('OpenAIMessageStopTranslator', () => {
    let translator: OpenAIMessageStopTranslator;

    beforeEach(() => {
        translator = new OpenAIMessageStopTranslator();
    });

    test('toHolo: maps finish_reason', async () => {
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

        const result = await translator.toHoloMany(chunk);

        expect(result).toHaveLength(1);
        expect(result[0].delta?.type).toBe('message_stop');
        expect(result[0].finish_reason).toBe('stop');
        expect(result[0].created).toBe(1234567890000);  // sec → ms
        expect(result[0].delta?.provider_delta).toEqual(chunk);
    });

    test('toHolo: supports multi-choice (n>1)', async () => {
        const chunk: OpenAIChatCompletionChunk = {
            id: 'chatcmpl-123',
            choices: [
                { index: 0, delta: {}, finish_reason: 'stop' },
                { index: 1, delta: {}, finish_reason: 'stop' }
            ],
            /* ... */
        };

        const result = await translator.toHoloMany(chunk);

        expect(result).toHaveLength(2);
        expect(result[0].delta?.choice).toBe(0);
        expect(result[1].delta?.choice).toBe(1);
    });
});
```

### Round-Trip Tests

**Verify lossless translation**:

```typescript
test('Round-trip fidelity (byte-for-byte pass-through)', async () => {
    const original: OpenAIChatCompletionChunk = /* ... */;

    // Provider → Holo
    const holoEvents = await translator.toHoloMany(original);

    // Holo → Provider (fast pass-through)
    const reconstructed = await translator.fromHoloMany(holoEvents[0]);

    // Must be byte-for-byte identical
    expect(reconstructed[0]).toEqual(original);
});
```

### Integration Tests

**Test full translation pipeline**:

```typescript
test('Full streaming pipeline', async () => {
    const provider = container.resolve(OpenAIProvider);
    const orchestrator = container.resolve(OpenAIStreamTranslator);

    const stream = await provider.streamChat(request);
    const holoEvents: HoloStreamChunk[] = [];

    for await (const chunk of stream) {
        const holo = await orchestrator.toHoloMany(chunk);
        holoEvents.push(...holo);
    }

    expect(holoEvents[0].delta?.type).toBe('message_start');
    expect(holoEvents[holoEvents.length - 1].delta?.type).toBe('message_stop');
});
```

### Recommended Test Cases (Quick Wins)

**Critical tests to add:**

1. **De-duplication test**: Two identical provider chunks → one Holo event after orchestrator de-dup
   ```typescript
   test('Orchestrator de-duplicates identical chunks', async () => {
       const chunk: OpenAIChunk = { /* ... */ };
       // Send same chunk twice (simulates retry)
       const holo1 = await translator.toHoloMany(chunk);
       const holo2 = await translator.toHoloMany(chunk);

       // Orchestrator should de-dup based on (id, choice, seq)
       expect(orchestrator.dedup([...holo1, ...holo2])).toHaveLength(1);
   });
   ```

2. **Cancellation test**: Simulate early cancel → no synthetic `message_stop`
   ```typescript
   test('Cancellation does not inject synthetic message_stop', async () => {
       const stream = provider.streamChat(request);
       const holoEvents: HoloStreamChunk[] = [];

       let count = 0;
       for await (const chunk of stream) {
           if (++count === 3) {
               stream.cancel();  // Cancel after 3 chunks
               break;
           }
           holoEvents.push(...await translator.toHoloMany(chunk));
       }

       // No synthetic message_stop
       expect(holoEvents.some(e => e.delta?.type === 'message_stop')).toBe(false);
   });
   ```

3. **Provider pass-through**: Holo event with `provider_delta` round-trips byte-for-byte
   ```typescript
   test('provider_delta enables byte-for-byte pass-through', async () => {
       const original: OpenAIChunk = { /* ... */ };
       const holo = (await translator.toHoloMany(original))[0];

       // Must have provider_delta
       expect(holo.delta?.provider_delta).toBeDefined();

       // Reconstruct
       const reconstructed = await translator.fromHoloMany(holo);

       // Byte-for-byte identical
       expect(reconstructed[0]).toEqual(original);
   });
   ```

4. **Tool args fragmentation**: 3 fragments + finish → parse once; out-of-order → warn
   ```typescript
   test('Tool args accumulate correctly', async () => {
       const fragments = [
           { function_call: { arguments: '{"ke' } },
           { function_call: { arguments: 'y": "va' } },
           { function_call: { arguments: 'lue"}' } }
       ];

       const buffer = new ToolArgsBuffer();
       fragments.forEach(f => buffer.append(f));

       const parsed = buffer.parseOnFinish();
       expect(parsed).toEqual({ key: "value" });
   });

   test('Out-of-order fragments emit warning', async () => {
       // Send fragment 2 before fragment 1
       expect(() => buffer.append(fragment2)).toThrow(/out of order/);
   });
   ```

5. **Huge `provider_delta`**: Over threshold → compressed, uncompressed at sink
   ```typescript
   test('Large provider_delta is compressed in transport', async () => {
       const hugeChunk: OpenAIChunk = { /* 200KB chunk */ };
       const holo = (await translator.toHoloMany(hugeChunk))[0];

       // Transport layer compresses
       const compressed = transport.serialize(holo);
       expect(compressed.length).toBeLessThan(hugeChunk.length);

       // Sink uncompresses losslessly
       const decompressed = transport.deserialize(compressed);
       expect(decompressed).toEqual(holo);
   });
   ```

---

## Related Documentation

- **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - Complete type definitions
- **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - Field mapping tables
- **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** - Streaming implementation (orchestrator state management)
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Step-by-step guide
- **[GUARD_ERRORS.md](GUARD_ERRORS.md)** - Guard failure error response format

### Cross-References

**Guard Streams:**
- Guard failure responses deliberately look like provider streams
- Travel through the same translators (stateless pass-through)
- `provider` field set to `'holo'` for guard errors
- Pass-through rule still applies; no special handling required

**Where to Put State:**
- Translators: stateless (no instance variables)
- Orchestrator: minimal state for lifecycle events (Claude start/stop synthesis), de-duplication, buffering
- Client: accumulation (tool arguments keyed by `(id, choice, toolIndex)`)

See [STREAMING_GUIDE.md](STREAMING_GUIDE.md) for orchestrator responsibilities.

---

**Last Updated**: 2025-10-06
