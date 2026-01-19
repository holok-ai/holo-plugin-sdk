# Requirements: OpenAI Responses API Support

**Work Type:** Feature
**Created:** 2025-11-10
**Status:** Requirements Gate

---

## Executive Summary

Add support for OpenAI's new Responses API (`/v1/responses`) while maintaining full backward compatibility with existing Chat Completions API (`/v1/chat/completions`). This feature enables access to improved caching, stateful sessions, reasoning exposure, and multi-output formats.

---

## Background

### Current State
- System uses OpenAI Chat Completions API exclusively
- OpenAI SDK version: 6.7.0
- Endpoint: `/v1/chat/completions`
- Implementation file: `src/providers/openai/openai.provider.ts`

### What Changed
- OpenAI introduced Responses API in March 2025
- **Chat Completions is NOT deprecated** - will be supported indefinitely
- Responses API is recommended for new development
- Leverages Prompt Caching (up to 80% latency reduction; up to 90% input-token cost reduction)
- Exposes optional reasoning summary (for supported reasoning models)
- Supports conversation state via mechanisms like `previous_response_id`

### Clarification on "Completions"
The user mentioned "completions" being deprecated. Research confirms:
- **Legacy Completions API** (`/v1/completions`) - text completion (non-chat) - Already deprecated
- **Chat Completions API** (`/v1/chat/completions`) - Current API - **NOT deprecated, fully supported**
- **Responses API** (`/v1/responses`) - New API - Recommended for new projects
- **Assistants API** - Deprecated; shutdown scheduled August 26, 2026 (separate from our scope)

Our system already uses Chat Completions (not legacy Completions), so we're in good shape. We're adding Responses API as an enhancement, not a migration.

---

## Requirements

### Functional Requirements

#### FR1: Dual API Support
- System MUST support both Chat Completions and Responses APIs simultaneously
- No breaking changes to existing Chat Completions integration
- Both endpoints accessible via configuration

#### FR2: New Responses Endpoint
- Add `/api/openai/v1/responses` HTTP endpoint
- Mirror existing `/api/openai/v1/chat/completions` route structure
- Support both streaming and non-streaming modes

#### FR3: Responses API Features
- Support conversation state via Responses' mechanisms (e.g., `previous_response_id`)
- Support stateless mode (default)
- Expose optional reasoning summary; include in streaming as a typed event if present
- Handle multi-output format (text, tool_calls, structured_output)
- Support usage statistics with timing and cache metadata

#### FR4: Translation Layer
- Bidirectional translation between Holo ↔ OpenAI Responses format
- Preserve all Responses-specific fields via `provider_delta`
- Map multi-output format to Holo's message structure
- Handle reasoning summary as optional field
- Map typed streaming events (text deltas, tool_calls, structured chunks, reasoning summary)

#### FR5: Provider Configuration
- Add `openai_api_version` config field: `'chat_completions' | 'responses'`
- Default to `'chat_completions'` for backward compatibility
- Support per-provider configuration
- Support per-request override (feature flag or route-level toggle)

### Non-Functional Requirements

#### NFR1: Backward Compatibility
- Zero impact on existing Chat Completions users
- Existing routes continue to function identically
- No changes to current API contracts

#### NFR2: Performance
- Leverage Prompt Caching (up to 80% latency reduction; up to 90% input-token cost reduction)
- Streaming latency should match or improve on Chat Completions
- No additional overhead in translation layer
- Emit telemetry: `ttft_ms`, `gen_ms`, `tokens/sec`, `cache_hit`, `prompt_cache_hit`, `cached_tokens`

#### NFR3: Maintainability
- Follow existing translator pattern architecture
- Reuse existing message/tool/usage translators where possible
- Maintain stateless translator design
- Comprehensive type safety with ArkType validators

#### NFR4: Testing
- Unit tests for all new translators
- Integration tests for `/responses` endpoint
- Round-trip translation tests (Holo → Responses → Holo)
- Backward compatibility regression tests
- Streaming tests with reasoning summary and typed events
- Golden tests for event mapping (Responses events → Holo stream envelopes)
- Prompt caching behavior tests (with/without prompt IDs)
- Capabilities matrix tests (reasoning-enabled vs standard models)
- Error conformance tests (HTTP 400/401/429/5xx → normalized Holo errors)

---

## Edge Cases & Questions

### Edge Case 1: Mixed Sessions
**Question:** Can a user switch between Chat Completions and Responses APIs mid-conversation?

**Answer:** Yes, both APIs support stateless operation. For stateful Responses sessions (using `previous_response_id`), conversation history is linked via response IDs—not maintained in our system. Stateful Responses turns cannot be mixed with Chat Completions in the same conversation chain, but stateless usage can mix.

**Requirement:** Document that conversation state (`previous_response_id`) is Responses-only. Chat Completions remains stateless in our system. Support stateless operation in both APIs.

### Edge Case 2: Reasoning Exposure
**Question:** Should we expose reasoning summary to end users, or filter them?

**Answer:** Expose as optional. Reasoning summary (not raw thinking tokens) provides transparency for debugging and understanding model behavior. Only available for supported reasoning models.

**Requirement:** Include reasoning summary in Holo format as optional field (`reasoning_summary?: string`). Emit as typed streaming event if present. Allow downstream consumers to filter if needed.

### Edge Case 3: Multi-Output Handling
**Question:** How do we map Responses API's multi-output format (text + tool_calls + structured_data) to Holo's message-centric format?

**Answer:** Holo already supports tool results and structured responses in separate fields. Extend with `outputs` array for full fidelity.

**Requirement:** Add `outputs?: HoloOutputItem[]` to HoloResponse type. Map all output types.

### Edge Case 4: SDK Version Compatibility
**Question:** Does OpenAI SDK 6.7.0 support Responses API?

**Answer:** Need to verify. Responses API was introduced March 2025. SDK 6.7.0 may or may not include it.

**Requirement:** Check SDK changelog. Upgrade to latest if needed (likely 6.x or 7.x).

### Edge Case 5: Error Handling
**Question:** Are error formats different between APIs?

**Answer:** OpenAI maintains consistent error formats across APIs, but we must verify explicitly.

**Requirement:** Map HTTP status codes and OpenAI error codes to normalized Holo errors. Test 400/401/429/5xx paths explicitly. Include retry/backoff signals in error responses.

### Edge Case 6: Model Capabilities
**Question:** Do all models support all Responses API features (reasoning, structured outputs)?

**Answer:** No. Features are model-dependent. Reasoning summary is only available for reasoning-capable models (e.g., o1-series). Structured outputs depend on model support.

**Requirement:** Add capabilities map for graceful degradation. If model doesn't support reasoning, omit `reasoning_summary` field. Validate requested features against model capabilities before sending request.

### Edge Case 7: Streaming Contract
**Question:** What are the specific typed events Responses API emits, and how do they map to Holo?

**Answer:** Responses API emits semantic events (not just text deltas): `text.delta`, `tool_call.start`, `tool_call.delta`, `structured.output`, `reasoning.summary`. Each needs explicit mapping.

**Requirement:** Define explicit event mapping table (see Architecture section). Implement translator for each event type. Preserve event ordering. Handle out-of-order events gracefully. Support SSE reconnect semantics.

### Edge Case 8: Cache Telemetry
**Question:** What specific cache-related fields does Responses API expose?

**Answer:** Usage object includes: `prompt_tokens`, `completion_tokens`, `total_tokens`, `prompt_tokens_details.cached_tokens`, `prompt_tokens_details.audio_tokens`, etc.

**Requirement:** Define complete usage/telemetry schema:
```typescript
{
  input_tokens: number;
  output_tokens: number;
  cached_tokens?: number;  // From prompt_tokens_details
  prompt_cache_hit?: boolean;  // Derived from cached_tokens > 0
  ttft_ms: number;  // Time to first token
  gen_ms: number;  // Total generation time
  tokens_per_sec: number;  // Derived: output_tokens / (gen_ms / 1000)
}
```

---

## Out of Scope

### Not Included in This Feature
1. **Assistants API migration** - Assistants API is being deprecated (mid-2026), but that's separate work
2. **Legacy Completions removal** - We don't use it, no action needed
3. **Forced migration** - Chat Completions remains default, Responses is opt-in
4. **UI changes** - This is backend-only, no frontend modifications
5. **Cache optimization** - OpenAI handles caching internally, we just pass through

---

## Success Criteria

### Acceptance Criteria
1. `/api/openai/v1/responses` endpoint accepts valid requests and returns responses
2. Streaming mode works with thinking/reasoning deltas exposed
3. Stateful sessions maintain conversation history across requests
4. Round-trip translation preserves all data (Holo → Responses → Holo)
5. Existing Chat Completions endpoint continues to work unchanged
6. Configuration option allows switching between APIs per provider
7. All tests pass (unit, integration, backward compatibility)

### Testing Validation
- [ ] Unit tests for Responses request/response translators
- [ ] Unit tests for streaming event translators (all event types)
- [ ] Golden tests for event mapping (Responses → Holo stream envelopes)
- [ ] Integration test: POST /api/openai/v1/responses (non-streaming)
- [ ] Integration test: POST /api/openai/v1/responses (streaming, all event types)
- [ ] Integration test: Stateful session flow (3+ messages with previous_response_id)
- [ ] Integration test: Prompt caching (with/without prompt IDs, assert cache metadata)
- [ ] Integration test: Capabilities matrix (reasoning model vs standard model)
- [ ] Integration test: Error conformance (400/401/429/5xx → normalized errors)
- [ ] Integration test: SSE reconnect and out-of-order event handling
- [ ] Regression test: Chat Completions still works (zero changes)
- [ ] Round-trip test: Holo → Responses → Holo preserves data (lossless)
- [ ] Performance test: Compare TTFT and tokens/sec between APIs

---

## Dependencies

### Internal Dependencies
- Holo type system (`src/providers/holo/types/`)
- OpenAI provider (`src/providers/openai/openai.provider.ts`)
- Request service (`src/admin/services/request.service.ts`)
- OpenAI routes (`src/api/routes/openai.routes.ts`)

### External Dependencies
- OpenAI SDK 6.x+ with Responses API support (verify version)
- Node.js 18+ (already met)

### Blockers
- **SDK verification** - Must confirm OpenAI SDK supports Responses API
- **None otherwise** - All internal infrastructure exists

---

## Implementation Notes

### Existing Architecture Strengths
- **Hub-and-spoke pattern** - Holo format already abstracts provider differences
- **Stateless translators** - Design supports parallel APIs easily
- **Type safety** - ArkType validators catch issues at runtime
- **Provider pattern** - Easy to add new methods alongside existing ones

### Leverage Existing Code
- Reuse `OpenAIMessageTranslator` for message mapping
- Reuse `OpenAIToolTranslator` for tool call handling
- Reuse `OpenAIUsageTranslator` for token counting
- Follow pattern from Claude/Ollama providers for multi-API support

### New Components Needed
- `OpenAIResponsesRequestTranslator`
- `OpenAIResponsesResponseTranslator`
- `OpenAIResponsesStreamTranslator`
- `OpenAIResponsesEventTranslator` (maps semantic events)
  - `TextDeltaTranslator`
  - `ToolCallDeltaTranslator`
  - `StructuredOutputTranslator`
  - `ReasoningSummaryTranslator`
- Validators for all Responses types
- Model capabilities map (`MODEL_CAPABILITIES`)
- Controller method `responses()`
- Route `/responses`
- Route selection logic (per-request override → per-provider config → default)

### Event Mapping Table (Responses → Holo)

| Responses API Event | Holo Stream Envelope | Notes |
|---------------------|----------------------|-------|
| `text.delta` | `{ type: 'content_delta', delta: { content: string } }` | Text content chunk |
| `tool_call.start` | `{ type: 'tool_call_start', tool_call: { id, name } }` | Tool invocation begins |
| `tool_call.delta` | `{ type: 'tool_call_delta', delta: { arguments: string } }` | Tool arguments streaming |
| `tool_call.complete` | `{ type: 'tool_call_complete', tool_call: {...} }` | Tool invocation finished |
| `structured.output` | `{ type: 'structured_output', data: any }` | Structured response object |
| `reasoning.summary` | `{ type: 'reasoning_summary', reasoning: string }` | Optional reasoning (o1-series) |
| `response.done` | `{ type: 'message_stop', usage: {...} }` | End of response with usage |
| `error` | `{ type: 'error', error: {...} }` | Error during streaming |

**Key Principles:**
- Preserve event ordering (FIFO)
- Handle out-of-order gracefully (buffer tool_call deltas until complete)
- Emit usage metadata only on `response.done`
- Include `provider_delta` for lossless round-tripping

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SDK incompatibility | Medium | High | Verify SDK version supports Responses API; upgrade if needed |
| Breaking existing API | Low | Critical | Comprehensive regression tests; no changes to Chat Completions code paths |
| Translation complexity | High | Medium | Follow existing pattern; golden tests for all event types; reuse translators |
| Event ordering issues | Medium | Medium | Buffer events; handle out-of-order; test SSE reconnect scenarios |
| Model capability mismatch | Medium | Low | Capabilities map with validation; graceful degradation |
| Performance regression | Low | Medium | Benchmark both APIs; monitor TTFT/tokens-per-sec; A/B test |
| Incomplete feature parity | Medium | Low | Review OpenAI docs; implement all event types; validate with golden tests |
| Cache telemetry gaps | Low | Low | Map all usage fields; derive metrics; test with/without prompt IDs |

---

## Timeline Estimate

| Phase | Effort | Duration |
|-------|--------|----------|
| Requirements (this doc) | ✅ Complete | 2 hours |
| Architecture design | Pending | 3 hours |
| Plan creation | Pending | 2 hours |
| SDK upgrade + verification | Low | 2 hours |
| Type system extension | Medium | 6 hours |
| Translation layer | High | 16 hours |
| Event translators | High | 8 hours |
| Provider integration | Medium | 6 hours |
| API endpoints + routing | Medium | 4 hours |
| Model capabilities map | Low | 2 hours |
| Testing (unit + integration) | High | 12 hours |
| Golden tests + performance | Medium | 4 hours |
| Documentation | Medium | 6 hours |
| **Total** | | **73 hours (9 days)** |

**Note:** Increased from original 40-hour estimate due to:
- Event mapping complexity (semantic events vs deltas)
- Capabilities matrix for model-dependent features
- Comprehensive golden tests for all event types
- Cache telemetry and performance testing
- Error mapping and retry logic

---

## References

### OpenAI Documentation
- [Responses vs. Chat Completions Guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI SDK Changelog](https://github.com/openai/openai-node/releases)

### Internal Documentation
- Existing implementation plan: `src/providers/openai/TODO_RESPONSES.md`
- Provider implementation guide: `src/providers/IMPLEMENTATION_GUIDE.md`
- Architecture docs: `ARCHITECTURE.md`

### Related Issues
- None currently

---

## Next Steps

1. **Requirements Review** ✅ (this document)
2. **Architecture Design** → Create architecture diagram and detailed component design
3. **Implementation Plan** → Break down into specific tasks with file paths
4. **SDK Verification** → Check OpenAI SDK compatibility
5. **Implementation** → Build phase-by-phase with tests
6. **Review & Documentation** → Critic review, update docs

---

---

## Implementation Guidance

### Translator Boundaries (Critical)
- Keep Holo ↔ Responses translation **pure and side-effect-free**
- Treat tool calls and structured outputs as ordered `outputs[]` array
- Text content remains convenience field (concatenation of text deltas)
- Never mutate shared state in translators

### Route Selection Order
```
1. Per-request override (e.g., `X-OpenAI-API-Version: responses` header)
2. Per-provider config (`provider.openai_api_version`)
3. Default (`'chat_completions'`)
```

### Observability Requirements
Emit for both APIs (apples-to-apples comparison):
- `ttft_ms` - Time to first token
- `gen_ms` - Total generation time
- `tokens_per_sec` - Throughput (output_tokens / gen_ms * 1000)
- `cache_hit` - Boolean (derived from cached_tokens > 0)
- `cached_tokens` - From prompt_tokens_details

### Golden Test Strategy
For each event type, create fixtures:
- **Input:** Raw Responses API event JSON
- **Expected:** Holo stream envelope JSON
- **Assert:** Exact match (structural equality)
- **Coverage:** All event types + error cases

### Model Capabilities Map
```typescript
const MODEL_CAPABILITIES = {
  'o1-preview': { reasoning: true, structured: true },
  'o1-mini': { reasoning: true, structured: true },
  'gpt-4': { reasoning: false, structured: true },
  'gpt-3.5-turbo': { reasoning: false, structured: false },
  // ...
};
```

---

**Status:** Requirements gate complete with factual corrections and gap closure. Ready for architecture gate.
