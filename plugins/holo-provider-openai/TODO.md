# OpenAI Provider Plugin - Todo List

> **Context**: This plugin was extracted from the monolithic `src/providers/openai/` architecture as part of the migration to plugin-based providers. This TODO tracks remaining work to complete the migration and achieve full Holo format compliance.

---

## Migration Status

### ✅ Completed

- [x] Extract provider logic from monolith to plugin package
- [x] Create plugin manifest with configuration schema
- [x] Migrate to `@holokai/sdk` imports
- [x] Implement `ProviderPlugin` contract
- [x] Add auto-discovery support
- [x] Preserve streaming orchestration logic
- [x] Maintain tool calling support (direct mapping)
- [x] Support dual API routing (Chat Completions + Responses)
- [x] Implement comprehensive type system (228 types, 200 validators)
- [x] Document complete Holo format mappings in README

### 🔄 In Progress

- [ ] Complete SDK type migration (#SDK-1)
- [ ] Add comprehensive validation tests (#TEST-1)
- [ ] Implement Responses API response translator (#RESP-1)
- [ ] Add tool call arguments parsing (#TOOL-1)

---

## High Priority (P0 - Critical)

### #CRITICAL-1: Convert Timestamp from Seconds to Milliseconds

**Files**:
- `src/translators/openai.chatcompletion.response.translator.ts`
- `src/translators/streaming/openai.message.start.translator.ts`
- `src/translators/streaming/openai.message.delta.translator.ts`

**Issue**: OpenAI returns `created` as Unix timestamp in seconds. Per [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#openai--holo-responses), must convert to milliseconds.

**Current Code**:
```typescript
created: source.created  // ❌ Seconds, not milliseconds
```

**Required Fix**:
```typescript
created: source.created ? source.created * 1000 : undefined  // ✅ Milliseconds
```

**Reference**: [SDK Provider Mappings - Timestamp Normalization](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#timestamp-normalization)

**Impact**: Timestamp type mismatch; consumers expect milliseconds per Holo spec

**Priority**: P0 (Critical)

---

### #TOOL-1: Parse Tool Call Arguments from JSON String

**Files**:
- `src/translators/openai.chatcompletion.response.translator.ts`
- `src/translators/streaming/openai.message.delta.translator.ts`

**Issue**: OpenAI returns `tool_calls[].function.arguments` as JSON string. Holo expects parsed object.

**Current Behavior**:
```typescript
// OpenAI returns
tool_calls: [{
  function: {
    name: 'get_weather',
    arguments: '{"location":"SF"}'  // ❌ String
  }
}]
```

**Required Action**:
```typescript
private parseToolCallArguments(toolCalls: OpenAIToolCall[]): HoloToolCall[] {
  return toolCalls.map(tc => ({
    ...tc,
    function: {
      ...tc.function,
      arguments: typeof tc.function.arguments === 'string'
        ? JSON.parse(tc.function.arguments)  // ✅ Parse to object
        : tc.function.arguments
    }
  }));
}
```

**Edge Cases**:
- Empty string `""` → Parse as `null` or `{}`?
- Invalid JSON → Log warning and return raw string?
- Already parsed object → Pass through

**Reference**: [SDK Provider Mappings - Tool Call Mapping](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#tool-call-mappings)

**Impact**: Tool call arguments unusable in Holo format; consumers expect object

**Priority**: P0 (Critical)

---

### #STREAM-1: Synthesize message_start Event on First Chunk

**File**: `src/translators/streaming/openai.stream.translator.ts`
**Lines**: TBD (in orchestrator)

**Issue**: OpenAI doesn't emit explicit `message_start` event. Per [SDK Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#streaming-mappings), orchestrator must synthesize on first chunk.

**Current Behavior**:
- First chunk has `delta.role` field
- No explicit message_start emitted
- Consumers expect message_start before content

**Required Action**:
```typescript
export class OpenAIStreamTranslator extends BaseStreamTranslator {
    private hasEmittedStart = false;

    protected async toHoloManyImpl(source: OpenAIChatChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        // Emit message_start on first chunk (when delta.role present)
        if (source.choices[0]?.delta?.role && !this.hasEmittedStart) {
            results.push({
                id: source.id,
                model: source.model,
                created: source.created * 1000,  // Convert to ms
                delta: {
                    provider: 'openai',
                    type: 'message_start',
                    delta: { role: source.choices[0].delta.role },
                    provider_delta: source
                }
            });
            this.hasEmittedStart = true;
        }

        // Continue with existing logic...
        return results;
    }
}
```

**Architecture Note**: Requires stateful orchestrator (track `hasEmittedStart`). May conflict with "stateless translator" principle.

**Reference**: [SDK Streaming Docs](../../packages/sdk/docs/README.md#streaming)

**Impact**: Missing `message_start` event; consumers expect it per Holo spec

**Priority**: P0 (Critical)

---

## High Priority (P1)

### #SDK-1: Complete SDK Type Migration

**Files**: Multiple translator files

**Status**: 🔄 In Progress

**Priority**: P1

**Current State**:
- Plugin imports from `@holokai/sdk` for public APIs
- Validators use ArkType with 200/228 validators (88% coverage)
- Need to audit remaining `Record<string, unknown>` instances
- Need to verify all tool parameters use `HoloJsonSchema`

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

3. **Complete remaining validators**: 28 types still need validators (12% gap)

**Reference**: [SDK Capability Analysis - Type Safety](../../packages/sdk/docs/CAPABILITY_ANALYSIS.md#type-safety-analysis)

**Impact**: Critical for type safety compliance with Holo spec

---

### #TEST-1: Add Comprehensive Validation Tests

**Status**: ❌ Not Started

**Priority**: P1

**Current State**:
- Basic unit tests exist
- No comprehensive SDK validation tests
- No round-trip translation tests
- No multi-choice streaming tests
- No dual API routing tests

**Required Actions**:

1. **Add SDK compliance tests**:
   ```typescript
   describe('SDK Type Compliance', () => {
     it('should use HoloJsonSchema for tool parameters', () => {
       // Verify no Record<string, unknown>
     });

     it('should parse tool call arguments to objects', () => {
       // Verify JSON.parse() usage
     });

     it('should convert timestamps to milliseconds', () => {
       // Verify created * 1000
     });
   });
   ```

2. **Add round-trip tests**:
   ```typescript
   describe('Round-Trip Translation', () => {
     it('should preserve core fields: Holo → OpenAI Chat → Holo', () => {
       const original: HoloRequest = { /* ... */ };
       const openai = translator.fromHolo(original);
       const roundTrip = translator.toHolo(openai);
       expect(roundTrip).toMatchObject(original);
     });

     it('should drop OpenAI-specific fields gracefully', () => {
       // Verify logprobs, logit_bias, etc. don't leak to Holo
     });
   });
   ```

3. **Add dual API routing tests**:
   ```typescript
   describe('Dual API Routing', () => {
     it('should route to Chat Completions when messages present', () => {
       // Test Chat API selection
     });

     it('should route to Responses API when input present', () => {
       // Test Responses API selection
     });

     it('should handle ambiguous requests correctly', () => {
       // Test routing decision logic
     });
   });
   ```

4. **Add streaming tests**:
   ```typescript
   describe('Streaming Orchestration', () => {
     it('should emit message_start on first chunk', () => {
       // Test message_start synthesis
     });

     it('should accumulate content deltas', () => {
       // Test content_delta accumulation
     });

     it('should handle multi-choice streaming', () => {
       // Test choice index tracking (n>1)
     });

     it('should preserve raw chunks in provider_delta', () => {
       // Round-trip fidelity test
     });
   });
   ```

5. **Add validation tests per SDK docs**:
   - See [SDK README Testing Section](../../packages/sdk/docs/README.md#testing)
   - Verify all mappings from [Provider Mappings](../../packages/sdk/docs/PROVIDER_MAPPINGS.md)

**Impact**: Confidence in migration completeness and SDK compliance

---

### #RESP-1: Implement Responses API Response Translator

**Files**:
- `src/translators/openai.responses.response.translator.ts` (create)
- `src/translators/streaming/openai.responses.stream.translator.ts` (create)

**Status**: ❌ Not Started

**Priority**: P1

**Current State**:
- Responses API request translator exists
- Response translator not implemented
- Streaming translator not implemented
- Services handle Responses API directly without translation

**Required Actions**:

1. **Create response translator**:
   ```typescript
   export class OpenAIResponseResponseTranslator extends BaseTranslator<
     OpenAIResponse,
     HoloResponse
   > {
     protected async toHoloImpl(source: OpenAIResponse): Promise<HoloResponse> {
       // Map Responses API structure to Holo format
       // Extract output items, usage, etc.
     }

     protected async fromHoloImpl(source: HoloResponse): Promise<OpenAIResponse> {
       // Map Holo format to Responses API structure
     }
   }
   ```

2. **Create streaming translator**: Handle 54 event types from Responses API
   - Map lifecycle events (created, queued, in_progress, completed, etc.)
   - Map text events (delta, done)
   - Map tool call events (function, web_search, file_search, etc.)
   - Map reasoning events (o1, o3, o4-mini models)
   - Map audio events (delta, done, transcript)

3. **Add to orchestrator**: Route Responses API events through translator

**Reference**: [Provider Mappings - Responses API](../../packages/sdk/docs/PROVIDER_MAPPINGS.md#openai-responses-api)

**Impact**: Responses API not fully integrated with Holo format

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

export class OpenAIProviderPlugin {
  constructor(config: unknown) {
    if (!validateConfig(config)) {
      throw new ConfigurationError(validateConfig.errors);
    }
    // ...
  }
}
```

---

## Medium Priority (P2)

### #PERF-1: Add Caching for Timestamp Conversion

**Files**: Response translators

**Status**: ❌ Not Started

**Priority**: P2

**Issue**: Timestamp conversion (`created * 1000`) is performed on every response.

**Optimization**:
```typescript
private timestampCache = new Map<number, number>();

private convertTimestamp(seconds: number): number {
  if (!this.timestampCache.has(seconds)) {
    this.timestampCache.set(seconds, seconds * 1000);
  }
  return this.timestampCache.get(seconds)!;
}
```

**Impact**: Minor performance improvement for high-throughput scenarios

---

### #REFACTOR-1: Centralize Response Format Mapping

**Files**:
- `src/translators/openai.chatcompletion.request.translator.ts`
- `src/translators/openai.responses.request.translator.ts`

**Status**: ❌ Not Started

**Priority**: P2

**Issue**: Response format mapping (`json_object`, `json_schema`) duplicated across translators.

**Required Action**:
- Create shared utility for response format mapping
- Centralize schema validation logic
- Reduce code duplication

**Impact**: Architectural consistency, easier maintenance

---

### #FEAT-1: Add Integration Tests with Real OpenAI API

**Status**: ❌ Not Started

**Priority**: P2

**Required Actions**:
1. Add `tests/integration/` directory
2. Implement real API tests:
   ```typescript
   describe('OpenAI API Integration', () => {
     it('should complete chat request', async () => {
       // Requires OPENAI_API_KEY
     });

     it('should stream responses', async () => {
       // Test real streaming
     });

     it('should handle tool calls', async () => {
       // Test function calling
     });

     it('should work with Responses API', async () => {
       // Test Responses endpoint
     });
   });
   ```
3. Add CI/CD integration with secret management

---

## Low Priority (P3)

### #DOC-1: Document Multi-Choice Limitations

**Status**: ❌ Not Started

**Priority**: P3

**Required Actions**:
- Document that `n > 1` is OpenAI-specific
- Clarify that multi-choice is not portable across providers
- Show examples of handling choice indices in streaming
- Add to Known Issues section in README

---

### #DOC-2: Add Architecture Decision Record for Dual API Support

**Status**: ❌ Not Started

**Priority**: P3

**Issue**: Dual API support (Chat Completions + Responses) creates complexity.

**Required Actions**:
- Document architectural decision to support both APIs
- Clarify routing logic and type guards
- Document when to use each API
- Update ARCHITECTURE.md with clarification

**Impact**: Clarity for future contributors

---

### #DOC-3: Document Logprobs and Provider-Specific Features

**Status**: ❌ Not Started

**Priority**: P3

**Required Actions**:
- Document logprobs usage via `provider_config`
- Document logit_bias usage
- Document parallel_tool_calls usage
- Clarify which features are OpenAI-specific vs portable

---

## Completed Items (Archive)

### ~~Dual API Routing~~ ✅

**Status**: ✅ Working as expected

**Location**: `src/openai.provider.ts`

Provider correctly routes based on request structure using type guards.

### ~~Timestamp Handling~~ ⚠️ **NEEDS FIX** (#CRITICAL-1)

**Status**: ⚠️ Partially implemented

**Location**: Response translators

Currently passes seconds directly; needs multiplication by 1000.

### ~~Tool Call Format~~ ⚠️ **NEEDS FIX** (#TOOL-1)

**Status**: ⚠️ Partially implemented

**Location**: Response translators

Currently passes JSON string; needs parsing to object.

### ~~provider_delta Preservation~~ ✅

**Status**: ✅ Working as expected

All streaming translators include `provider_delta: source` for round-trip fidelity.

---

## Notes

### Migration Philosophy

This plugin maintains the core translation logic from the monolithic architecture while:
1. ✅ Using SDK types exclusively for public contracts
2. ✅ Implementing plugin discovery and lifecycle
3. ✅ Providing independent versioning
4. ✅ Supporting dual API routing (Chat + Responses)
5. 🔄 Achieving full SDK compliance (in progress)

### SDK Compliance Checklist

- [x] Uses `@holokai/sdk` imports
- [ ] No `Record<string, unknown>` in production paths (#SDK-1)
- [ ] No `any` types in production paths (#SDK-1)
- [ ] Timestamp conversion to ms (#CRITICAL-1)
- [ ] Tool call arguments parsing (#TOOL-1)
- [ ] message_start synthesis (#STREAM-1)
- [ ] Full round-trip testing (#TEST-1)
- [ ] Config validation (#CONFIG-1)
- [ ] Responses API translator (#RESP-1)

### ArkType Validator Coverage

- **Current**: 200/228 validators (88%)
- **Target**: 228/228 validators (100%)
- **Gap**: 28 validators remaining

**Missing Validators**:
- Chat Completions: 10/60 missing
- Responses API: 18/168 missing

See `src/validators/` for implementation status.

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
6. Follow ArkType validator standards from CLAUDE.md

---

**Last Updated**: 2025-12-18
**Plugin Version**: 0.1.0
**SDK Version**: ^0.1.0
**OpenAI SDK**: ^6.9.1
**Type Validators**: 200/228 (88%)
