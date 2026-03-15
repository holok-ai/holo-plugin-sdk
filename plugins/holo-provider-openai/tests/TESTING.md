# OpenAI Plugin Test Fixtures

## Wire Formats

### ChatCompletions (`openai.chatCompletions`)

**Non-streaming:** Single JSON body, `Content-Type: application/json`

```
{"id":"chatcmpl-...","object":"chat.completion","choices":[...],"usage":{...}}
```

**Streaming:** SSE frames, `Content-Type: text/event-stream`

```
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}\n\n
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}],"usage":{...}}\n\n
data: [DONE]\n\n
```

The `[DONE]` sentinel is unique to OpenAI ChatCompletions. The wire adapter emits two chunks for the done event: the
final data frame + the `[DONE]` frame.

### Responses API (`openai.responses`)

**Non-streaming:** Single JSON body, `Content-Type: application/json`

```
{"id":"resp-...","object":"response","output":[...],"usage":{...}}
```

**Streaming:** SSE with typed `event:` headers

```
event: response.output_item.added\ndata: {"type":"response.output_item.added",...}\n\n
event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Hello"}\n\n
event: response.completed\ndata: {"type":"response.completed","response":{...,"usage":{...}}}\n\n
```

## Audit Token Mapping

| Source                                                      | Field                      | Notes                                        |
|-------------------------------------------------------------|----------------------------|----------------------------------------------|
| ChatCompletions `usage.prompt_tokens`                       | `input_tokens`             |                                              |
| ChatCompletions `usage.completion_tokens`                   | `output_tokens`            |                                              |
| ChatCompletions `usage.prompt_tokens_details.cached_tokens` | `cache_read` (extra token) |                                              |
| Responses `response.usage.input_tokens`                     | `input_tokens`             | Nested under `.response` in streaming        |
| Responses `response.usage.output_tokens`                    | `output_tokens`            |                                              |
| Non-streaming Responses `usage.input_tokens`                | not mapped                 | Known gap: auditor expects `.response.usage` |

## Audit Status Mapping

| Condition                            | LlmStatus |
|--------------------------------------|-----------|
| `finish_reason === 'stop'`           | `SUCCESS` |
| `finish_reason === 'length'`         | `PARTIAL` |
| `finish_reason === 'content_filter'` | `ERROR`   |
| Error event                          | `ERROR`   |

## Adding a New Fixture

1. Create `tests/fixtures/{scenario}.{streaming|nonstreaming}.fixture.ts`
2. Capture the real response chunks from the OpenAI API (or build them manually)
3. Build `expectedWire` using the format rules above
4. Add `expectedAudit` using the token mapping table
5. For SDK round-trip: import `sdkAdapter` from `../sdk-adapter.js`, add `sdkRequest` and `expectedSdkResult` (partial
   match)

### Capturing Real Responses

Add temporary logging in `openai.provider.ts`:

```typescript
// In runChatCompletions, inside the streaming loop:
console.log('CHUNK:', JSON.stringify(chunk));

// For non-streaming:
const result = await this.client.chat.completions.create({...req, stream: false});
console.log('RESPONSE:', JSON.stringify(result));
```

Or query the Holo audit system:

```sql
SELECT metadata -> 'response_raw'
FROM holokai.provider_responses
WHERE provider_id = '...'
ORDER BY created_at DESC
LIMIT 1;
```

## Existing Fixtures

| Fixture                        | Protocol        | Streaming | Round-trip |
|--------------------------------|-----------------|-----------|------------|
| `chat-simple.nonstreaming`     | chatCompletions | no        | yes        |
| `chat-simple.streaming`        | chatCompletions | yes       | yes        |
| `response-simple.nonstreaming` | responses       | no        | no         |
| `response-simple.streaming`    | responses       | yes       | no         |

### Missing Coverage

- Tool calling (ChatCompletions + Responses)
- Vision / image content
- Error responses (4xx, content filter)
- `finish_reason: 'length'` (partial response)
- Embeddings protocol
- Cached token responses (`prompt_tokens_details.cached_tokens`)
