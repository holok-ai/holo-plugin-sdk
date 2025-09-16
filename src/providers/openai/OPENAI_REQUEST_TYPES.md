# Consolidated Field Surface for OpenAI Request Types

**Primary Type**: `ChatCompletionCreateParamsBase` from the OpenAI SDK

## Core OpenAI Chat Request Fields

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **model** | `string` | **Required** | Model identifier (e.g., "gpt-4", "gpt-3.5-turbo") |
| **messages** | `Array<OpenAIMessage>` | **Required** | Conversation messages |
| **temperature** | `number` | Optional | Randomness (0.0 - 2.0) |
| **top_p** | `number` | Optional | Nucleus sampling (0.0 - 1.0) |
| **n** | `number` | Optional | Number of completions to generate |
| **stream** | `boolean` | Optional | Enable streaming response |
| **stop** | `string \| Array<string>` | Optional | Stop sequences |
| **max_tokens** | `number` | Optional | Maximum tokens to generate |
| **presence_penalty** | `number` | Optional | Penalize repeated topics (-2.0 to 2.0) |
| **frequency_penalty** | `number` | Optional | Penalize frequent tokens (-2.0 to 2.0) |
| **logit_bias** | `Record<string, number>` | Optional | Token bias mapping |
| **user** | `string` | Optional | User identifier for abuse monitoring |
| **seed** | `number` | Optional | For reproducible outputs |
| **logprobs** | `boolean` | Optional | Return log probabilities |
| **top_logprobs** | `number` | Optional | Number of top log probabilities (1-20) |
| **response_format** | `OpenAIResponseFormat` | Optional | Response format specification |
| **tools** | `Array<OpenAITool>` | Optional | Available tools/functions |
| **tool_choice** | `OpenAIToolChoice` | Optional | Tool choice strategy |
| **parallel_tool_calls** | `boolean` | Optional | Allow parallel tool calls |
| **service_tier** | `'auto' \| 'default'` | Optional | OpenAI-only service tier selection |

## Message Structure Breakdown

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **role** | `'system' \| 'user' \| 'assistant' \| 'tool'` | **Required** | Message role |
| **content** | `string \| Array<ContentPart>` | **Required** | Message content |
| **name** | `string` | Optional | Message author name |
| **tool_calls** | `Array<ToolCall>` | Optional | Assistant tool calls |
| **tool_call_id** | `string` | Optional | Tool response identifier |

## Content Part Types (for multimodal)

### Text Content Part

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **type** | `'text'` | **Required** | Content type |
| **text** | `string` | **Required** | Text content |

### Image URL Content Part

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **type** | `'image_url'` | **Required** | Content type |
| **image_url** | `ImageURL` | **Required** | Image specification |

#### Image URL Structure

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **url** | `string` | **Required** | Image URL or base64 data URL |
| **detail** | `'low' \| 'high' \| 'auto'` | Optional | Image processing detail level |

## Tool Structure Breakdown

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **type** | `'function'` | **Required** | Tool type |
| **function** | `FunctionDefinition` | **Required** | Function specification |

### Function Definition Structure

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **name** | `string` | **Required** | Function name |
| **description** | `string` | Optional | Function description |
| **parameters** | `Record<string, unknown>` | Optional | JSON schema for parameters |
| **strict** | `boolean` | Optional | OpenAI-only strict mode for structured output |

## Tool Call Structure (in messages)

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **id** | `string` | **Required** | Unique tool call identifier |
| **type** | `'function'` | **Required** | Tool call type |
| **function** | `FunctionCall` | **Required** | Function call details |

### Function Call Structure

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **name** | `string` | **Required** | Function name |
| **arguments** | `string` | **Required** | JSON string of arguments |

## Tool Choice Types

| Type | Structure | Purpose |
|------|-----------|---------|
| **'auto'** | `string` | Model decides when to use tools |
| **'none'** | `string` | Never use tools |
| **'required'** | `string` | Must use a tool |
| **Specific Function** | `{ type: 'function', function: { name: string } }` | Use specific function |

## Response Format Structure

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **type** | `'text' \| 'json_object' \| 'json_schema'` | **Required** | Response format type |
| **json_schema** | `JSONSchema` | Optional | Schema for structured output |

### JSON Schema Structure

| Field | Type | Required/Optional | Purpose |
|-------|------|------------------|---------|
| **name** | `string` | **Required** | Schema name |
| **description** | `string` | Optional | Schema description |
| **schema** | `Record<string, unknown>` | **Required** | JSON schema definition |
| **strict** | `boolean` | Optional | Enforce strict adherence |

## OpenAI-Only Features

| Feature | Field | Type | Purpose |
|--------|-------|------|---------|
| **Service Tier** | `service_tier` | `'auto' \| 'default'` | API tier selection |
| **Strict Mode** | `strict` | `boolean` | Enforce schema compliance |
| **Parallel Tool Calls** | `parallel_tool_calls` | `boolean` | Concurrent tool execution |
| **Log Probabilities** | `logprobs`, `top_logprobs` | `boolean`, `number` | Token probability analysis |
| **Logit Bias** | `logit_bias` | `Record<string, number>` | Adjust token probabilities |
| **N Completions** | `n` | `number` | Multiple completions |
| **User Tracking** | `user` | `string` | End-user identifier |
| **Image Detail** | `detail` | `'low' \| 'high' \| 'auto'` | Vision quality setting |

## Default Values

```typescript
{
  stream: false,
  temperature: 1.0,
  top_p: 1.0,
  n: 1,
  parallel_tool_calls: true,
  tool_choice: 'auto',
  response_format: { type: 'text' }
}
```

## Required Field Patterns

- **Always required:** `model`, `messages`
- **Message-level:** `role`, `content`
- **Tool-related:** `tools[].type`, `tools[].function.name`, `tool_calls[].id`, `tool_calls[].function.name`, `tool_calls[].function.arguments`
- **Response format:** `response_format.type`, `json_schema.name`, `json_schema.schema` (when type is json_schema)
