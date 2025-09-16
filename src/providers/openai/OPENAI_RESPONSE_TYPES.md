# Complete OpenAI Response Types with Required/Optional Fields

**Primary Types:** `ChatCompletion` (complete) and `ChatCompletionChunk` (streaming) from the OpenAI SDK.

---

## 1) Chat Completion (`ChatCompletion`)
**Purpose:** Complete conversation response

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **id** | `string` | **Required** | Unique response identifier |
| **object** | `'chat.completion'` | **Required** | Response type identifier |
| **created** | `number` | **Required** | Unix timestamp (seconds) |
| **model** | `string` | **Required** | Model used for generation |
| **choices** | `Array<Choice>` | **Required** | Response choices array |
| **usage** | `CompletionUsage` | Optional | Token usage statistics |
| **system_fingerprint** | `string` | Optional | System configuration fingerprint |
| **service_tier** | `'auto' \| 'default'` | Optional | Service tier used (present only if requested) |

---

## 2) Chat Completion Chunk (`ChatCompletionChunk`)
**Purpose:** Streaming response chunk

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **id** | `string` | **Required** | Unique response identifier |
| **object** | `'chat.completion.chunk'` | **Required** | Response type identifier |
| **created** | `number` | **Required** | Unix timestamp (seconds) |
| **model** | `string` | **Required** | Model used for generation |
| **choices** | `Array<ChunkChoice>` | **Required** | Streaming choices array |
| **usage** | `CompletionUsage \| null` | Optional | Present only on the extra usage chunk when enabled |
| **system_fingerprint** | `string` | Optional | System configuration fingerprint |
| **service_tier** | `'auto' \| 'default'` | Optional | Service tier used (present only if requested) |

---

## Choice Structure (complete response)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **index** | `number` | **Required** | Choice index |
| **message** | `AssistantMessage` | **Required** | Complete assistant message |
| **finish_reason** | `'stop' \| 'length' \| 'tool_calls'` | **Required** | Why generation stopped |
| **logprobs** | `ChoiceLogprobs` | Optional | Token-level probabilities |

---

## Chunk Choice Structure (streaming)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **index** | `number` | **Required** | Choice index |
| **delta** | `ChoiceDelta` | **Required** | Incremental message data |
| **finish_reason** | `'stop' \| 'length' \| 'tool_calls' \| null` | **Required** | `null` until final chunk |
| **logprobs** | `ChoiceLogprobs` | Optional | Token-level probabilities |

---

## Assistant Message (complete)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **role** | `'assistant'` | **Required** | Message role |
| **content** | `string \| null` | Optional | Text content (may be `null` when only tool calls) |
| **tool_calls** | `Array<ToolCall>` | Optional | Tool calls emitted by the model |
| **refusal** | `string \| null` | Optional | Refusal text (if applicable) |

---

## Choice Delta (streaming)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **role** | `'assistant'` | Optional | Typically sent in the first chunk |
| **content** | `string \| null` | Optional | Incremental text content |
| **tool_calls** | `Array<ToolCallDelta>` | Optional | Incremental tool call data |
| **refusal** | `string \| null` | Optional | Incremental refusal text |

---

## Tool Call (complete)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **id** | `string` | **Required** | Unique tool call identifier |
| **type** | `'function'` | **Required** | Tool call type |
| **function** | `FunctionCall` | **Required** | Function call details |

---

## Tool Call Delta (streaming)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **index** | `number` | **Required** | Tool call index in the list |
| **id** | `string` | Optional | Set on an early chunk |
| **type** | `'function'` | Optional | Set on an early chunk |
| **function** | `FunctionCallDelta` | Optional | Incremental function call data |

---

## Function Call (complete)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **name** | `string` | **Required** | Function name |
| **arguments** | `string` | **Required** | JSON string of arguments |

---

## Function Call Delta (streaming)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **name** | `string` | Optional | Sent in an early chunk |
| **arguments** | `string` | Optional | Incremental JSON arguments |

---

## Completion Usage

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **prompt_tokens** | `number` | **Required** | Input tokens consumed |
| **completion_tokens** | `number` | **Required** | Output tokens generated |
| **total_tokens** | `number` | **Required** | Sum of input and output tokens |
| **prompt_tokens_details** | `PromptTokensDetails` | Optional | Input token breakdown |
| **completion_tokens_details** | `CompletionTokensDetails` | Optional | Output token breakdown |

### Prompt Tokens Details

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **cached_tokens** | `number` | Optional | Cached tokens used |
| **audio_tokens** | `number` | Optional | Audio input tokens |

### Completion Tokens Details

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **reasoning_tokens** | `number` | Optional | Reasoning tokens |
| **audio_tokens** | `number` | Optional | Audio output tokens |
| **accepted_prediction_tokens** | `number` | Optional | Speculative accepted tokens |
| **rejected_prediction_tokens** | `number` | Optional | Speculative rejected tokens |

---

## Choice Logprobs

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **content** | `Array<TokenLogprob>` | Optional | Logprobs for text tokens |
| **refusal** | `Array<TokenLogprob>` | Optional | Logprobs for refusal tokens |

### Token Logprob

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **token** | `string` | **Required** | Token text |
| **logprob** | `number` | **Required** | Log probability |
| **bytes** | `Array<number>` | Optional | Token bytes |
| **top_logprobs** | `Array<TopLogprob>` | **Required** | Top alternative tokens |

### Top Logprob

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **token** | `string` | **Required** | Alternative token text |
| **logprob** | `number` | **Required** | Log probability |
| **bytes** | `Array<number>` | Optional | Token bytes |

---

## Finish Reasons

| Finish Reason | Purpose |
|--------------|---------|
| **'stop'** | Natural completion |
| **'length'** | Max tokens reached |
| **'tool_calls'** | Tool calls required |

---

## Required Field Patterns by Response Type

### Always Required
| Response Type | Fields |
|--------------|--------|
| **ChatCompletion** | `id`, `object`, `created`, `model`, `choices` |
| **ChatCompletionChunk** | `id`, `object`, `created`, `model`, `choices` |

### Choice-Level
| Choice Type | Fields |
|-------------|--------|
| **Choice** | `index`, `message`, `finish_reason` |
| **ChunkChoice** | `index`, `delta`, `finish_reason` |

### Message / Delta
| Type | Fields |
|------|--------|
| **AssistantMessage** | `role` |
| **ChoiceDelta** | *(none required)* |

### Tool-Related
| Structure | Fields |
|----------|--------|
| **ToolCall** | `id`, `type`, `function` |
| **ToolCallDelta** | `index` |
| **FunctionCall** | `name`, `arguments` |

### Usage / Logprobs
| Structure | Fields |
|----------|--------|
| **CompletionUsage** | `prompt_tokens`, `completion_tokens`, `total_tokens` |
| **TokenLogprob** | `token`, `logprob`, `top_logprobs` |
| **TopLogprob** | `token`, `logprob` |

---

## Streaming vs Complete Responses

### Complete
- Full `AssistantMessage` (`content`, `tool_calls` if any)
- Definitive `finish_reason`
- Complete `ToolCall` objects
- `usage` included on the final response (when requested)

### Streaming
- Incremental `ChoiceDelta` updates
- `finish_reason` is `null` until the final relevant chunk
- Incremental `ToolCallDelta` with indices
- Optional extra **usage chunk** (when `include_usage=true`), often with `choices: []`

