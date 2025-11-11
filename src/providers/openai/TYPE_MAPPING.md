# OpenAI SDK Type Mapping

**Last Updated:** 2025-11-10
**SDK Version:** Latest (v7+)

This document maps OpenAI SDK types to our Holokai type names and tracks implementation status.

**Legend:**
- ✅ Type Exported & Validator Implemented
- 🟡 Type Exported, No Validator
- ❌ Not Implemented

---

## Chat Completions API

### Request Types (from `openai/resources/chat/completions` & `openai/resources/shared`)

| SDK Type | Holokai Type | Status | Validator |
|----------|--------------|--------|-----------|
| `FunctionParameters` | `OpenAIFunctionParameters` | ✅ | `OpenAIFunctionParametersValidator` |
| `FunctionDefinition` | `OpenAIFunctionDefinition` | ✅ | `OpenAIFunctionDefinitionValidator` |
| `Metadata` | `OpenAIMetadata` | ✅ | `OpenAIMetadataValidator` |
| `ReasoningEffort` | `OpenAIReasoningEffort` | ✅ | `OpenAIReasoningEffortValidator` |
| `ResponseFormatText` | `OpenAIResponseFormatText` | ✅ | `OpenAIResponseFormatTextValidator` |
| `ResponseFormatJSONObject` | `OpenAIResponseFormatJSONObject` | ✅ | `OpenAIResponseFormatJSONObjectValidator` |
| `ResponseFormatJSONSchema` | `OpenAIResponseFormatJSONSchema` | ✅ | `OpenAIResponseFormatJSONSchemaValidator` |
| `ResponseFormatJSONSchema.JSONSchema` | `OpenAIResponseFormatJSONSchemaJSONSchema` | ✅ | `OpenAIResponseFormatJSONSchemaJSONSchemaValidator` |
| (union) | `OpenAIResponseFormat` | ✅ | `OpenAIResponseFormatValidator` |
| `ChatCompletionContentPartText` | `OpenAIChatCompletionContentPartText` | ✅ | `OpenAIChatCompletionContentPartTextValidator` |
| `ChatCompletionContentPartRefusal` | `OpenAIChatCompletionContentPartRefusal` | ✅ | `OpenAIChatCompletionContentPartRefusalValidator` |
| `ChatCompletionContentPartImage` | `OpenAIChatCompletionContentPartImage` | ✅ | `OpenAIChatCompletionContentPartImageValidator` |
| `ChatCompletionContentPartImage.ImageURL` | `OpenAIChatCompletionContentPartImageImageURL` | ✅ | `OpenAIChatCompletionContentPartImageImageURLValidator` |
| `ChatCompletionContentPartInputAudio` | `OpenAIChatCompletionContentPartInputAudio` | ✅ | `OpenAIChatCompletionContentPartInputAudioValidator` |
| `ChatCompletionContentPartInputAudio.InputAudio` | `OpenAIChatCompletionContentPartInputAudioInputAudio` | ✅ | `OpenAIChatCompletionContentPartInputAudioInputAudioValidator` |
| `ChatCompletionContentPart` | `OpenAIChatCompletionContentPart` | ✅ | `OpenAIChatCompletionContentPartValidator` |
| `ChatCompletionContentPart.File` | `OpenAIChatCompletionContentPartFile` | ✅ | `OpenAIChatCompletionContentPartFileValidator` |
| `ChatCompletionContentPart.File.File` | `OpenAIChatCompletionContentPartFileFile` | ✅ | `OpenAIChatCompletionContentPartFileFileValidator` |
| `ChatCompletionAudioParam` | `OpenAIChatCompletionAudioParam` | ✅ | `OpenAIChatCompletionAudioParamValidator` |
| `ChatCompletionFunctionTool` | `OpenAIChatCompletionFunctionTool` | 🟡 | ❌ (used inline) |
| `ChatCompletionCustomTool` | `OpenAIChatCompletionCustomTool` | 🟡 | ❌ (used inline) |
| `ChatCompletionCustomTool.Custom` | `OpenAIChatCompletionCustomToolCustom` | 🟡 | ❌ (used inline) |
| `ChatCompletionTool` | `OpenAIChatCompletionTool` | ✅ | `ChatCompletionToolValidator` |
| `ChatCompletionToolChoiceOption` | `OpenAIChatCompletionToolChoiceOption` | ✅ | `ChatCompletionToolChoiceOptionValidator` |
| `ChatCompletionPredictionContent` | `OpenAIChatCompletionPredictionContent` | ✅ | `OpenAIChatCompletionPredictionContentValidator` |
| `ChatCompletionStreamOptions` | `OpenAIChatCompletionStreamOptions` | ✅ | `OpenAIChatCompletionStreamOptionsValidator` |
| `ChatCompletionAssistantMessageParam.Audio` | `OpenAIAssistantMessageAudio` | 🟡 | (internal validator) |
| `ChatCompletionMessageParam` | `OpenAIRequestMessage` | ✅ | `OpenAIRequestMessageValidator` |
| `ChatCompletionCreateParamsBase` | `OpenAIChatRequest` | ✅ | `OpenAIChatRequestValidator` |
| (custom) | `OpenAIOnlyChatRequestFields` | 🟡 | ❌ (type-level only) |
| (custom) | `OpenAIOnlyChatRequest` | ✅ | `OpenAIOnlyRequestValidator` |
| (custom) | `OpenAISharedChatRequest` | ✅ | `OpenAISharedRequestValidator` |
| `ChatCompletionCreateParams.WebSearchOptions` | (not exported) | ✅ | `OpenAIWebSearchOptionsValidator` |

**Request Types Count:** 32 types exported, 26 validators implemented

---

### Response Types (from `openai/resources/chat/completions` & `openai/resources/completions`)

| SDK Type | Holokai Type | Status | Validator |
|----------|--------------|--------|-----------|
| `CompletionUsage` | `OpenAICompletionUsage` | ✅ | `OpenAICompletionUsageValidator` |
| `CompletionUsage.CompletionTokensDetails` | `OpenAICompletionUsageCompletionTokensDetails` | ✅ | `OpenAICompletionUsageCompletionTokensDetailsValidator` |
| `CompletionUsage.PromptTokensDetails` | `OpenAICompletionUsagePromptTokensDetails` | ✅ | `OpenAICompletionUsagePromptTokensDetailsValidator` |
| `ChatCompletionAudio` | `OpenAIChatCompletionAudio` | ✅ | `OpenAIChatCompletionAudioValidator` |
| `ChatCompletionMessage.Annotation.URLCitation` | `OpenAIChatCompletionMessageAnnotationURLCitation` | ✅ | `OpenAIChatCompletionMessageAnnotationURLCitationValidator` |
| `ChatCompletionMessage.Annotation` | `OpenAIChatCompletionMessageAnnotation` | ✅ | `OpenAIChatCompletionMessageAnnotationValidator` |
| `ChatCompletionMessage.FunctionCall` | `OpenAIChatCompletionMessageFunctionCall` | ✅ | `OpenAIChatCompletionMessageFunctionCallValidator` |
| `ChatCompletionMessageFunctionToolCall` | `OpenAIChatCompletionMessageFunctionToolCall` | 🟡 | (internal validator) |
| `ChatCompletionMessageCustomToolCall` | `OpenAIChatCompletionMessageCustomToolCall` | 🟡 | (internal validator) |
| `ChatCompletionMessageFunctionToolCall.Function` | `OpenAIChatCompletionMessageToolCallFunction` | ✅ | `OpenAIChatCompletionMessageToolCallFunctionValidator` |
| `ChatCompletionMessageCustomToolCall.Custom` | `OpenAIChatCompletionMessageToolCallCustom` | 🟡 | (internal validator) |
| `ChatCompletionMessageToolCall` | `OpenAIChatCompletionMessageToolCall` | ✅ | `OpenAIChatCompletionMessageToolCallValidator` |
| `ChatCompletionMessage` | `OpenAIChatCompletionMessage` | ✅ | `OpenAIChatCompletionMessageValidator` |
| `ChatCompletionTokenLogprob.TopLogprob` | `OpenAIChatCompletionTokenLogprobTopLogprob` | ✅ | `OpenAIChatCompletionTokenLogprobTopLogprobValidator` |
| `ChatCompletionTokenLogprob` | `OpenAIChatCompletionTokenLogprob` | ✅ | `OpenAIChatCompletionTokenLogprobValidator` |
| `ChatCompletion.Choice.Logprobs` | `OpenAIChatCompletionChoiceLogprobs` | ✅ | `OpenAIChatCompletionChoiceLogprobsValidator` |
| `ChatCompletion.Choice` | `OpenAIChatCompletionChoice` | ✅ | `OpenAIChatCompletionChoiceValidator` |
| `ChatCompletion` | `OpenAIChatCompletion` | ✅ | `OpenAIChatCompletionValidator` |
| `ChatCompletionChunk.Choice.Delta.FunctionCall` | `OpenAIChatCompletionChunkChoiceDeltaFunctionCall` | ✅ | `OpenAIChatCompletionChunkChoiceDeltaFunctionCallValidator` |
| `ChatCompletionChunk.Choice.Delta.ToolCall.Function` | `OpenAIChatCompletionChunkChoiceDeltaToolCallFunction` | ✅ | `OpenAIChatCompletionChunkChoiceDeltaToolCallFunctionValidator` |
| `ChatCompletionChunk.Choice.Delta.ToolCall` | `OpenAIChatCompletionChunkChoiceDeltaToolCall` | ✅ | `OpenAIChatCompletionChunkChoiceDeltaToolCallValidator` |
| `ChatCompletionChunk.Choice.Delta` | `OpenAIChatCompletionChunkChoiceDelta` | ✅ | `OpenAIChatCompletionChunkChoiceDeltaValidator` |
| `ChatCompletionChunk.Choice.Logprobs` | `OpenAIChatCompletionChunkChoiceLogprobs` | ✅ | `OpenAIChatCompletionChunkChoiceLogprobsValidator` |
| `ChatCompletionChunk.Choice` | `OpenAIChatCompletionChunkChoice` | ✅ | `OpenAIChatCompletionChunkChoiceValidator` |
| `ChatCompletionChunk` | `OpenAIChatCompletionChunk` | ✅ | `OpenAIChatCompletionChunkValidator` |
| (union) | `OpenAIChatCompletionResponse` | ✅ | `OpenAIResponseValidator` |
| (custom) | `OpenAIOnlyResponseFields` | 🟡 | ❌ (type-level only) |
| (custom) | `OpenAIOnlyResponse` | ✅ | `OpenAIOnlyResponseValidator` |

**Response Types Count:** 28 types exported, 24 validators implemented

---

## Responses API

**Status:** 📋 Planned - 205 types to implement

### Type Categories to Implement

See `docs/plan/openai-responses-api-plan.md` for complete ordered list.

#### Basic Types (3)
- `ResponseStatus`
- `ResponseIncludable`
- `ToolChoiceOptions`

#### Input Content Types (9)
- `ResponseInputText`
- `ResponseInputTextContent`
- `ResponseInputImage`
- `ResponseInputImageContent`
- `ResponseInputFile`
- `ResponseInputFileContent`
- `ResponseInputContent` (union)
- `ResponseInputAudio` + nested
- `ResponseInputMessageContentList`

#### Output Content Types (11)
- `ResponseOutputRefusal`
- `ResponseOutputText` + 5 nested types (Logprob, FileCitation, URLCitation, etc.)
- `ResponseOutputAudio`
- `ResponseContent` + nested

#### Error Types (1)
- `ResponseError`

#### Usage Types (3)
- `ResponseUsage.InputTokensDetails`
- `ResponseUsage.OutputTokensDetails`
- `ResponseUsage`

#### Tool Types (27)
- `FunctionTool`, `CustomTool`, `ComputerTool`
- `FileSearchTool` + nested
- `WebSearchTool` + nested
- `WebSearchPreviewTool` + nested
- `Tool.CodeInterpreter` + nested
- `Tool.ImageGeneration` + nested
- `Tool.LocalShell`
- `Tool.Mcp` + nested
- `Tool` (union)
- `ToolChoiceAllowed`, `ToolChoiceCustom`, `ToolChoiceFunction`, `ToolChoiceMcp`, `ToolChoiceTypes`

#### Tool Call Types (32)
- Function, Web Search, Custom, File Search, Computer, Code Interpreter, Reasoning tool calls
- Each with their own nested types

#### Message Types (16)
- `ResponseOutputMessage`
- `ResponseInputMessageItem`
- `EasyInputMessage`
- Various function call outputs
- ResponseItem types

#### Input Item Types (15)
- `ResponseInputItem` (complex union)
- Nested types for Message, Computer, Function, Image, Shell, MCP outputs

#### Output Item Types (8)
- `ResponseOutputItem` (complex union)
- Nested types for various output items

#### Response Configuration Types (8)
- `ResponseConversationParam`
- `ResponsePrompt`
- `ResponseFormatTextJSONSchemaConfig`
- `ResponseFormatTextConfig`
- `ResponseTextConfig`
- `Response.IncompleteDetails`
- `Response.Conversation`
- `Response` (main response object)

#### Stream Event Types (54)
- Text delta/done events
- Refusal delta/done events
- Content part added/done events
- Function call argument delta/done events
- Audio events
- Code interpreter events
- Reasoning events
- File/web search events
- Image generation events
- MCP events
- Output item events
- Lifecycle events

#### Top-Level Request Types (8)
- `ResponseCreateParams.StreamOptions`
- `ResponseCreateParamsBase`
- `ResponseCreateParamsNonStreaming`
- `ResponseCreateParamsStreaming`
- `ResponseCreateParams` (union)
- `ResponseRetrieveParamsBase`
- `ResponseRetrieveParamsNonStreaming`
- `ResponseRetrieveParamsStreaming`
- `ResponseRetrieveParams` (union)

**Total Responses API Types:** 205 types to export and validate

---

## Summary Statistics

### Chat Completions API ✅
- **Request Types:** 32 exported, 26 validators (81% coverage)
- **Response Types:** 28 exported, 24 validators (86% coverage)
- **Total:** 60 types, 50 validators (83% coverage)

### Responses API 📋
- **Planned Types:** 205
- **Planned Validators:** 205
- **Status:** Not yet implemented

### Overall
- **Current Implementation:** 60 types, 50 validators
- **After Responses API:** 265 types, 255 validators (projected)

---

## Notes

- Some types don't need validators because they're used inline or are type-level constructs only (e.g., `OpenAIOnlyChatRequestFields`)
- Internal validators exist for some types but aren't exported (e.g., `ChatCompletionMessageFunctionToolCall`)
- All validators use arktype, not Zod
- Naming convention: `OpenAI` + SDK type name
- All validators must satisfy their corresponding type with `satisfies Type<...>`
