# OpenAI Provider - Todo List

## High Priority

### ~~1. Fix "Lean" provider_delta in content.delta Translator~~ ✅ COMPLETED
**File:** `src/providers/openai/translators/streaming/openai.content.delta.translator.ts`
**Line:** 46

**Status:** ✅ **FIXED** (2025-10-06)

**Change Made:**
```typescript
// Before: Reconstructed subset
provider_delta: pickDefined({ id: source.id, model: source.model, ... })

// After: Full source chunk
provider_delta: source  // ✅ Lossless round-trips enabled
```

**Result:** Lossless round-trips now working; multi-choice data preserved

---

### ~~2. Fix "Lean" provider_delta in message.delta Translator~~ ✅ COMPLETED
**File:** `src/providers/openai/translators/streaming/openai.message.delta.translator.ts`
**Line:** 60

**Status:** ✅ **FIXED** (2025-10-06)

**Change Made:**
```typescript
// Before: Lean per-tool-call provider_delta (24 lines of reconstruction)
provider_delta: leanProviderDelta

// After: Full source chunk
provider_delta: source  // ✅ Simplified and lossless
```

**Result:** Tool call data preserved; removed 24 lines of unnecessary reconstruction

---

### ~~3. Fix "Lean" provider_delta in message.start Translator~~ ✅ COMPLETED
**File:** `src/providers/openai/translators/streaming/openai.message.start.translator.ts`
**Line:** 43

**Status:** ✅ **FIXED** (2025-10-06)

**Change Made:**
```typescript
// Before: Reconstructed subset with only role
provider_delta: pickDefined({ id: source.id, model: source.model, ... })

// After: Full source chunk
provider_delta: source  // ✅ Metadata preserved
```

**Result:** All metadata (system_fingerprint, service_tier) now preserved

---

### ~~4. Add System Message Deduplication in Request Translator~~ ❌ NOT APPLICABLE
**File:** `src/providers/openai/translators/openai.request.translators.ts`
**Lines:** 86-90

**Status:** ❌ **NOT APPLICABLE** (2025-10-06)

**Analysis:**
- HoloMessage type only allows `role: 'user' | 'assistant' | 'tool'` (see `src/providers/holo/types/requests.ts:33`)
- **'system' role is explicitly excluded** from HoloMessage - comment says "No 'developer' here; use top-level system"
- This is by design: Holo enforces system prompt via top-level `system` field only
- Duplication is **architecturally impossible** in valid Holo requests

**Conclusion:** No deduplication check needed; Holo type system prevents the issue. Current implementation is correct.

---

---

## ✅ Error Response Consolidation (2025-10-06)

**Context**: Previously had three different error response methods with inconsistent behavior:
1. `sendErrorResponse` - didn't handle streaming
2. `sendValidationErrorResponse` - handled streaming
3. `GuardService.checkRequest` - used `WorkerResponseFactory.createGuardError` directly

**Solution**: Consolidated into single unified `sendError()` method in response.service.ts:271

**Changes Made**:
- **src/services/response.service.ts** (lines 208-320):
  - Added unified `sendError()` method with configurable errorType: 'validation' | 'guard' | 'general'
  - Handles both streaming and non-streaming automatically
  - Smart audit defaults: enabled for validation/guard, disabled for general
  - Deprecated old methods but kept for backward compatibility

- **src/servers/worker.server.ts** (lines 40-64):
  - Updated ERRORS handling to use `sendError()` with errorType: 'validation'
  - Added clear comments distinguishing ERRORS (permissions) from GUARDS (security)

- **src/admin/services/guard.service.ts** (lines 165-187):
  - Updated GUARDS handling to use `sendError()` with errorType: 'guard'
  - Removed direct WorkerResponseFactory import

**Benefits**:
- Single code path for all error responses
- Consistent streaming/non-streaming handling
- Clear separation of concerns (validation vs guard vs general)
- Easier to maintain and extend

---

### 5. Fix or Document Tool Argument Accumulation Strategy
**File:** `src/providers/openai/translators/streaming/openai.message.delta.translator.ts`
**Lines:** 31-32, 61-62

**Issue:** Tool arguments arrive as JSON string fragments across chunks (e.g., `"{\"location\": \"NY"` then `"\"}"`). Current per-chunk parsing approach will fail on partial JSON.

**Current Code:**
```typescript
const rawArgs = tc.function?.arguments;
const parsedArgs = safeParse(rawArgs);  // ❌ Parses each fragment independently
// ...
if (parsedArgs === null && isPartialJson(rawArgs || '')) {
    // Handle partial JSON after parsing attempt
}
```

**Problem:** `safeParse` called before accumulation; partial JSON fragments are invalid JSON.

**Required Action (Option A - Stateful):**
- Implement accumulation buffer in orchestrator:
  ```typescript
  private toolArgBuffers: Map<string, string> = new Map();
  ```
- Key by `(id, choice, tool_call.index)`
- Accumulate `arguments` strings across chunks
- Parse only when complete (on `finish_reason: 'tool_calls'` or `content_block_stop`)

**Required Action (Option B - Document):**
- Document that accumulation must happen at higher orchestrator level
- Add comment explaining limitation of per-chunk parsing
- Reference ARCHITECTURE.md § Streaming Invariants § Tool Arguments Accumulation

**Impact:** Tool calls with complex arguments may fail to parse

**Priority:** High (architectural decision needed)

---

## Compliant Areas ✅

The following are correctly implemented:

- **Timestamp conversion** - Correctly converts seconds to milliseconds (`created * 1000`)
- **Usage mapping** - Correctly maps `prompt_tokens` ↔ `input_tokens`, `completion_tokens` ↔ `output_tokens`
- **Multi-choice support** - Properly iterates through `choices` and preserves `delta.choice`
- **Tool choice mapping** - Correctly maps `{type:'specific', name}` → `{type:'function', function:{name}}`
- **Pass-through contract** - Stream translator validates `provider_delta` before reconstruction
- **Ordering preserved** - No reordering detected
- **Response format mapping** - Correctly handles `json_object` and `json_schema`
- **Finish reason mapping** - 1:1 mapping including `function_call` → `tool_calls`

---

## Notes

### Critical Path to Lossless Round-Trips

**Immediate fixes (Items #1-3):**
1. Change `provider_delta: { /* reconstructed */ }` to `provider_delta: source` in all three streaming translators
2. Test round-trip: OpenAI chunk → Holo → OpenAI chunk (should be byte-for-byte identical)

**Expected Impact:**
- Enables zero-cost pass-through for same-provider streaming
- Preserves all metadata in original chunks
- Fixes lossless round-trip guarantee

### Architecture Decision Required

**Item #5 (Tool Argument Accumulation):**
- Current "stateless translator" design conflicts with need to accumulate string fragments
- Options:
  1. Make orchestrator stateful (violates ARCHITECTURE.md principle)
  2. Handle accumulation at higher layer (document clearly)
  3. Emit partial tool calls and let client accumulate (not user-friendly)

**Recommendation:** Option 2 - Keep translators stateless, handle accumulation in `WorkerServer` or dedicated accumulator service

---

## Related Documentation

- **[OpenAI README](./README.md)** § Known Issues § "Lean provider_delta Pattern"
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** § Lossless Round-Tripping
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** § Streaming Invariants § Tool Arguments Accumulation
- **[STREAMING_GUIDE.md](../STREAMING_GUIDE.md)** § Orchestrator Responsibilities

---

**Last Updated:** 2025-10-06
