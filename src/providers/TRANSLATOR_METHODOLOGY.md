# Stream Translator Implementation Methodology

## Overview
This document outlines the methodology for implementing bidirectional streaming event translators between provider-specific formats and the Holo unified format.

## Core Philosophy
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

    constructor(
        // Inject any needed sub-translators (e.g., UsageTranslator)
        private readonly usageTranslator: UsageTranslator
    ) {
        super();
    }

    protected async toHoloManyImpl(source: ProviderEventType): Promise<Partial<HoloStreamChunk>[]> {
        // Implementation
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ProviderEventType>[]> {
        // Implementation
    }
}
```

### 3. Create Orchestrator Stream Translator
The main translator that routes to appropriate sub-translators:

```typescript
@injectable()
export class ProviderStreamTranslator extends BaseStreamTranslator<HoloStreamChunk, ProviderRawStreamEvent> {
    // ... validators and defaults ...

    constructor(
        // Inject all event translators
        private readonly messageStartTranslator: MessageStartEventTranslator,
        // ... etc
    ) {
        super();
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
                return this.messageStartTranslator.fromHoloMany(source);
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
- **Defaults**: Only use defaults defined in spec, never fabricate
- Use existing utilities for common patterns:
  - `uuidv4()` for stable ID generation
  - `mapFinishReason()` for finish reason conversion
  - Sub-translators for complex nested structures (e.g., UsageTranslator)

### 4. Provider Delta Preservation
- **Always** include `provider_delta: source` in `toHoloManyImpl`
- Enables lossless round-tripping
- Allows cross-provider event reconstruction
- Critical for debugging and auditing

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

### Handling Usage Data
```typescript
const usage = source.usage
    ? await this.usageTranslator.toHolo(source.usage)
    : undefined;
```

### Conditional Event Emission
```typescript
// Only emit if we have meaningful data
if (!stop_reason && !usage) return [];
```

### Pass-Through Pattern
```typescript
if (d.provider === 'claude' && d.provider_delta) {
    const validated = this.providerValidator(d.provider_delta);
    if (!(validated instanceof ArkErrors) && validated.type === 'expected_type') {
        return [validated];
    }
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

1. **Don't fabricate IDs**: Use `uuidv4()` if needed, never empty strings
2. **Don't assume defaults**: Only use explicitly defined defaults
3. **Don't mix provider events**: Check provider before processing provider_delta
4. **Don't emit incomplete events**: Ensure all required fields are present
5. **Don't break event ordering**: Maintain start → delta → stop sequence
6. **Don't synthesize stop events**: Leave to orchestrator layer
7. **Don't use manual type checks**: Use validators instead
8. **Don't include undefined optional fields**: Use `pickDefined()` to clean

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

- [ ] **Review existing types in `src/providers/{provider}/types/`**
- [ ] **Review existing validators in `src/providers/{provider}/validators/`**
- [ ] Create STREAM_RESPONSE.md documenting all event types (based on validators)
- [ ] Define any missing types for provider events
- [ ] Create any missing validators for event types
- [ ] Implement individual event translators (using validators as guide)
- [ ] Implement orchestrator stream translator
- [ ] Add fast pass-through optimization
- [ ] Verify all translators attach provider_delta
- [ ] Test bidirectional translation
- [ ] Test round-trip fidelity
- [ ] Export all translators from index.ts