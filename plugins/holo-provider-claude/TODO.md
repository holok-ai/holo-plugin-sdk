# Claude Provider Plugin - Todo List

> **Context**: This plugin was extracted from the monolithic `src/providers/claude/` architecture as part of the migration to plugin-based providers. This TODO tracks remaining work to complete the migration and achieve full Holo format compliance.

---

## Migration Status

### ✅ Completed

- [x] Extract provider logic from monolith to plugin package
- [x] Create plugin manifest with configuration schema
- [x] Migrate to `@holokai/sdk` imports
- [x] Implement `ProviderPlugin` contract
- [x] Add auto-discovery support
- [x] Preserve streaming orchestration logic
- [x] Maintain tool calling extraction
- [x] Document complete Holo format mappings in README

### 🔄 In Progress

- [ ] Migrate internal types to use SDK types exclusively (#SDK-1)
- [ ] Complete stateful orchestrator implementation (#STREAM-1)
- [ ] Add comprehensive validation tests (#TEST-1)

---

## High Priority

### #SDK-1: Complete SDK Type Migration

**Files**: Multiple translator files
**Status**: 🔄 In Progress
**Priority**: P0

**Current State**:
- Plugin imports from `@holokai/sdk` for public APIs
- Internal translators still may use legacy type patterns
- Need to verify all `Record<string, unknown>` instances are removed

**Required Actions**:

1. **Audit all type usages**:
   ```bash
   grep -r "Record<string, unknown>" src/
   grep -r ": any" src/
   ```

2. **Replace with SDK types**:
   - Tool parameters: Use `HoloJsonSchema` instead of `Record<string, unknown>`
   - Tool arguments: Use `HoloFunctionArguments` instead of flexible types
   - All Holo types: Import from `@holokai/sdk`

3. **Update validators**:
   ```typescript
   // Before
   parameters?: Record<string, unknown>

   // After
   parameters?: HoloJsonSchema
   ```

**Reference**: See [SDK Capability Analysis](../../packages/sdk/docs/CAPABILITY_ANALYSIS.md#type-safety-analysis)

**Impact**: Critical for type safety compliance with Holo spec

---

### #STREAM-1: Complete Stateful Orchestrator Implementation

**File**: `src/translators/streaming/claude.stream.translator.ts`
**Lines**: 17-112
**Status**: ⚠️ Partially Implemented
**Priority**: P0

**Current State**:
- README describes orchestrator as "stateful" (README.md:335)
- Implementation is largely stateless, just routes events
- Quick fix (#0 in old TODO) added for cross-provider translation
- No content block tracking by index
- No delta accumulation logic
- No complete tool call extraction on block completion

**Required Actions**:

1. **Add state tracking**:
   ```typescript
   private contentBlocks: Map<number, {
     type: 'text' | 'tool_use';
     accumulated: string | object;
     toolId?: string;
     toolName?: string;
   }> = new Map();

   private currentMessageId?: string;
   private currentModel?: string;
   ```

2. **Implement accumulation in `toHoloManyImpl`**:
   - `content_block_start`: Initialize block state by index
   - `content_block_delta`: Accumulate text/tool deltas by index
   - `content_block_stop`: Emit complete content, extract tool calls
   - `message_stop`: Reset state for next message

3. **Handle tool call extraction**:
   - On `content_block_stop` for `tool_use` blocks
   - Extract: `content[i].type='tool_use'` → `tool_calls[].type='function'`
   - Map: `content[i].id` → `tool_calls[].id`
   - Map: `content[i].name` → `tool_calls[].function.name`
   - Map: `content[i].input` → `tool_calls[].function.arguments`

**Architecture Decision Needed**:
- This requires making orchestrators stateful, which may conflict with "stateless translator" principle
- Need to clarify: Are orchestrators exempt from statelessness rule?
- Alternative: Move state to separate accumulator class

**Reference**:
- [Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#streaming-mappings)
- [SDK Streaming Docs](../../packages/sdk/docs/README.md#streaming-accumulation)

**Impact**: Core functionality for tool calling and multi-block content

---

### #TEST-1: Add Comprehensive Validation Tests

**Status**: ❌ Not Started
**Priority**: P0

**Current State**:
- Basic unit tests exist
- No comprehensive SDK validation tests
- No round-trip translation tests
- No multi-choice streaming tests

**Required Actions**:

1. **Add SDK compliance tests**:
   ```typescript
   describe('SDK Type Compliance', () => {
     it('should use HoloJsonSchema for tool parameters', () => {
       // Verify no Record<string, unknown>
     });

     it('should use HoloFunctionArguments for tool call arguments', () => {
       // Verify proper typing
     });
   });
   ```

2. **Add round-trip tests**:
   ```typescript
   describe('Round-Trip Translation', () => {
     it('should preserve core fields: Holo → Claude → Holo', () => {
       const original: HoloRequest = { /* ... */ };
       const claude = translator.fromHolo(original);
       const roundTrip = translator.toHolo(claude);
       expect(roundTrip).toMatchObject(original);
     });

     it('should drop Claude-specific fields gracefully', () => {
       // Verify thinking, betas, etc. don't leak to Holo
     });
   });
   ```

3. **Add streaming orchestration tests**:
   ```typescript
   describe('Streaming Orchestration', () => {
     it('should accumulate deltas by content block index', () => {
       // Multi-block streaming test
     });

     it('should extract complete tool calls on block stop', () => {
       // Tool streaming test
     });

     it('should preserve raw events in provider_delta', () => {
       // Round-trip fidelity test
     });
   });
   ```

4. **Add validation tests per SDK docs**:
   - See [SDK README Testing Section](../../packages/sdk/docs/README.md#testing)
   - Verify all mappings from [Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md)

**Impact**: Confidence in migration completeness and SDK compliance

---

## Medium Priority

### #PERF-1: Add Pass-Through Optimization for Same-Provider Streaming

**Files**: Multiple event translators
**Status**: ⚠️ Partially Implemented
**Priority**: P1

**Current State**:
- Some translators have pass-through logic (e.g., content.block.delta for tools)
- Not consistently applied across all event types
- Missing for: content.block.start, message.delta

**Required Actions**:

1. **Extend pass-through to all event translators**:
   ```typescript
   protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<ClaudeEvent[]> {
     const d = source.delta;
     if (!d || d.type !== 'expected_type') return [];

     // Fast pass-through for same-provider
     if (d.provider === 'claude' && d.provider_delta) {
       const validated = this.providerValidator(d.provider_delta);
       if (!(validated instanceof ArkErrors)) {
         return [validated];
       }
     }

     // Reconstruct from Holo format...
   }
   ```

2. **Apply to**:
   - `claude.content.block.start.event.translator.ts`
   - `claude.message.delta.event.translator.ts`
   - Any others missing pass-through

**Reference**: [Provider Mappings - Raw Event Preservation](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#streaming-response-structures)

**Impact**: Performance optimization for Claude→Claude streaming (30-50% faster)

---

### #DOC-1: Align README with SDK Mappings

**File**: `README.md`
**Status**: ✅ **COMPLETED** (2025-12-18)
**Priority**: P1

**Actions Taken**:
- ✅ Added complete Holo format mapping tables
- ✅ Referenced SDK documentation
- ✅ Documented migration from monolith
- ✅ Added type safety migration examples
- ✅ Cross-referenced Provider Mappings docs
- ✅ Documented streaming orchestration
- ✅ Added finish reason mapping table

---

### #CONFIG-1: Validate Plugin Configuration Against Manifest Schema

**File**: `src/plugin.ts`
**Status**: ❌ Not Started
**Priority**: P1

**Required Actions**:
- Add runtime validation of plugin config against manifest.configSchema
- Throw descriptive errors for invalid configurations
- Add tests for config validation

**Example**:
```typescript
import Ajv from 'ajv';
import { manifest } from './manifest';

const ajv = new Ajv();
const validateConfig = ajv.compile(manifest.configSchema);

export class ClaudeProviderPlugin {
  constructor(config: unknown) {
    if (!validateConfig(config)) {
      throw new ConfigurationError(validateConfig.errors);
    }
    // ...
  }
}
```

---

## Low Priority

### #FEAT-1: Add Extended Thinking Block Support

**Status**: ❌ Not Started
**Priority**: P2

**Current State**:
- README mentions `content[].type='thinking'` blocks (README.md:388)
- No translator handles thinking blocks
- Currently dropped during translation

**Required Actions**:
1. Add thinking block handling in content translators
2. Options:
   - **Option A**: Preserve in `provider_delta` only (Claude-specific)
   - **Option B**: Map to `metadata.thinking` field
   - **Option C**: Add to Holo SDK as experimental feature

**Decision Needed**: How should Claude-specific thinking blocks be exposed?

**Reference**: [SDK Provider Mappings - Provider-Specific Content](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#provider-specific-content-intentionally-excluded)

---

### #FEAT-2: Add Integration Tests with Real API

**Status**: ❌ Not Started
**Priority**: P2

**Required Actions**:
1. Add `tests/integration/` directory
2. Implement real API tests:
   ```typescript
   describe('Claude API Integration', () => {
     it('should complete chat request', async () => {
       // Requires ANTHROPIC_API_KEY
     });

     it('should stream responses', async () => {
       // Test real streaming
     });

     it('should handle tool calls', async () => {
       // Test function calling
     });
   });
   ```
3. Add CI/CD integration (with secret management)

---

### #DOC-2: Document Cancellation Behavior

**File**: `src/claude.provider.ts`
**Status**: ❌ Not Started
**Priority**: P2

**Current State**:
- No visible cancellation handling
- Need to verify no synthetic `message_stop` is created on cancellation

**Required Actions**:
1. Document cancellation behavior in README
2. Add tests for cancellation scenarios
3. Verify streaming interruption handling
4. Ensure no synthetic events on abort

---

### #DOC-3: Add Event Ordering Guarantees Documentation

**Status**: ❌ Not Started
**Priority**: P2

**Required Actions**:
- Document Claude's event ordering guarantees
- Document Holo's ordering preservation requirements
- Add integration tests to verify ordering

**Example**:
```markdown
### Event Ordering Guarantees

Claude API provides the following ordering:
1. `message_start` (first)
2. `content_block_start[i]` for each block
3. `content_block_delta[i]` (multiple, in order)
4. `content_block_stop[i]` for each block
5. `message_delta` (usage/finish)
6. `message_stop` (last)

The orchestrator preserves this ordering in Holo format.
```

---

## Completed Items (Archive)

### ~~#COMPAT-0: Synthesize content_block_start/stop for Cross-Provider Translation~~ ✅

**Status**: ✅ **COMPLETED** (2025-10-06)
**File**: `src/translators/streaming/claude.stream.translator.ts`
**Lines**: 69, 73-90, 117-131

**Solution Implemented**:
- Detect cross-provider translation by checking `!provider_delta`
- Synthesize `content_block_start[0]` on `message_start`
- Synthesize `content_block_stop[0]` on `message_stop`
- Enables OpenAI→Claude and Ollama→Claude streaming

**Note**: This is a temporary solution. Full orchestrator (#STREAM-1) will handle multi-block scenarios properly.

---

## Notes

### Migration Philosophy

This plugin maintains the core translation logic from the monolithic architecture while:
1. ✅ Using SDK types exclusively for public contracts
2. ✅ Implementing plugin discovery and lifecycle
3. ✅ Providing independent versioning
4. 🔄 Achieving full SDK compliance (in progress)

### SDK Compliance Checklist

- [x] Uses `@holokai/sdk` imports
- [ ] No `Record<string, unknown>` in production paths (#SDK-1)
- [ ] No `any` types in production paths (#SDK-1)
- [ ] Full round-trip testing (#TEST-1)
- [ ] Streaming orchestration complete (#STREAM-1)
- [ ] Config validation (#CONFIG-1)

### Reference Documentation

**Primary**:
- [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md) - Authoritative mapping reference
- [SDK Capability Analysis](../../packages/sdk/docs/CAPABILITY_ANALYSIS.md) - Type safety requirements
- [SDK Holo Format](../../packages/sdk/docs/HOLO_FORMAT.md) - Format specification

**Legacy** (Archived):
- `src/providers/docs/archive/` - Original monolithic provider docs
- Use SDK docs as source of truth; legacy docs for historical context only

---

## Contributing

When picking up a task:
1. Check SDK documentation first for latest guidance
2. Write tests before implementation
3. Update README.md if adding features
4. Ensure all types come from `@holokai/sdk`
5. Add integration tests for user-facing changes

---

**Last Updated**: 2025-12-18
**Plugin Version**: 0.1.0
**SDK Version**: ^0.1.0
