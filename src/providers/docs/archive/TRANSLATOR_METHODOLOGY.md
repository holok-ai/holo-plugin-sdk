# Stream Translator Implementation Methodology

## Overview
This document outlines the methodology for implementing bidirectional streaming event translators between provider-specific formats and the Holo unified format.

## Core Philosophy
- **STATELESS TRANSLATORS**: ALL translators must be stateless - no tracking between calls
- **1:1 Event Mapping**: Each provider event should map to exactly one Holo event and vice versa
- **No Fabrication**: Never synthesize data that wasn't explicitly provided
- **Bidirectional by Design**: Always implement both `toHolo` and `fromHolo` directions
- **Lossless Round-Tripping**: Preserve raw events in `provider_delta` for perfect reconstruction
- **Strict Typing**: No type casts except after `pickDefined` - let validators enforce contracts

## Implementation Steps

### 1. Review Existing Types and Validators
**ALWAYS START HERE** - Before implementing anything:
- Check `src/providers/{provider}/types/` for already-defined types
- Check `src/providers/{provider}/validators/` for validators that show EXACTLY what's required
- These validators are the source of truth for what fields are mandatory vs optional
- Never guess or fabricate fields - the validators define the contract

Example:
```typescript
// Check the validator first to see requirements
export const ClaudeRawMessageDeltaEventValidator = type({
    type: "'message_delta'",
    delta: type({
        container: 'null',  // Required to be null
        stop_reason: ClaudeStopReasonValidator.or('null'),
        stop_sequence: 'string | null'
    }),
    'usage?': ClaudeUsageValidator  // Optional field
});
```

### 2. Create STREAM_RESPONSE.md for Provider
Document the provider's streaming event structure:
- List all event types with their exact shapes (based on validators)
- Map each event type to corresponding Holo events
- Identify which fields are required vs optional (from validators)
- Note any provider-specific quirks or constraints

### 3. Create Individual Event Translators
For each provider event type (e.g., `message_start`, `content_block_delta`):

```typescript
import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseStreamTranslator} from '../../../base.stream.translator';
import {HoloStreamChunk, HoloStreamChunkValidator} from '../../../holo';
import {ProviderEventType} from '../../types';
import {ProviderEventValidator} from '../../validators';

@injectable()
export class ProviderEventTranslator extends BaseStreamTranslator<HoloStreamChunk, ProviderEventType> {
    protected holoValidator = HoloStreamChunkValidator;
    protected providerValidator = ProviderEventValidator;
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<ProviderEventType> = {};
    
    // NO STATE - translators must be stateless
    // Any state tracking belongs in the orchestrator layer

    constructor(
        // Inject any needed sub-translators (e.g., UsageTranslator)
        private readonly usageTranslator: UsageTranslator
    ) {
        super();
    }

    protected async toHoloManyImpl(source: ProviderEventType): Promise<Partial<HoloStreamChunk>[]> {
        // STATELESS implementation - no tracking between calls
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderEventType>[]> {
        // STATELESS implementation - no tracking between calls
    }
}
```

### 4. Create Orchestrator Stream Translator
The main translator that routes to appropriate sub-translators. This is where any necessary state tracking occurs:

```typescript
@injectable()
export class ProviderStreamTranslator extends BaseStreamTranslator<HoloStreamChunk, ProviderRawStreamEvent> {
    // ... validators and defaults ...
    
    // State tracking (if needed) belongs HERE in orchestrator, NOT in individual translators
    // private messageStartSent = false;  // Example: track if we've sent message_start

    constructor(
        // Inject all event translators
        private readonly contentDeltaTranslator: ContentDeltaEventTranslator,
        // ... etc
    ) {
        super();
    }

    protected async toHoloManyImpl(source: ProviderRawStreamEvent): Promise<Partial<HoloStreamChunk>[]> {
        // Orchestrator handles stateful logic if needed
        // Individual translators remain stateless
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderRawStreamEvent>[]> {
        const d = source.delta;
        if (!d) return [];

        // Fast pass-through for same-provider events
        if (d.provider === 'provider_name' && d.provider_delta) {
            const validated = this.providerValidator(d.provider_delta);
            if (!(validated instanceof ArkErrors)) {
                return [validated];
            }
        }

        // Route based on delta type for efficiency
        switch (d.type) {
            case 'message_start':
                // Handle no-op if provider doesn't support this event
                return [];
            // ... etc
        }
    }
}
```

## Coding Standards

### 1. Imports and Dependencies
- Always start with `import 'reflect-metadata';` for dependency injection
- Use `@injectable()` decorator for all translator classes
- Import validators from the provider's validators module
- Import types from the provider's types module

### 2. Type Safety
- **NEVER** use `as any` or unsafe type casts
- **ALWAYS** check validators first to understand requirements
- Use `pickDefined()` to clean objects, then cast the result:
  ```typescript
  const cleaned = pickDefined({
      field1: source.field1,
      field2: source.field2
  }) as Partial<TargetType>;
  ```
- Let validators handle type enforcement, not manual casting
- When in doubt about what fields are required, refer to the validator:
  ```typescript
  // Instead of guessing, check the validator
  const validated = this.providerValidator(data);
  if (validated instanceof ArkErrors) {
      // Handle validation error - shows what was missing
  }
  ```

### 3. Field Handling
- **Required fields**: Only include if present in source
- **Optional fields**: Omit entirely if undefined (don't set to null/empty)
- **Defaults**: Use `providerDefaults` for orchestrator-injected values (model, id, etc.)
- **Never fabricate empty strings**: Use `uuidv4()` for IDs, `providerDefaults` for model
- **Whitespace preservation**: Never trim whitespace in content - it's semantically meaningful
- **Timestamp conversion**: Always convert time units correctly (provider sec/ms ↔ Holo ms)
- Use existing utilities for common patterns:
  - `uuidv4()` for stable ID generation when needed
  - `safeParse()` for JSON parsing with fallback
  - `mapFinishReason()` for finish reason conversion (no invented defaults)
  - Sub-translators for complex nested structures (e.g., UsageTranslator)
- **Choice index safety**: Always validate with `Number.isInteger(idx) && idx >= 0`

### 4. Provider Delta Preservation
- **Always** include `provider_delta: source` in `toHoloManyImpl` (full raw chunk)
- Enables lossless round-tripping and validator compatibility
- Never create "lean" provider_delta subsets - store the complete source
- Allows cross-provider event reconstruction
- Critical for debugging and auditing
- For per-choice events (stop, tool_calls), still store full source chunk

### 5. Event Routing
- In orchestrator, route by delta type first (avoid calling all translators)
- Maintain strict event ordering (start → delta → stop)
- Only emit events when semantically valid (e.g., check finish_reason maps)
- Support fast pass-through for same-provider streaming

### 6. Comments and Documentation
- **Minimal comments**: Let code be self-documenting
- Only comment non-obvious logic or business rules
- Use comments for:
  - Event ordering requirements
  - Provider-specific quirks
  - Semantic implications not clear from code

### 7. Validation
- Use provider validators to check incoming events
- Check for `ArkErrors` to handle validation failures gracefully
- Pass through validated events when doing same-provider streaming

## Common Patterns

### Per-Choice Event Emission
```typescript
// Emit one event per choice (for multi-choice support)
const results: Partial<HoloStreamChunk>[] = [];
for (const choice of source.choices) {
    if (!choice.finish_reason) continue;
    const choiceIndex = Number.isInteger(choice.index) && choice.index >= 0 ? choice.index : 0;
    results.push(pickDefined({
        id: source.id,
        model: source.model,
        created: source.created * 1000, // sec → ms
        delta: {
            provider: 'provider' as const,
            type: 'message_stop' as const,
            choice: choiceIndex,
            delta: {},
            provider_delta: source // Full raw chunk
        },
        finish_reason: mapFinishReason(choice.finish_reason)
    }));
}
return results;
```

### Handling Usage Data
```typescript
const usage = source.usage
    ? pickDefined({
        input_tokens: source.usage.prompt_tokens,
        output_tokens: source.usage.completion_tokens
      })
    : undefined;
```

### Conditional Event Emission
```typescript
// Only emit if we have meaningful data
if (!stop_reason && !usage) return [];
```

### Pass-Through Pattern (Fast-Path)
```typescript
// Fast pass-through if we already have a provider chunk
if (d.provider === 'openai' && d.provider_delta) {
    const validated = this.providerValidator(d.provider_delta);
    if (!(validated instanceof ArkErrors)) {
        return [validated];
    }
}
```

### Timestamp Conversion
```typescript
// Provider → Holo (sec → ms for OpenAI/Ollama)
created: source.created * 1000

// Holo → Provider (ms → sec)
created: source.created ? Math.floor(source.created / 1000) : Math.floor(Date.now() / 1000)
```

### Logging Missing Defaults
```typescript
const logger = this.mlog(this.fromHoloManyImpl);
if (!model) {
    logger.warn('Translator: model missing; orchestrator should supply via providerDefaults');
}
```

### Parsing Streaming JSON (Tool Arguments)
```typescript
const rawArgs = tc.function?.arguments;
const parsedArgs = safeParse(rawArgs);

// Check if parse succeeded
const isPartialJson = rawArgs && Object.keys(parsedArgs).length === 0;

// Only emit when JSON is complete
if (!isPartialJson) {
    results.push(/* ... with parsedArgs ... */);
} else {
    // Still emit shell with provider_delta for accumulation downstream
    results.push(/* ... with empty delta and provider_delta ... */);
}
```

### Multiple Event Generation
```typescript
// Can return multiple events from one input
const results: Partial<ProviderEvent>[] = [];
results.push(...await this.translator1.fromHoloMany(source));
results.push(...await this.translator2.fromHoloMany(source));
return results;
```

## Anti-Patterns to Avoid

1. **Don't add state to translators**: Keep ALL translators stateless - state belongs in orchestrator
2. **Don't fabricate IDs**: Use `uuidv4()` if needed, never empty strings (`''`)
3. **Don't fabricate model names**: Use `providerDefaults.model`, never `''`
4. **Don't create lean provider_delta**: Always store full source chunk for validation compatibility
5. **Don't trim whitespace in content**: Whitespace is semantically meaningful during streaming
6. **Don't invent finish_reason defaults**: Return `null` for unknown reasons, don't coerce to `'stop'`
7. **Don't skip partial streaming data**: Emit shell events with `provider_delta` for accumulation
8. **Don't mix provider events**: Check provider before processing provider_delta
9. **Don't emit incomplete events**: Ensure all required fields are present
10. **Don't break event ordering**: Maintain start → delta → stop sequence
11. **Don't set `done` in translators**: Leave to orchestrator (multi-choice may finish at different times)
12. **Don't use manual type checks**: Use validators instead
13. **Don't include undefined optional fields**: Use `pickDefined()` to clean
14. **Don't forget choice index**: Always carry choice index for multi-choice support

## Testing Considerations

1. Test both directions (toHolo and fromHolo)
2. Verify round-trip fidelity with provider_delta
3. Test edge cases (empty deltas, missing fields)
4. Validate event ordering in streams
5. Test cross-provider translation scenarios

## File Organization

```
src/providers/{provider}/
├── types/                          # Provider-specific types
├── validators/                     # ArkType validators
├── utils/                         # Shared utilities (mappers, etc.)
└── translators/
    ├── streaming/                 # Stream event translators
    │   ├── index.ts              # Export all translators
    │   ├── {provider}.stream.translator.ts       # Orchestrator
    │   ├── {provider}.message.start.event.translator.ts
    │   ├── {provider}.message.delta.event.translator.ts
    │   ├── {provider}.message.stop.event.translator.ts
    │   ├── {provider}.content.block.start.event.translator.ts
    │   ├── {provider}.content.block.delta.event.translator.ts
    │   └── {provider}.content.block.stop.event.translator.ts
    └── STREAM_RESPONSE.md        # Provider streaming documentation
```

## Checklist for New Provider Implementation

### Pre-Implementation
- [ ] **Review existing types in `src/providers/{provider}/types/`**
- [ ] **Review existing validators in `src/providers/{provider}/validators/`**
- [ ] Create STREAM_RESPONSE.md documenting all event types (based on validators)
- [ ] Define any missing types for provider events
- [ ] Create any missing validators for event types

### Implementation
- [ ] Implement STATELESS individual event translators (using validators as guide)
- [ ] Use `providerDefaults` for model/id when reconstructing chunks
- [ ] Add method-scoped logging with `this.mlog(methodName)`
- [ ] Implement per-choice emission for multi-choice support (n>1)
- [ ] Add choice index validation with `Number.isInteger()` checks
- [ ] Convert timestamps correctly (provider units ↔ Holo ms)
- [ ] Preserve whitespace in content (don't trim)
- [ ] Handle streaming JSON with `safeParse()` utility
- [ ] Emit shell events for partial data (with full `provider_delta`)
- [ ] Use full source chunk in `provider_delta` (not lean subsets)
- [ ] Map finish reasons 1:1 (return `null` for unknown, don't invent defaults)
- [ ] Don't set `done` flag (let orchestrator decide)
- [ ] Implement orchestrator stream translator (with state tracking if needed)
- [ ] Add fast pass-through optimization with full validator check

### Validation
- [ ] Verify all translators attach full raw `provider_delta`
- [ ] Verify all translators are stateless (no state between calls)
- [ ] Test bidirectional translation
- [ ] Test round-trip fidelity (provider → Holo → provider)
- [ ] Test multi-choice scenarios (n>1)
- [ ] Test partial JSON streaming (tool arguments)
- [ ] Test cross-provider translation
- [ ] Export all translators from index.ts