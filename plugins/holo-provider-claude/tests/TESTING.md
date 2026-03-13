# Claude Plugin Test Fixtures

## Wire Format

### Messages API (`claude.messages`)

**Non-streaming:** Single JSON body, `Content-Type: application/json`
```
{"id":"msg-...","type":"message","role":"assistant","content":[{"type":"text","text":"Hello"}],"usage":{...}}
```

**Streaming:** SSE with typed `event:` headers (same format as the Anthropic API)
```
event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n
event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}\n\n
event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":8}}\n\n
```

Each SSE frame has both `event: {type}` and `data: {json}` lines, where `type` comes from the `data.type` field.

## Audit Token Mapping

| Source | Field | Notes |
|--------|-------|-------|
| `usage.input_tokens` | `input_tokens` | |
| `usage.output_tokens` | `output_tokens` | |
| `usage.cache_read_input_tokens` | `cache_read` (extra token) | Prompt caching |
| `usage.cache_creation_input_tokens` | `cache_creation` (extra token) | Prompt caching |

## Audit Status Mapping

| Condition | LlmStatus |
|-----------|-----------|
| `stop_reason === 'end_turn'` | `SUCCESS` |
| `stop_reason === 'max_tokens'` | `PARTIAL` |
| Error event | `ERROR` |

## Adding a New Fixture

1. Create `tests/fixtures/{scenario}.{streaming|nonstreaming}.fixture.ts`
2. Capture response chunks — Claude's streaming events include: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`
3. Build `expectedWire`: each chunk → `event: {chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`
4. For non-streaming: `JSON.stringify(response)` with `application/json` headers
5. Add `expectedAudit` with token counts from `usage`

### Capturing Real Responses

```typescript
// In claude.provider.ts, streaming loop:
console.log('EVENT:', JSON.stringify(event));
```

Or from audit:
```sql
SELECT metadata->'response_raw' FROM holokai.provider_responses
WHERE provider_id = '...' ORDER BY created_at DESC LIMIT 1;
```

## Existing Fixtures

| Fixture | Protocol | Streaming | Round-trip |
|---------|----------|-----------|------------|
| `messages-simple.nonstreaming` | messages | no | no |
| `messages-simple.streaming` | messages | yes | no |

### Missing Coverage

- Tool use (function calling)
- Vision / image content
- Error responses
- `stop_reason: 'max_tokens'` (partial response)
- Prompt caching (`cache_read_input_tokens`, `cache_creation_input_tokens`)
- SDK round-trip adapter (`@anthropic-ai/sdk`)
