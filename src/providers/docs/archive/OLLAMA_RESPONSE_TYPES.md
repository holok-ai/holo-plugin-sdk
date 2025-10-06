# Complete Ollama Response Types with Required/Optional Fields (v0.5.15)

## 1. Chat Response (`ChatResponse`)
**Purpose**: Multi-turn conversation responses

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **message** | `OllamaMessage` | **Required** | Assistant's response message |
| **model** | `string` | **Required** | Model used for generation |
| **created_at** | `string` | **Required** | Response timestamp |
| **done** | `boolean` | **Required** | Stream completion indicator |
| **total_duration** | `number` | Optional | Total processing time (nanoseconds) |
| **load_duration** | `number` | Optional | Model loading time (nanoseconds) |
| **prompt_eval_count** | `number` | Optional | Input tokens processed |
| **prompt_eval_duration** | `number` | Optional | Input processing time (nanoseconds) |
| **eval_count** | `number` | Optional | Output tokens generated |
| **eval_duration** | `number` | Optional | Output generation time (nanoseconds) |

### Message Structure (within ChatResponse)
| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **role** | `string` | **Required** | Message role (typically "assistant") |
| **content** | `string` | **Required** | Response content |
| **images** | `Array<string>` | Optional | Base64 encoded images |
| **tool_calls** | `Array<ToolCall>` | Optional | Tool calls made by the model |

## 2. Generate Response (`GenerateResponse`)
**Purpose**: Single completion responses

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **response** | `string` | **Required** | Generated text content |
| **model** | `string` | **Required** | Model used for generation |
| **created_at** | `string` | **Required** | Response timestamp |
| **done** | `boolean` | **Required** | Stream completion indicator |
| **context** | `Array<number>` | Optional | Conversation context |
| **total_duration** | `number` | Optional | Total processing time (nanoseconds) |
| **load_duration** | `number` | Optional | Model loading time (nanoseconds) |
| **prompt_eval_count** | `number` | Optional | Input tokens processed |
| **prompt_eval_duration** | `number` | Optional | Input processing time (nanoseconds) |
| **eval_count** | `number` | Optional | Output tokens generated |
| **eval_duration** | `number` | Optional | Output generation time (nanoseconds) |

## 3. Embed Response (`EmbedResponse`)
**Purpose**: Single text embedding

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **embedding** | `Array<number>` | **Required** | Single embedding vector |
| **model** | `string` | **Required** | Model used for embedding |
| **prompt_eval_count** | `number` | Optional | Input tokens processed |
| **total_duration** | `number` | Optional | Total processing time (nanoseconds) |
| **load_duration** | `number` | Optional | Model loading time (nanoseconds) |

## 4. Embeddings Response (`EmbeddingsResponse`)
**Purpose**: Multiple text embeddings (batch)

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **embeddings** | `Array<Array<number>>` | **Required** | Multiple embedding vectors |
| **model** | `string` | **Required** | Model used for embedding |
| **prompt_eval_count** | `number` | Optional | Input tokens processed |
| **total_duration** | `number` | Optional | Total processing time (nanoseconds) |
| **load_duration** | `number` | Optional | Model loading time (nanoseconds) |

## 5. Progress Response (`ProgressResponse`)
**Purpose**: Model download/loading progress

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **status** | `string` | **Required** | Progress status |
| **digest** | `string` | Optional | Content digest/hash |
| **total** | `number` | Optional | Total bytes to download |
| **completed** | `number` | Optional | Bytes downloaded |

## 6. Model Response (`ModelResponse`)
**Purpose**: Model information and configuration

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **modelfile** | `string` | Optional | Model file content |
| **parameters** | `string` | Optional | Model parameter configuration |
| **template** | `string` | Optional | Prompt template |
| **details** | `ModelDetails` | Optional | Model metadata |
| **info** | `ModelInfo` | Optional | Additional model information |

### ModelDetails Structure
| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **parent_model** | `string` | Optional | Base model name |
| **format** | `string` | Optional | Model format |
| **family** | `string` | Optional | Model family |
| **families** | `Array<string>` | Optional | Model family hierarchy |
| **parameter_size** | `string` | Optional | Model size |
| **quantization_level** | `string` | Optional | Quantization level |

## 7. Show Response (`ShowResponse`)
**Purpose**: Alias for `ModelResponse`

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **modelfile** | `string` | Optional | Model file content |
| **parameters** | `string` | Optional | Model parameters |
| **template** | `string` | Optional | Prompt template |
| **details** | `ModelDetails` | Optional | Model metadata |
| **info** | `ModelInfo` | Optional | Model information |

## 8. List Response (`ListResponse`)
**Purpose**: Available models listing

| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **models** | `Array<ModelInfo>` | **Required** | List of models |

### ModelInfo Structure
| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **name** | `string` | **Required** | Model name |
| **model** | `string` | **Required** | Model identifier |
| **size** | `number` | **Required** | Model size |
| **digest** | `string` | **Required** | Model digest |
| **details** | `ModelDetails` | Optional | Model details |
| **expires_at** | `string` | Optional | Model expiration |
| **size_vram** | `number` | Optional | VRAM usage |

## 9. Error Response (`ErrorResponse`)
| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **error** | `string` | **Required** | Error message |

## 10. Status Response (`StatusResponse`)
| Field | Type | Required/Optional | Purpose |
|------|------|------------------|---------|
| **status** | `string` | **Required** | Server status |
