# Implementation Guide

> **Navigation**: [README](README.md) | [Architecture](ARCHITECTURE.md) | [Types](TYPE_REFERENCE.md) | [Translation](TRANSLATION_GUIDE.md) | [Streaming](STREAMING_GUIDE.md)

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Adding a New Provider](#adding-a-new-provider)
- [Creating Request/Response Translators](#creating-requestresponse-translators)
- [Creating Streaming Translators](#creating-streaming-translators)
- [Writing Validators](#writing-validators)
- [Testing Strategy](#testing-strategy)
- [Common Pitfalls](#common-pitfalls)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides **step-by-step instructions** for implementing provider translations using the established architecture patterns.

### What You'll Build

```
src/providers/newprovider/
├── types/                        # Type definitions
├── validators/                   # ArkType validators
├── translators/                  # Bidirectional translators
│   ├── streaming/                # Event translators
│   └── newprovider.translator.ts # Main facade
├── newprovider.provider.ts       # SDK integration
└── newprovider.auditor.ts        # Usage tracking
```

---

## Prerequisites

### Required Knowledge

- ✅ TypeScript fundamentals
- ✅ Async/await and promises
- ✅ Dependency injection (tsyringe)
- ✅ ArkType validators basics

### Required Reading

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Core principles and patterns
2. **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - Holo types (canonical format)
3. **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - Field mapping patterns

### Development Environment

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm test
```

---

## Adding a New Provider

### Step 1: Research Provider API

**Document the provider's API** before coding:

1. **Create documentation files:**
   ```
   src/providers/newprovider/
   ├── NEWPROVIDER_REQUEST_TYPES.md
   ├── NEWPROVIDER_RESPONSE_TYPES.md
   └── STREAM_RESPONSE.md (if streaming)
   ```

2. **Document all request fields:**
   - Required vs optional
   - Field types
   - Value constraints
   - Default values

3. **Document all response fields:**
   - Response structure
   - Nested objects
   - Arrays and types

4. **Document streaming (if supported):**
   - Event types
   - Event sequence
   - Special fields

### Step 2: Create Directory Structure

```bash
cd src/providers
mkdir newprovider
cd newprovider

# Create subdirectories
mkdir types validators translators
mkdir translators/streaming
```

### Step 3: Define Types

**File:** `types/index.ts`

```typescript
// Request types
export type NewProviderRequest = {
    model: string;
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    // ... other fields
};

// Response types
export type NewProviderResponse = {
    id: string;
    model: string;
    output: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
};

// Streaming types (if supported)
export type NewProviderStreamChunk = {
    id: string;
    delta: string;
    done: boolean;
};
```

### Step 4: Create Validators

**File:** `validators/index.ts`

```typescript
import { type } from 'arktype';

// Request validator
export const NewProviderRequestValidator = type({
    model: 'string',
    prompt: 'string',
    'temperature?': 'number',
    'max_tokens?': 'number'
});

// Response validator
export const NewProviderResponseValidator = type({
    id: 'string',
    model: 'string',
    output: 'string',
    'usage?': type({
        input_tokens: 'number',
        output_tokens: 'number'
    })
});

// Streaming validator (if supported)
export const NewProviderStreamChunkValidator = type({
    id: 'string',
    delta: 'string',
    done: 'boolean'
});
```

### Step 5: Create Main Translator Facade

**File:** `translators/newprovider.translator.ts`

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseTranslator } from '../../base.translator';
import { HoloRequest, HoloResponse } from '../../holo';
import { NewProviderRequest, NewProviderResponse } from '../types';
import { NewProviderRequestValidator, NewProviderResponseValidator } from '../validators';

@injectable()
export class NewProviderTranslator extends BaseTranslator<HoloRequest, NewProviderRequest> {
    protected holoValidator = HoloRequestValidator;
    protected providerValidator = NewProviderRequestValidator;

    protected async toHoloManyImpl(source: NewProviderResponse): Promise<Partial<HoloResponse>[]> {
        return [{
            id: source.id,
            model: source.model,
            messages: [{
                role: 'assistant',
                content: source.output
            }],
            usage: source.usage ? {
                input_tokens: source.usage.input_tokens,
                output_tokens: source.usage.output_tokens,
                total_tokens: source.usage.input_tokens + source.usage.output_tokens
            } : undefined
        }];
    }

    protected async fromHoloManyImpl(source: HoloRequest): Promise<Partial<NewProviderRequest>[]> {
        return [{
            model: source.model,
            prompt: this.extractPrompt(source.messages),
            temperature: source.temperature,
            max_tokens: source.max_tokens
        }];
    }

    private extractPrompt(messages: HoloMessage[]): string {
        // Combine messages into single prompt
        return messages
            .map(m => typeof m.content === 'string' ? m.content : '')
            .join('\n');
    }
}
```

---

## Creating Request/Response Translators

### Step 1: Review Field Mappings

Create a mapping table (see [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)):

| Holo Field | Provider Field | Type |
|------------|---------------|------|
| `model` | `model` | Direct |
| `temperature` | `temperature` | Direct |
| `max_tokens` | `max_length` | Renamed |
| `top_k` | ❌ | Not supported |

### Step 2: Implement Request Translator

**File:** `translators/newprovider.request.translator.ts`

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseTranslator } from '../../base.translator';
import { HoloRequest, HoloRequestValidator } from '../../holo';
import { NewProviderRequest, NewProviderRequestValidator } from '../types';
import { pickDefined } from '../../utils';

@injectable()
export class NewProviderRequestTranslator extends BaseTranslator<HoloRequest, NewProviderRequest> {
    protected holoValidator = HoloRequestValidator;
    protected providerValidator = NewProviderRequestValidator;

    protected async fromHoloManyImpl(source: HoloRequest): Promise<Partial<NewProviderRequest>[]> {
        const logger = this.mlog(this.fromHoloManyImpl);

        // Warn about unsupported fields
        if (source.top_k !== undefined) {
            logger.warn('top_k not supported by NewProvider - ignoring');
        }

        return [pickDefined({
            model: source.model,
            prompt: this.buildPrompt(source),
            temperature: source.temperature,
            max_length: source.max_tokens,  // ← Renamed field
            // ... other mappings
        })];
    }

    protected async toHoloManyImpl(source: NewProviderRequest): Promise<Partial<HoloRequest>[]> {
        return [pickDefined({
            model: source.model,
            messages: this.parsePrompt(source.prompt),
            temperature: source.temperature,
            max_tokens: source.max_length,  // ← Reverse mapping
            // ... other mappings
        })];
    }

    private buildPrompt(request: HoloRequest): string {
        // Convert Holo messages to provider prompt format
        const parts: string[] = [];

        if (request.system) {
            parts.push(`System: ${request.system}`);
        }

        for (const message of request.messages) {
            const content = typeof message.content === 'string'
                ? message.content
                : message.content.map(c => c.type === 'text' ? c.text : '').join('');
            parts.push(`${message.role}: ${content}`);
        }

        return parts.join('\n\n');
    }

    private parsePrompt(prompt: string): HoloMessage[] {
        // Parse provider prompt into Holo messages (if needed)
        return [{ role: 'user', content: prompt }];
    }
}
```

### Step 3: Implement Response Translator

**File:** `translators/newprovider.response.translator.ts`

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseTranslator } from '../../base.translator';
import { HoloResponse, HoloResponseValidator } from '../../holo';
import { NewProviderResponse, NewProviderResponseValidator } from '../types';
import { pickDefined } from '../../utils';

@injectable()
export class NewProviderResponseTranslator extends BaseTranslator<HoloResponse, NewProviderResponse> {
    protected holoValidator = HoloResponseValidator;
    protected providerValidator = NewProviderResponseValidator;

    protected async toHoloManyImpl(source: NewProviderResponse): Promise<Partial<HoloResponse>[]> {
        return [pickDefined({
            id: source.id,
            model: source.model,
            messages: [{
                role: 'assistant' as const,
                content: source.output
            }],
            finish_reason: this.mapFinishReason(source.stop_reason),
            usage: source.usage ? {
                input_tokens: source.usage.input_tokens,
                output_tokens: source.usage.output_tokens,
                total_tokens: source.usage.input_tokens + source.usage.output_tokens
            } : undefined
        })];
    }

    protected async fromHoloManyImpl(source: HoloResponse): Promise<Partial<NewProviderResponse>[]> {
        const content = source.messages[0]?.content;
        const output = typeof content === 'string'
            ? content
            : content?.map(c => c.type === 'text' ? c.text : '').join('') || '';

        return [pickDefined({
            id: source.id,
            model: source.model,
            output,
            usage: source.usage ? {
                input_tokens: source.usage.input_tokens,
                output_tokens: source.usage.output_tokens
            } : undefined
        })];
    }

    private mapFinishReason(reason?: string): string | null {
        const mapping: Record<string, string> = {
            'complete': 'stop',
            'max_length': 'length',
            'error': 'content_filter'
        };

        return reason ? (mapping[reason] ?? null) : null;
    }
}
```

---

## Creating Streaming Translators

### Step 1: Document Streaming Events

Create `STREAM_RESPONSE.md` documenting all event types.

### Step 2: Create Event Translators

**One translator per event type.**

**File:** `translators/streaming/newprovider.content.delta.translator.ts`

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseStreamTranslator } from '../../../base.stream.translator';
import { HoloStreamChunk, HoloStreamChunkValidator } from '../../../holo';
import { NewProviderStreamChunk, NewProviderStreamChunkValidator } from '../../types';
import { pickDefined } from '../../../utils';

@injectable()
export class NewProviderContentDeltaTranslator extends BaseStreamTranslator<HoloStreamChunk, NewProviderStreamChunk> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = NewProviderStreamChunkValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<NewProviderStreamChunk> = {};

    protected async toHoloManyImpl(source: NewProviderStreamChunk): Promise<Partial<HoloStreamChunk>[]> {
        // Skip if no content
        if (!source.delta || source.done) {
            return [];
        }

        return [pickDefined({
            id: source.id,
            model: source.model,
            delta: {
                provider: 'newprovider' as const,
                type: 'content_delta' as const,
                delta: {
                    content: source.delta
                },
                provider_delta: source  // ← Full raw chunk
            }
        })];
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<NewProviderStreamChunk>[]> {
        const d = source.delta;
        if (!d || d.type !== 'content_delta') return [];

        // Fast pass-through
        if (d.provider === 'newprovider' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        // Reconstruct
        return [pickDefined({
            id: source.id || this.providerDefaults.id,
            model: source.model || this.providerDefaults.model,
            delta: d.delta.content || '',
            done: false
        })];
    }
}
```

### Step 3: Create Stream Orchestrator

**File:** `translators/streaming/newprovider.stream.translator.ts`

```typescript
import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { BaseStreamTranslator } from '../../../base.stream.translator';
import { HoloStreamChunk, HoloStreamChunkValidator } from '../../../holo';
import { NewProviderStreamChunk, NewProviderStreamChunkValidator } from '../../types';
import { NewProviderContentDeltaTranslator } from './newprovider.content.delta.translator';
import { NewProviderMessageStopTranslator } from './newprovider.message.stop.translator';

@injectable()
export class NewProviderStreamTranslator extends BaseStreamTranslator<HoloStreamChunk, NewProviderStreamChunk> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = NewProviderStreamChunkValidator;

    constructor(
        private readonly contentDeltaTranslator: NewProviderContentDeltaTranslator,
        private readonly messageStopTranslator: NewProviderMessageStopTranslator
    ) {
        super();
    }

    protected async toHoloManyImpl(source: NewProviderStreamChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // Route to appropriate translator
        if (!source.done) {
            results.push(...await this.contentDeltaTranslator.toHoloMany(source));
        } else {
            results.push(...await this.messageStopTranslator.toHoloMany(source));
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<NewProviderStreamChunk>[]> {
        const d = source.delta;
        if (!d) return [];

        // Fast pass-through
        if (d.provider === 'newprovider' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        // Route by delta type
        switch (d.type) {
            case 'content_delta':
                return this.contentDeltaTranslator.fromHoloMany(source);
            case 'message_stop':
                return this.messageStopTranslator.fromHoloMany(source);
            default:
                return [];
        }
    }
}
```

---

## Writing Validators

### ArkType Basics

```typescript
import { type } from 'arktype';

// Simple types
const StringValidator = type('string');
const NumberValidator = type('number');
const BooleanValidator = type('boolean');

// Optional fields (use ? suffix)
const OptionalField = type({
    'required_field': 'string',
    'optional_field?': 'number'
});

// Arrays
const ArrayValidator = type('string[]');

// Objects
const ObjectValidator = type({
    name: 'string',
    age: 'number'
});

// Unions
const UnionValidator = type('string | number');

// Enums
const EnumValidator = type("'option1' | 'option2' | 'option3'");

// Complex types
const ComplexValidator = type({
    id: 'string',
    data: type({
        nested: 'string',
        'optional?': 'number'
    }),
    'items?': type('string[]')
});
```

### Validator Best Practices

1. **Required = no ?** suffix
2. **Optional = ? suffix**
3. **Check validators first** before implementing
4. **Use unions** for polymorphic fields
5. **Validate inputs and outputs**

---

## Testing Strategy

### Unit Tests

**Test each translator in isolation:**

```typescript
describe('NewProviderRequestTranslator', () => {
    let translator: NewProviderRequestTranslator;

    beforeEach(() => {
        translator = new NewProviderRequestTranslator();
    });

    test('fromHolo: maps fields correctly', async () => {
        const holo: HoloRequest = {
            model: 'test-model',
            messages: [{ role: 'user', content: 'Hello' }],
            temperature: 0.7,
            max_tokens: 100
        };

        const result = await translator.fromHoloMany(holo);

        expect(result).toHaveLength(1);
        expect(result[0].model).toBe('test-model');
        expect(result[0].temperature).toBe(0.7);
        expect(result[0].max_length).toBe(100);  // Renamed field
    });

    test('toHolo: reverse mapping works', async () => {
        const provider: NewProviderRequest = {
            model: 'test-model',
            prompt: 'Hello',
            temperature: 0.7,
            max_length: 100
        };

        const result = await translator.toHoloMany(provider);

        expect(result).toHaveLength(1);
        expect(result[0].model).toBe('test-model');
        expect(result[0].max_tokens).toBe(100);
    });
});
```

### Integration Tests

**Test full pipeline:**

```typescript
test('Full request/response cycle', async () => {
    const holoRequest: HoloRequest = { /* ... */ };

    // Holo → Provider
    const providerRequest = await requestTranslator.fromHoloMany(holoRequest);

    // Call provider (mocked)
    const providerResponse = await mockProvider.call(providerRequest[0]);

    // Provider → Holo
    const holoResponse = await responseTranslator.toHoloMany(providerResponse);

    expect(holoResponse[0].messages[0].role).toBe('assistant');
});
```

### Round-Trip Tests

**Verify lossless translation:**

```typescript
test('Round-trip fidelity', async () => {
    const original: NewProviderStreamChunk = { /* ... */ };

    // Provider → Holo
    const holo = await translator.toHoloMany(original);

    // Holo → Provider (with pass-through)
    const reconstructed = await translator.fromHoloMany(holo[0]);

    expect(reconstructed[0]).toEqual(original);
});
```

---

## Common Pitfalls

### ❌ Pitfall 1: Adding State to Translators

```typescript
// ❌ Bad
export class BadTranslator {
    private counter = 0;  // State

    protected async toHoloManyImpl(source) {
        this.counter++;  // Depends on previous calls
    }
}

// ✅ Good
export class GoodTranslator {
    protected async toHoloManyImpl(source) {
        // Pure function - no state
        return [this.mapToHolo(source)];
    }
}
```

### ❌ Pitfall 2: Fabricating Defaults

```typescript
// ❌ Bad
model: source.model || ''  // Empty string

// ✅ Good
model: source.model || this.providerDefaults.model
if (!model) logger.warn('Model missing')
```

### ❌ Pitfall 3: Creating Lean provider_delta

```typescript
// ❌ Bad
provider_delta: { id: source.id, delta: source.delta }

// ✅ Good
provider_delta: source  // Full raw chunk
```

### ❌ Pitfall 4: Not Using Validators

```typescript
// ❌ Bad
return { model: source.model } as HoloRequest;  // Unsafe cast

// ✅ Good
const result = this.holoValidator({ model: source.model });
if (result instanceof ArkErrors) throw new Error(result.summary);
return result;
```

### ❌ Pitfall 5: Trimming Whitespace

```typescript
// ❌ Bad
content: source.content.trim()

// ✅ Good
content: source.content  // Preserve whitespace
```

---

## Troubleshooting

### Issue: Validation Errors

**Problem:** Translator fails validation.

**Solution:**
1. Check validator definition
2. Use `failQuietly: true` during development
3. Log validation errors: `logger.debug(validated.summary)`

### Issue: Missing Fields

**Problem:** Required fields not populated.

**Solution:**
1. Check field mapping in TRANSLATION_GUIDE.md
2. Use `pickDefined()` to remove undefined fields
3. Use `providerDefaults` for orchestrator-injected values

### Issue: Type Errors

**Problem:** TypeScript type mismatch.

**Solution:**
1. Review validators (source of truth for types)
2. Use `Partial<T>` in `toHoloManyImpl`/`fromHoloManyImpl`
3. Only cast after `pickDefined()`: `pickDefined({...}) as Partial<T>`

### Issue: Streaming Not Working

**Problem:** Events not emitting correctly.

**Solution:**
1. Check event sequence in STREAM_RESPONSE.md
2. Verify orchestrator routes to correct translator
3. Test each event translator individually
4. Check for empty array returns (no-ops)

---

## Checklist

### Pre-Implementation
- [ ] Review existing types in `src/providers/{provider}/types/`
- [ ] Review existing validators in `src/providers/{provider}/validators/`
- [ ] Create documentation (REQUEST_TYPES.md, RESPONSE_TYPES.md, STREAM_RESPONSE.md)
- [ ] Define field mappings (create mapping table)

### Implementation
- [ ] Create types
- [ ] Create validators (check these first!)
- [ ] Implement request translator
- [ ] Implement response translator
- [ ] Implement streaming translators (if supported)
- [ ] Implement orchestrator
- [ ] Export all from index.ts

### Testing
- [ ] Unit tests for each translator
- [ ] Integration tests for full pipeline
- [ ] Round-trip tests for lossless translation
- [ ] Multi-choice tests (if applicable)
- [ ] Edge case tests (empty arrays, missing fields, etc.)

### Documentation
- [ ] Update TYPE_REFERENCE.md with provider comparison
- [ ] Update TRANSLATION_GUIDE.md with field mappings
- [ ] Update STREAMING_GUIDE.md (if streaming supported)
- [ ] Create provider README.md

---

## Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Core patterns and principles
- **[TYPE_REFERENCE.md](TYPE_REFERENCE.md)** - Holo types and comparisons
- **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - Field mapping tables
- **[STREAMING_GUIDE.md](STREAMING_GUIDE.md)** - Streaming implementation

---

**Last Updated**: 2025-10-05
**Version**: 1.0.0 (Consolidated Documentation)
