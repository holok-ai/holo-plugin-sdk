import {type, type Type} from 'arktype';
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionCreateParams,
    ChatCompletionDeveloperMessageParam,
    ChatCompletionMessageCustomToolCall,
    ChatCompletionMessageFunctionToolCall,
    ChatCompletionMessageToolCall,
    ChatCompletionNamedToolChoice,
    ChatCompletionSystemMessageParam,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam
} from 'openai/resources/chat/completions';
import {booleanOrNull, numberOrNull, stringOrNull} from "../../types";
import {
    OpenAIAssistantMessageAudio,
    OpenAIChatCompletionAudioParam,
    OpenAIChatCompletionContentPart,
    OpenAIChatCompletionContentPartFile,
    OpenAIChatCompletionContentPartFileFile,
    OpenAIChatCompletionContentPartImage,
    OpenAIChatCompletionContentPartImageImageURL,
    OpenAIChatCompletionContentPartInputAudio,
    OpenAIChatCompletionContentPartInputAudioInputAudio,
    OpenAIChatCompletionContentPartRefusal,
    OpenAIChatCompletionContentPartText,
    OpenAIChatCompletionPredictionContent,
    OpenAIChatCompletionStreamOptions,
    OpenAIChatRequest,
    OpenAIFunctionDefinition,
    OpenAIFunctionParameters,
    OpenAIMetadata,
    OpenAIOnlyChatRequest,
    OpenAIReasoningEffort,
    OpenAIRequestMessage,
    OpenAIResponseFormat,
    OpenAIResponseFormatJSONObject,
    OpenAIResponseFormatJSONSchema,
    OpenAIResponseFormatJSONSchemaJSONSchema,
    OpenAIResponseFormatText,
    OpenAISharedChatRequest
} from "../types";


export const OpenAIMetadataValidator = type('Record<string, string>') satisfies Type<OpenAIMetadata>;

export const OpenAIReasoningEffortValidator = type("'low'|'medium'|'high'|null") satisfies Type<OpenAIReasoningEffort>;

export const OpenAIFunctionParametersValidator = type('Record<string, unknown>') satisfies Type<OpenAIFunctionParameters>;

export const OpenAIFunctionDefinitionValidator = type({
    name: 'string',
    'description?': 'string',
    'parameters?': OpenAIFunctionParametersValidator,
    'strict?': booleanOrNull
}) satisfies Type<OpenAIFunctionDefinition>;

export const OpenAIResponseFormatTextValidator = type({
    type: "'text'"
}) satisfies Type<OpenAIResponseFormatText>;

export const OpenAIResponseFormatJSONObjectValidator = type({
    type: "'json_object'"
}) satisfies Type<OpenAIResponseFormatJSONObject>;

export const OpenAIResponseFormatJSONSchemaJSONSchemaValidator = type({
    name: 'string',
    'description?': 'string',
    'schema?': 'Record<string, unknown>',
    'strict?': booleanOrNull
}) satisfies Type<OpenAIResponseFormatJSONSchemaJSONSchema>;

export const OpenAIResponseFormatJSONSchemaValidator = type({
    json_schema: OpenAIResponseFormatJSONSchemaJSONSchemaValidator,
    type: "'json_schema'"
}) satisfies Type<OpenAIResponseFormatJSONSchema>;

export const OpenAIChatCompletionContentPartTextValidator = type({
    text: 'string',
    type: "'text'"
}) satisfies Type<OpenAIChatCompletionContentPartText>;

export const OpenAIChatCompletionContentPartRefusalValidator = type({
    refusal: 'string',
    type: "'refusal'"
}) satisfies Type<OpenAIChatCompletionContentPartRefusal>;

export const OpenAIChatCompletionContentPartImageImageURLValidator = type({
    url: 'string',
    'detail?': "'auto'|'low'|'high'"
}) satisfies Type<OpenAIChatCompletionContentPartImageImageURL>;

export const OpenAIChatCompletionContentPartImageValidator = type({
    image_url: OpenAIChatCompletionContentPartImageImageURLValidator,
    type: "'image_url'"
}) satisfies Type<OpenAIChatCompletionContentPartImage>;

export const OpenAIChatCompletionContentPartInputAudioInputAudioValidator = type({
    data: 'string',
    format: "'wav'|'mp3'"
}) satisfies Type<OpenAIChatCompletionContentPartInputAudioInputAudio>;

export const OpenAIChatCompletionContentPartInputAudioValidator = type({
    input_audio: OpenAIChatCompletionContentPartInputAudioInputAudioValidator,
    type: "'input_audio'"
}) satisfies Type<OpenAIChatCompletionContentPartInputAudio>;

export const OpenAIChatCompletionContentPartFileFileValidator = type({
    'file_data?': 'string',
    'file_id?': 'string',
    'filename?': 'string'
}) satisfies Type<OpenAIChatCompletionContentPartFileFile>;

export const OpenAIChatCompletionContentPartFileValidator = type({
    file: OpenAIChatCompletionContentPartFileFileValidator,
    type: "'file'"
}) satisfies Type<OpenAIChatCompletionContentPartFile>;

export const OpenAIChatCompletionContentPartValidator = OpenAIChatCompletionContentPartTextValidator
    .or(OpenAIChatCompletionContentPartImageValidator)
    .or(OpenAIChatCompletionContentPartInputAudioValidator)
    .or(OpenAIChatCompletionContentPartFileValidator) satisfies Type<OpenAIChatCompletionContentPart>;

export const OpenAIChatCompletionAudioParamValidator = type({
    format: "'wav'|'aac'|'mp3'|'flac'|'opus'|'pcm16'",
    voice: type('string').or("'alloy'|'ash'|'ballad'|'coral'|'echo'|'sage'|'shimmer'|'verse'")
}) satisfies Type<OpenAIChatCompletionAudioParam>;


const OpenAIAssistantMessageAudioValidator = type({
    id: 'string'
}) satisfies Type<OpenAIAssistantMessageAudio>;

const ChatCompletionMessageToolCallFunctionValidator = type({
    arguments: 'string',
    name: 'string'
}) satisfies Type<ChatCompletionMessageFunctionToolCall.Function>;

const ChatCompletionMessageFunctionToolCallValidator = type({
    id: 'string',
    function: ChatCompletionMessageToolCallFunctionValidator,
    type: "'function'"
}) satisfies Type<ChatCompletionMessageFunctionToolCall>;

const ChatCompletionMessageCustomToolCallCustomValidator = type({
    input: 'string',
    name: 'string'
}) satisfies Type<ChatCompletionMessageCustomToolCall.Custom>;

const ChatCompletionMessageCustomToolCallValidator = type({
    id: 'string',
    custom: ChatCompletionMessageCustomToolCallCustomValidator,
    type: "'custom'"
}) satisfies Type<ChatCompletionMessageCustomToolCall>;

const ChatCompletionMessageToolCallValidator = ChatCompletionMessageFunctionToolCallValidator
    .or(ChatCompletionMessageCustomToolCallValidator) satisfies Type<ChatCompletionMessageToolCall>;

const ChatCompletionDeveloperMessageParamValidator = type({
    content: type('string').or(OpenAIChatCompletionContentPartTextValidator.array()),
    role: "'developer'",
    'name?': 'string'
}) satisfies Type<ChatCompletionDeveloperMessageParam>;

const ChatCompletionSystemMessageParamValidator = type({
    content: type('string').or(OpenAIChatCompletionContentPartTextValidator.array()),
    role: "'system'",
    'name?': 'string'
}) satisfies Type<ChatCompletionSystemMessageParam>;

const ChatCompletionUserMessageParamValidator = type({
    content: type('string').or(OpenAIChatCompletionContentPartValidator.array()),
    role: "'user'",
    'name?': 'string'
}) satisfies Type<ChatCompletionUserMessageParam>;

const ChatCompletionAssistantMessageParamValidator = type({
    role: "'assistant'",
    'audio?': OpenAIAssistantMessageAudioValidator.or('null'),
    'content?': type('string').or(OpenAIChatCompletionContentPartTextValidator.array()).or(OpenAIChatCompletionContentPartRefusalValidator.array()).or('null'),
    'name?': 'string',
    'refusal?': stringOrNull,
    'tool_calls?': ChatCompletionMessageToolCallValidator.array()
}) satisfies Type<ChatCompletionAssistantMessageParam>;

const ChatCompletionToolMessageParamValidator = type({
    content: type('string').or(OpenAIChatCompletionContentPartTextValidator.array()),
    role: "'tool'",
    tool_call_id: 'string'
}) satisfies Type<ChatCompletionToolMessageParam>;


export const OpenAIRequestMessageValidator = ChatCompletionDeveloperMessageParamValidator
    .or(ChatCompletionSystemMessageParamValidator)
    .or(ChatCompletionUserMessageParamValidator)
    .or(ChatCompletionAssistantMessageParamValidator)
    .or(ChatCompletionToolMessageParamValidator) satisfies Type<OpenAIRequestMessage>;

export const ChatCompletionToolValidator = type({
    function: OpenAIFunctionDefinitionValidator,
    type: "'function'"
}) satisfies Type<ChatCompletionTool>;

export const ChatCompletionNamedToolChoiceFunctionValidator = type({
    name: 'string'
}) satisfies Type<ChatCompletionNamedToolChoice.Function>;

export const ChatCompletionNamedToolChoiceValidator = type({
    function: ChatCompletionNamedToolChoiceFunctionValidator,
    type: "'function'"
}) satisfies Type<ChatCompletionNamedToolChoice>;

export const ChatCompletionToolChoiceOptionValidator = type("'none'|'auto'|'required'").or(ChatCompletionNamedToolChoiceValidator) satisfies Type<ChatCompletionToolChoiceOption>;

export const OpenAIChatCompletionPredictionContentValidator = type({
    content: type('string').or(OpenAIChatCompletionContentPartTextValidator.array()),
    type: "'content'"
}) satisfies Type<OpenAIChatCompletionPredictionContent>;

export const OpenAIChatCompletionStreamOptionsValidator = type({
    'include_usage?': 'boolean'
}) satisfies Type<OpenAIChatCompletionStreamOptions>;

export const OpenAIWebSearchOptionsValidator = type({
    'search_context_size?': "'low'|'medium'|'high'",
    'user_location?': type({
        approximate: type({
            'city?': 'string',
            'country?': 'string',
            'region?': 'string',
            'timezone?': 'string'
        }),
        type: "'approximate'"
    }).or('null')
}) satisfies Type<ChatCompletionCreateParams.WebSearchOptions>;

export const OpenAIResponseFormatValidator =
    OpenAIResponseFormatTextValidator
        .or(OpenAIResponseFormatJSONSchemaValidator)
        .or(OpenAIResponseFormatJSONObjectValidator) satisfies Type<OpenAIResponseFormat
    >;

// Common fields that exist across all providers
export const OpenAISharedRequestValidator = type({
    messages: OpenAIRequestMessageValidator.array(),
    model: 'string',
    'temperature?': numberOrNull,
    'top_p?': numberOrNull,
    'stream?': booleanOrNull,
    'tools?': ChatCompletionToolValidator.array(),
    'tool_choice?': ChatCompletionToolChoiceOptionValidator,
    'metadata?': OpenAIMetadataValidator.or('null'),
    'response_format?': OpenAIResponseFormatValidator,
    'service_tier?': "'auto'|'default'|'flex'|'scale'|'priority'|null",
    'max_completion_tokens?': numberOrNull,
    'max_tokens?': numberOrNull,
    'frequency_penalty?': numberOrNull,
    'presence_penalty?': numberOrNull,
    'seed?': numberOrNull,
    'stop?': type('string').or('null').or('string[]'),
}) satisfies Type<OpenAISharedChatRequest>;

// Fields unique to OpenAI
export const OpenAIOnlyRequestValidator = type({
    'audio?': OpenAIChatCompletionAudioParamValidator.or('null'),
    'logit_bias?': type('Record<string, number>').or('null'),
    'logprobs?': booleanOrNull,
    'modalities?': type("'text'|'audio'").array().or('null'),
    'n?': numberOrNull,
    'parallel_tool_calls?': 'boolean',
    'prediction?': OpenAIChatCompletionPredictionContentValidator.or('null'),
    'prompt_cache_key?': 'string',
    'reasoning_effort?': OpenAIReasoningEffortValidator,
    'safety_identifier?': 'string',
    'store?': booleanOrNull,
    'stream_options?': OpenAIChatCompletionStreamOptionsValidator.or('null'),
    'top_logprobs?': numberOrNull,
    'user?': 'string',
    'web_search_options?': OpenAIWebSearchOptionsValidator
}) satisfies Type<OpenAIOnlyChatRequest>;


// Complete OpenAI request validator combining shared and OpenAI-only fields
export const OpenAIChatRequestValidator = type.merge(
    OpenAISharedRequestValidator,
    OpenAIOnlyRequestValidator
) satisfies Type<OpenAIChatRequest>;
