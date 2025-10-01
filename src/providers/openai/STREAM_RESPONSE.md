# OpenAI Streaming Response Format

## Overview
OpenAI uses Server-Sent Events (SSE) for streaming with `ChatCompletionChunk` objects. Each chunk represents a delta that needs to be accumulated client-side.

## Stream Response Type

Uses `Stream<ChatCompletionChunk>` where each chunk follows this structure:

```typescript
interface ChatCompletionChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;  // Unix timestamp
    model: string;
    system_fingerprint?: string;
    service_tier?: 'auto' | 'default' | 'flex' | 'scale' | 'priority' | null;
    choices: Array<{
        index: number;
        delta: {
            content?: string | null;        // Text content delta
            role?: 'system' | 'user' | 'assistant' | 'tool';  // Only in first chunk
            refusal?: string | null;         // Content filter refusal
            function_call?: {                // Legacy function calling
                name?: string;
                arguments?: string;          // Incremental JSON string
            };
            tool_calls?: Array<{             // Tool calling
                index: number;
                id?: string;                 // Only when starting new tool call
                type?: 'function';           // Only when starting new tool call
                function?: {
                    name?: string;
                    arguments?: string;      // Incremental JSON string
                };
            }>;
        };
        finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
        logprobs?: {
            content: Array<TokenLogprob> | null;
            refusal: Array<TokenLogprob> | null;
        } | null;
    }>;
    usage?: CompletionUsage | null;  // Only in final chunk (after all choices)
}
```

## Streaming Event Sequence

1. **First chunk**: Contains role in delta, establishes message context
2. **Content chunks**: Incremental text in `delta.content`
3. **Tool call chunks**: Incremental tool calls with indexed updates
4. **Final chunk**: `finish_reason` is non-null, may include usage

## Mapping to Holo Stream Events

### OpenAI → Holo (toHolo)

| OpenAI Event | Holo Event | Translator | Notes |
|--------------|------------|------------|-------|
| First chunk (with role in delta) | `message_start` | `OpenAIMessageStartTranslator` | One per choice with role; carries choice index |
| Content chunks (delta.content) | `content_delta` | `OpenAIContentDeltaTranslator` | Skips empty/null content; carries choice index |
| Tool call chunks (complete JSON) | `message_delta` | `OpenAIMessageDeltaTranslator` | Parses arguments; one per tool_call |
| Tool call chunks (partial JSON) | `message_delta` (shell) | `OpenAIMessageDeltaTranslator` | Empty delta, full provider_delta for accumulation |
| Chunk with usage | `message_delta` | `OpenAIMessageDeltaTranslator` | Usage only; no choice index |
| Chunk with finish_reason | `message_stop` | `OpenAIMessageStopTranslator` | One per choice; carries choice index |

### Holo → OpenAI (fromHolo)

| Holo Event | OpenAI Chunk | Translator | Notes |
|------------|--------------|------------|-------|
| `message_start` | First chunk with role | `OpenAIMessageStartTranslator` | Set delta.role; use providerDefaults for model/id |
| `content_delta` | Content chunk | `OpenAIContentDeltaTranslator` | Set delta.content; skip empty after trim |
| `message_delta` (tool_calls) | Tool call chunk | `OpenAIMessageDeltaTranslator` | Stringify arguments back to JSON |
| `message_delta` (usage) | Usage chunk | `OpenAIMessageDeltaTranslator` | Empty choices array valid per OpenAI spec |
| `message_stop` | Final chunk | `OpenAIMessageStopTranslator` | Set finish_reason; use providerDefaults |

## Key Differences from Other Providers

1. **Indexed Tool Calls**: Tool calls use array indices for updates
2. **Incremental JSON**: Tool arguments stream as JSON string fragments
3. **Choice Array**: Supports multiple parallel completions (n>1)
4. **Logprobs Support**: Optional token-level probabilities
5. **Legacy Function Call**: Deprecated but still supported

## Implementation Notes

1. **Stateless Translation**: All translators must be stateless - no tracking between calls
2. **Per-Choice Emission**: Emit one Holo event per OpenAI choice (supports n>1)
3. **Choice Index Safety**: Always validate with `Number.isInteger(idx) && idx >= 0`
4. **Timestamp Conversion**: OpenAI uses seconds, Holo uses milliseconds
   - `toHolo`: `created * 1000` (sec → ms)
   - `fromHolo`: `Math.floor(created / 1000)` (ms → sec)
5. **Full provider_delta**: Always store complete raw OpenAI chunk for validation compatibility
6. **JSON Accumulation**: Tool arguments stream as JSON fragments
   - Use `safeParse()` to attempt parsing
   - Emit shell event with empty `delta` for partial JSON
   - Include full `provider_delta` for downstream accumulation
   - Only emit parsed `tool_calls` when JSON is complete
7. **Usage Placement**: Usage appears after all choices complete (no choice index)
8. **Finish Reason Mapping**: Direct 1:1 mapping, return `null` for unknown (no defaults)
9. **Whitespace Preservation**: Never trim content - whitespace is semantically meaningful
10. **providerDefaults**: Use for model/id/metadata when reconstructing OpenAI chunks
11. **done Flag**: Never set in translators - orchestrator decides when all choices finished
12. **Fast Pass-Through**: Validate `provider_delta` and return directly for same-provider streaming

## Tool Call Streaming Pattern

```
1. Start new tool call:
   delta.tool_calls = [{ index: 0, id: "call_123", type: "function", function: { name: "get_weather" } }]

2. Stream arguments:
   delta.tool_calls = [{ index: 0, function: { arguments: "{\"loc" } }]
   delta.tool_calls = [{ index: 0, function: { arguments: "ation\": \"" } }]
   delta.tool_calls = [{ index: 0, function: { arguments: "Boston\"}" } }]

3. Multiple tools:
   delta.tool_calls = [{ index: 1, id: "call_456", type: "function", function: { name: "get_time" } }]
```

## Special Considerations

1. **Content Filtering**: `refusal` field for content policy violations (separate translator needed)
2. **System Fingerprint**: Tracked in optional metadata, preserved via providerDefaults
3. **Service Tier**: QoS level for API requests, preserved via providerDefaults
4. **Audio Support**: Future audio response support (currently null)
5. **Multi-Choice (n>1)**: Each choice emits separate Holo events with choice index
6. **Empty Choices Array**: Valid for usage-only chunks in OpenAI spec
7. **providerDefaults Injection**: Orchestrator must set model/id/metadata before fromHolo

## Translator Implementation Details

### Message Start
- **File**: `openai.message.start.translator.ts`
- **Detects**: Choice with `delta.role` present
- **Emits**: One `message_start` per role-bearing choice (rare multi-choice case)
- **Carries**: `choice` index, full raw chunk in `provider_delta`
- **Time**: Converts sec → ms (toHolo), ms → sec (fromHolo)

### Content Delta
- **File**: `openai.content.delta.translator.ts`
- **Detects**: Choice with `delta.content` as non-empty string
- **Skips**: Null, undefined, or empty string content (OpenAI streams null during tool_calls)
- **Whitespace**: Preserved - never trimmed
- **Carries**: `choice` index, lean per-choice `provider_delta` with metadata
- **Time**: Converts sec → ms (toHolo), ms → sec (fromHolo)

### Message Delta (Tool Calls & Usage)
- **File**: `openai.message.delta.translator.ts`
- **Detects**: Choice with `delta.tool_calls` array or chunk with `usage`
- **Tool Calls**:
  - Uses `safeParse()` to parse streaming JSON arguments
  - Emits shell (empty `delta`) for partial JSON, full parsed for complete JSON
  - Always includes full raw chunk in `provider_delta`
  - One Holo event per tool_call for clean indexing
- **Usage**:
  - Emits when `usage` present
  - No choice index (applies to entire completion)
- **fromHolo**: Stringifies parsed arguments back to JSON

### Message Stop
- **File**: `openai.message.stop.translator.ts`
- **Detects**: Choice with non-null `finish_reason`
- **Emits**: One `message_stop` per finished choice
- **Carries**: `choice` index, full raw chunk in `provider_delta`
- **Finish Reason**: 1:1 mapping, returns `null` for unknown (no invented defaults)
- **done Flag**: Not set - orchestrator decides when all choices finished
- **Time**: Converts sec → ms (toHolo), ms → sec (fromHolo)