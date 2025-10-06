# Claude Provider - Todo List

## High Priority

### ~~0. Synthesize content_block_start/stop for Non-Claude Sources~~ ✅ COMPLETED
**File:** `src/providers/claude/translators/streaming/claude.stream.translator.ts`
**Lines:** 69, 73-90, 117-131

**Status:** ✅ **FIXED** (2025-10-06)

**Issue:** When translating FROM Holo (OpenAI/Ollama source) TO Claude, we weren't synthesizing `content_block_start` and `content_block_stop` events. Claude requires these events for proper stream structure.

**Solution Implemented:**
```typescript
// Detect cross-provider translation by checking for provider_delta
// Native Claude: has provider_delta with raw Claude events
// Cross-provider: no provider_delta (only normalized Holo data)
const isCrossProviderTranslation = !d.provider_delta;

case 'message_start':
    const messageStartResults = await this.messageStartTranslator.fromHoloMany(source);
    if (isCrossProviderTranslation) {
        // Synthesize content_block_start[0] for text content
        messageStartResults.push({
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'text', text: '' }
        });
    }
    return messageStartResults;

case 'message_stop':
    const stopResults = [];
    if (isCrossProviderTranslation) {
        // Synthesize content_block_stop[0] to close text content block
        stopResults.push({
            type: 'content_block_stop',
            index: 0
        });
    }
    stopResults.push(...await this.messageStopTranslator.fromHoloMany(source));
    return stopResults;
```

**Result:** Cross-provider streaming (OpenAI→Claude, Ollama→Claude) now properly wraps content in content blocks

**Note:** This is a quick fix. Future orchestrator improvements (#1) will handle multi-block scenarios and tool calls properly.

---

### 1. Implement Stateful Orchestrator with Content Block Tracking
**File:** `src/providers/claude/translators/streaming/claude.stream.translator.ts`
**Lines:** 17-112

**Issue:** The README describes the orchestrator as "stateful" (line 115) but the implementation is stateless. It only routes events without maintaining content block state.

**Required Action:**
- Add instance variables to track content blocks by index:
  ```typescript
  private contentBlocks: Map<number, { type: string; accumulated: any }> = new Map();
  private currentMessageId?: string;
  private currentModel?: string;
  ```
- Implement accumulation logic in `toHoloManyImpl`:
  - Track content block starts by index
  - Accumulate text/tool deltas by index
  - Emit complete tool calls on content block stop
- Add reset mechanism for new messages

**Impact:** Core functionality for tool calling and content reconstruction

---

### 2. Add Tool Call Extraction from Accumulated Content Blocks
**File:** `src/providers/claude/translators/streaming/claude.content.block.start.event.translator.ts`
**Lines:** 50-81

**Issue:** The translator creates tool call shells but doesn't extract complete tool calls from accumulated `content[]` blocks into `tool_calls[]` format during streaming.

**Required Action:**
- Requires orchestrator state (see #1)
- Once `content_block_stop` arrives for a `tool_use` block, emit extracted tool call in `tool_calls[]` format
- Extract: `content[i].type='tool_use'` → `tool_calls[].type='function'`, `function={name, arguments: input}`
- Preserve `content[i].id` → `tool_calls[].id`

**Impact:** Tool calling functionality broken without this

---

### 3. Implement Delta Accumulation by Index in Orchestrator
**File:** `src/providers/claude/translators/streaming/claude.content.block.delta.event.translator.ts`
**Lines:** 58-96

**Issue:** While index is passed through correctly, there's no accumulation logic to reconstruct complete content blocks by index.

**Required Action:**
- Move accumulation to orchestrator (relates to #1)
- Accumulate text deltas and tool input deltas separately by index
- Emit complete content blocks when `content_block_stop` arrives

**Impact:** Data integrity for multi-block responses

---

## Medium Priority

### 4. Add Pass-Through Contract to content.block.start Translator
**File:** `src/providers/claude/translators/streaming/claude.content.block.start.event.translator.ts`
**Lines:** 20-48 (`fromHoloManyImpl`)

**Issue:** Missing pass-through validation check for `provider_delta`.

**Required Action:**
```typescript
protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<ClaudeContentBlockStartEvent>[]> {
    const d = source.delta;
    if (!d || d.type !== 'content_block_start') return [];

    // Fast pass-through
    if (d.provider === 'claude' && d.provider_delta) {
        const validated = this.providerValidator(d.provider_delta);
        if (!(validated instanceof ArkErrors) && validated.type === 'content_block_start') {
            return [validated];
        }
    }

    // Reconstruct from Holo...
}
```

**Impact:** Performance optimization for same-provider streaming

---

### 5. Extend Pass-Through Contract to Text Deltas in content.block.delta
**File:** `src/providers/claude/translators/streaming/claude.content.block.delta.event.translator.ts`
**Lines:** 21-56 (`fromHoloManyImpl`)

**Issue:** Partial pass-through exists for tool args (lines 38-53) but missing for text deltas.

**Required Action:**
- Extend pass-through validation at start of `fromHoloManyImpl` to cover all delta types
- Currently only validates tool arg deltas

**Impact:** Performance optimization

---

### 6. Add Pass-Through Contract to message.delta Translator
**File:** `src/providers/claude/translators/streaming/claude.message.delta.event.translator.ts`
**Lines:** 22-50 (`fromHoloManyImpl`)

**Issue:** Missing pass-through validation check for `provider_delta`.

**Required Action:**
- Add same pass-through pattern as #4 at start of `fromHoloManyImpl`

**Impact:** Performance optimization

---

## Low Priority

### 7. Add Integration Tests for Event Ordering
**Issue:** Cannot verify from static analysis that event ordering is preserved.

**Required Action:**
- Add integration tests to verify ordering guarantees
- Document ordering requirements explicitly

---

### 8. Document Cancellation Behavior
**File:** `src/providers/claude/claude.provider.ts`

**Issue:** No visible cancellation handling; need to verify no synthetic `message_stop` is created.

**Required Action:**
- Document cancellation behavior
- Add tests for cancellation scenarios
- Verify no synthetic events

---

### 9. Add Extended Thinking Block Support
**Issue:** README mentions `content[].type='thinking'` blocks but no translator handles them.

**Required Action:**
- Add handling for thinking blocks in content translators
- Preserve in `metadata.thinking` or pass through in content
- Update response translators for thinking content type

---

## Notes

- **Architecture Decision Needed:** Items #1-3 require making the orchestrator stateful, which conflicts with the "stateless translator" principle in ARCHITECTURE.md. Need to decide if orchestrators are exempt from this rule.

- **Related Documentation:**
  - [Claude README](./README.md) § Orchestrator Role (line 113-117)
  - [ARCHITECTURE.md](../ARCHITECTURE.md) § Stateless Translators
  - [STREAMING_GUIDE.md](../STREAMING_GUIDE.md) § State Management

---

**Last Updated:** 2025-10-06
