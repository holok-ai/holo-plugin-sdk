# Ollama Provider - Todo List

## High Priority

### 1. Synthesize ID Field in All Response Translators
**Files:**
- `src/providers/ollama/translators/ollama.chat.response.translator.ts` (~line 110-130)
- `src/providers/ollama/translators/ollama.generate.response.translator.ts` (~line 88-103)
- `src/providers/ollama/translators/streaming/ollama.content.delta.translator.ts` (~line 22-48)
- `src/providers/ollama/translators/streaming/ollama.message.delta.translator.ts` (~line 23-70)
- `src/providers/ollama/translators/streaming/ollama.message.stop.translator.ts` (~line 22-36)

**Issue:** Ollama responses lack stable `id` fields. Per README §94-95, 259-261: "Translators MUST synthesize UUIDs or deterministic hashes"

**Required Action:**
```typescript
import { randomUUID } from 'crypto';

// In toHoloImpl/toHoloManyImpl:
const holoResponse = {
    id: randomUUID(),  // or use crypto.randomUUID() for Node 14+
    model: source.model,
    // ...
};
```

**Streaming Consideration:**
- Generate ID at stream start and reuse across all chunks
- Requires passing ID through context or making orchestrator stateful

**Impact:** HoloResponse/HoloStreamChunk missing required `id` field

**Priority:** Critical

---

### 2. Fix Timestamp Conversion in generate.response Translator
**File:** `src/providers/ollama/translators/ollama.generate.response.translator.ts`
**Line:** 98

**Issue:** Passes ISO8601 string directly instead of converting to milliseconds

**Current Code:**
```typescript
created: source.created_at  // ❌ String, not number
```

**Required Fix:**
```typescript
created: source.created_at ? Date.parse(source.created_at) : undefined
```

**Note:** Chat response translator (line 126) correctly uses `new Date(source.created_at).getTime()` ✓

**Impact:** Timestamp type mismatch; downstream consumers expect milliseconds

**Priority:** High

---

### 3. Add Timestamp Extraction in All Streaming Translators
**Files:**
- `src/providers/ollama/translators/streaming/ollama.content.delta.translator.ts`
- `src/providers/ollama/translators/streaming/ollama.message.delta.translator.ts`
- `src/providers/ollama/translators/streaming/ollama.message.stop.translator.ts`

**Issue:** Streaming translators don't extract or convert `created_at` timestamps

**Required Action:**
Add to all streaming translators' `toHoloManyImpl`:
```typescript
{
    id: /* synthesized or passed through */,
    model: source.model,
    created: source.created_at ? Date.parse(source.created_at) : undefined,
    delta: { /* ... */ }
}
```

**Impact:** Missing timestamps in streaming events

**Priority:** High

---

### 4. Implement message_start Emission on First Frame
**File:** `src/providers/ollama/translators/streaming/ollama.stream.translator.ts`
**Lines:** 30-56 (`toHoloManyImpl`)

**Issue:** Per README §107-108, 255-257: "orchestrator must emit message_start on first frame". Current implementation immediately calls content delta translator without detecting first frame.

**Problem:** Orchestrator is stateless (per BaseStreamTranslator), so cannot track "first frame" across calls.

**Required Action (Option A - Stateful):**
```typescript
export class OllamaStreamTranslator extends BaseStreamTranslator {
    private hasEmittedStart = false;

    protected async toHoloManyImpl(source: OllamaStreamChunk): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];

        if (!source.done && !this.hasEmittedStart) {
            // Emit message_start on first content frame
            results.push({
                id: /* synthesized ID */,
                model: source.model,
                created: source.created_at ? Date.parse(source.created_at) : undefined,
                delta: {
                    provider: 'ollama',
                    type: 'message_start',
                    delta: { role: 'assistant' },
                    provider_delta: source
                }
            });
            this.hasEmittedStart = true;
        }

        // Continue with existing logic...
    }
}
```

**Required Action (Option B - Document):**
- Document that upstream layer must emit `message_start` before first chunk
- Add comment explaining stateless constraint

**Note:** Option A violates "stateless translator" principle in ARCHITECTURE.md

**Impact:** Missing `message_start` event; consumers expect it

**Priority:** High (architectural decision needed)

---

### 5. Default finish_reason to 'stop' When Missing
**Files:**
- `src/providers/ollama/translators/ollama.chat.response.translator.ts` (line 127, mapper lines 74-84)
- `src/providers/ollama/translators/ollama.generate.response.translator.ts` (line 100, mapper lines 63-67)
- `src/providers/ollama/translators/streaming/ollama.message.delta.translator.ts` (line 55)
- `src/providers/ollama/translators/streaming/ollama.message.stop.translator.ts` (line 34)

**Issue:** Per README §63, 268-271: "Default to 'stop' when `done=true && !done_reason`". Current mappers return `null` for missing reasons.

**Required Action:**
Modify `mapFinishReasonToHolo` methods:
```typescript
private mapFinishReasonToHolo(
    doneReason: string | null | undefined,
    done: boolean
): HoloFinishReason | null {
    if (!doneReason) {
        // Default to 'stop' when done=true but done_reason is missing
        return done ? 'stop' : null;
    }

    switch (doneReason) {
        case 'stop': return 'stop';
        case 'length': return 'length';
        default: return null;  // Unknown reasons
    }
}
```

**Impact:** Missing finish_reason in completed responses

**Priority:** High

---

### 6. Add Warning Log for Unsupported tool_choice
**File:** `src/providers/ollama/translators/ollama.chat.request.translator.ts`

**Issue:** Per README §36, 52: "translators should log & degrade to `auto` when provided". Currently silently ignored.

**Required Action:**
Add in `fromHoloImpl` after line 43:
```typescript
if (source.tool_choice) {
    const logger = this.mlog(this.fromHoloImpl);
    logger.warn('Ollama does not support tool_choice; ignoring field', {
        tool_choice: source.tool_choice
    });
}
```

**Impact:** Observability for debugging; users unaware feature is unsupported

**Priority:** High

---

### 7. Add metadata Field to HoloResponse for Performance Metrics and Context
**Files:**
- `src/providers/holo/types/responses.ts` (add `metadata` field)
- Update all Ollama translators to use `metadata.performance` and `metadata.context`

**Issue:** Per README §66-67, performance metrics (`total_duration`, etc.) should be preserved in `metadata.performance.*` and Generate mode `context` in `metadata.context`. However, HoloResponse interface doesn't have a `metadata` field.

**Current Workaround:**
- Performance metrics stored in `usage.timings.*`
- Context array not preserved at all

**Required Action (Architectural):**

**Option A - Add metadata to HoloResponse:**
```typescript
// In src/providers/holo/types/responses.ts
export type HoloResponse = {
    id: string;
    model: string;
    created?: number;
    messages: HoloMessage[];
    finish_reason?: HoloFinishReason;
    usage?: HoloUsage;
    service_tier?: string;
    metadata?: {
        performance?: {
            total_duration?: number;        // nanoseconds
            load_duration?: number;         // nanoseconds
            prompt_eval_duration?: number;  // nanoseconds
            eval_duration?: number;         // nanoseconds
        };
        context?: number[];  // Generate mode: token IDs for continuation
        [key: string]: any;  // Extensible for provider-specific metadata
    };
};
```

Then update Ollama translators:
```typescript
// In ollama.chat.response.translator.ts, ollama.generate.response.translator.ts
metadata: {
    performance: {
        total_duration: source.total_duration,
        load_duration: source.load_duration,
        prompt_eval_duration: source.prompt_eval_duration,
        eval_duration: source.eval_duration
    },
    context: source.context  // Generate mode only
}
```

**Option B - Keep current implementation:**
- Accept `usage.timings` for performance metrics
- Update README to reflect actual implementation
- Omit context array (out-of-band state management)

**Recommendation:** Option A - Add `metadata` field for extensibility and alignment with README

**Impact:** Performance metrics and context data not accessible per README specs

**Priority:** High (architectural decision needed)

---

## Correctly Implemented ✅

The following are working as expected:

- **Empty frame handling** - Correctly skips frames with empty content (line 34 in content.delta)
- **Image extraction** - Correctly extracts images to `messages[].images` array (lines 28-44 in message translator)
- **Dual mode support** - Separate chat and generate translators ✓
- **provider_delta preservation** - All streaming translators include `provider_delta: source` ✓
- **Pass-through contract** - Stream translator validates `provider_delta` before reconstruction ✓

---

## Medium Priority

### 8. Centralize Options Translation
**File:** `src/providers/ollama/translators/ollama.options.translators.ts`
**Lines:** 20-32

**Issue:** Only maps `num_predict` and `stop`. Other options (`temperature`, `top_p`, `top_k`, etc.) mapped directly in request translators.

**Current State:**
- Generate request translator (lines 42-51): Maps all options directly ✓
- Chat request translator: Uses options translator (may be missing direct mappings)

**Required Action:**
- Move all option mappings to `ollama.options.translators.ts` for consistency
- OR: Document that options are intentionally handled in request translators

**Impact:** Architectural consistency

**Priority:** Medium

---

### 9. Document Stateless vs Stateful Architecture Decision
**Issue:** README requires stateless translators (§11) but message_start emission (§4) requires state.

**Required Action:**
- Document architectural decision:
  - Either: Relax stateless requirement for streaming orchestrators
  - Or: Handle message_start emission at higher layer (WorkerServer)
- Update ARCHITECTURE.md with clarification

**Priority:** Medium (documentation clarity)

---

## Summary

### Critical Gaps (Must Fix):
1. ❌ No ID synthesis
2. ❌ Timestamp conversion broken in generate + streaming
3. ❌ No message_start emission
4. ❌ Missing finish_reason default
5. ❌ tool_choice silently ignored
6. ❌ metadata field missing in HoloResponse

### Architectural Decisions Needed:
- How to handle message_start (stateful vs upstream)
- Whether to add `metadata` field to HoloResponse
- Where to centralize options translation

---

## Related Documentation

- **[Ollama README](./README.md)** § Streaming, Known Issues
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** § Stateless Translators
- **[Holo README](../holo/README.md)** § HoloResponse Fields
- **[STREAMING_GUIDE.md](../STREAMING_GUIDE.md)** § Frame-Based Streaming

---

**Last Updated:** 2025-10-06
