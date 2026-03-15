# Gemini Plugin Test Fixtures

## Wire Formats

### generateContent (`gemini.generateContent`)

**Non-streaming:** Single JSON body, `Content-Type: application/json`

```
{"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finishReason":"STOP"}],"usageMetadata":{...}}
```

### streamGenerateContent (`gemini.streamGenerateContent`)

**Streaming:** SSE data-only frames (no `event:` header), `Content-Type: text/event-stream`

```
data: {"candidates":[{"content":{"parts":[{"text":"Hello "}],"role":"model"}}]}\n\n
data: {"candidates":[{"content":{"parts":[{"text":"world"}],"role":"model"},"finishReason":"STOP"}],"usageMetadata":{...}}\n\n
```

Gemini uses a simpler SSE format than OpenAI/Claude — just `data:` lines without `event:` headers.

## Audit Token Mapping

| Source                                  | Field                      | Notes                     |
|-----------------------------------------|----------------------------|---------------------------|
| `usageMetadata.promptTokenCount`        | `input_tokens`             |                           |
| `usageMetadata.candidatesTokenCount`    | `output_tokens`            |                           |
| `usageMetadata.thoughtsTokenCount`      | `thinking` (extra token)   | Thinking/reasoning tokens |
| `usageMetadata.cachedContentTokenCount` | `cache_read` (extra token) | Context caching           |

## Audit Status Mapping

| Condition                       | LlmStatus |
|---------------------------------|-----------|
| `finishReason === 'STOP'`       | `SUCCESS` |
| `finishReason === 'MAX_TOKENS'` | `PARTIAL` |
| Error event                     | `ERROR`   |

## Protocol Notes

Gemini uses two separate protocols for streaming vs non-streaming:

- `gemini.generateContent` — non-streaming only
- `gemini.streamGenerateContent` — streaming only

This differs from other plugins where a single protocol handles both modes.

## Adding a New Fixture

1. Create `tests/fixtures/{scenario}.{streaming|nonstreaming}.fixture.ts`
2. For streaming use protocol `gemini.streamGenerateContent`, for non-streaming use `gemini.generateContent`
3. Build `expectedWire`:
    - Non-streaming: `JSON.stringify(response)` with `application/json`
    - Streaming: each chunk → `data: ${JSON.stringify(chunk)}\n\n`
4. Add `expectedAudit` — token counts come from `usageMetadata` on the final response

### Capturing Real Responses

```typescript
// In gemini.provider.ts, streaming loop:
console.log('CHUNK:', JSON.stringify(chunk));
```

## Existing Fixtures

| Fixture                 | Protocol              | Streaming | Round-trip |
|-------------------------|-----------------------|-----------|------------|
| `generate.nonstreaming` | generateContent       | no        | no         |
| `generate.streaming`    | streamGenerateContent | yes       | no         |

### Missing Coverage

- Tool calling / function declarations
- Error responses (safety blocks, quota exceeded)
- `finishReason: 'MAX_TOKENS'` (partial response)
- Thinking tokens (`thoughtsTokenCount`)
- Context caching (`cachedContentTokenCount`)
- Embeddings protocol (`gemini.embedContent`)
- SDK round-trip adapter (`@google/genai`)
