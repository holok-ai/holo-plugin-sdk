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
    OpenAIChatCompletion,
    OpenAIChatCompletionAudio,
    OpenAIChatCompletionAudioParam,
    OpenAIChatCompletionChoice,
    OpenAIChatCompletionChoiceLogprobs,
    OpenAIChatCompletionChunk,
    OpenAIChatCompletionChunkChoice,
    OpenAIChatCompletionChunkChoiceDelta,
    OpenAIChatCompletionChunkChoiceDeltaFunctionCall,
    OpenAIChatCompletionChunkChoiceDeltaToolCall,
    OpenAIChatCompletionChunkChoiceDeltaToolCallFunction,
    OpenAIChatCompletionChunkChoiceLogprobs,
    OpenAIChatCompletionContentPart,
    OpenAIChatCompletionContentPartFile,
    OpenAIChatCompletionContentPartFileFile,
    OpenAIChatCompletionContentPartImage,
    OpenAIChatCompletionContentPartImageImageURL,
    OpenAIChatCompletionContentPartInputAudio,
    OpenAIChatCompletionContentPartInputAudioInputAudio,
    OpenAIChatCompletionContentPartRefusal,
    OpenAIChatCompletionContentPartText,
    OpenAIChatCompletionMessage,
    OpenAIChatCompletionMessageAnnotation,
    OpenAIChatCompletionMessageAnnotationURLCitation,
    OpenAIChatCompletionMessageFunctionCall,
    OpenAIChatCompletionMessageToolCall,
    OpenAIChatCompletionMessageToolCallFunction,
    OpenAIChatCompletionPredictionContent,
    OpenAIChatCompletionStreamOptions,
    OpenAIChatCompletionTokenLogprob,
    OpenAIChatCompletionTokenLogprobTopLogprob,
    OpenAIChatRequest,
    OpenAICompletionUsage,
    OpenAICompletionUsageCompletionTokensDetails,
    OpenAICompletionUsagePromptTokensDetails,
    OpenAIFunctionDefinition,
    OpenAIFunctionParameters,
    OpenAIMetadata,
    OpenAIOnlyChatRequest,
    OpenAIOnlyResponse,
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

// Response validators

export const OpenAICompletionUsageCompletionTokensDetailsValidator = type({
    'accepted_prediction_tokens?': 'number',
    'audio_tokens?': 'number',
    'reasoning_tokens?': 'number',
    'rejected_prediction_tokens?': 'number'
}) satisfies Type<OpenAICompletionUsageCompletionTokensDetails>;

export const OpenAICompletionUsagePromptTokensDetailsValidator = type({
    'audio_tokens?': 'number',
    'cached_tokens?': 'number'
}) satisfies Type<OpenAICompletionUsagePromptTokensDetails>;

export const OpenAICompletionUsageValidator = type({
    completion_tokens: 'number',
    prompt_tokens: 'number',
    total_tokens: 'number',
    'completion_tokens_details?': OpenAICompletionUsageCompletionTokensDetailsValidator,
    'prompt_tokens_details?': OpenAICompletionUsagePromptTokensDetailsValidator
}) satisfies Type<OpenAICompletionUsage>;

export const OpenAIChatCompletionAudioValidator = type({
    id: 'string',
    data: 'string',
    expires_at: 'number',
    transcript: 'string'
}) satisfies Type<OpenAIChatCompletionAudio>;

export const OpenAIChatCompletionMessageAnnotationURLCitationValidator = type({
    end_index: 'number',
    start_index: 'number',
    title: 'string',
    url: 'string'
}) satisfies Type<OpenAIChatCompletionMessageAnnotationURLCitation>;

export const OpenAIChatCompletionMessageAnnotationValidator = type({
    type: "'url_citation'",
    url_citation: OpenAIChatCompletionMessageAnnotationURLCitationValidator
}) satisfies Type<OpenAIChatCompletionMessageAnnotation>;

export const OpenAIChatCompletionMessageFunctionCallValidator = type({
    arguments: 'string',
    name: 'string'
}) satisfies Type<OpenAIChatCompletionMessageFunctionCall>;

export const OpenAIChatCompletionMessageToolCallFunctionValidator = type({
    arguments: 'string',
    name: 'string'
}) satisfies Type<OpenAIChatCompletionMessageToolCallFunction>;

export const OpenAIChatCompletionMessageToolCallValidator = type({
    id: 'string',
    function: OpenAIChatCompletionMessageToolCallFunctionValidator,
    type: "'function'"
}) satisfies Type<OpenAIChatCompletionMessageToolCall>;

export const OpenAIChatCompletionMessageValidator = type({
    content: stringOrNull,
    refusal: stringOrNull,
    role: "'assistant'",
    'annotations?': OpenAIChatCompletionMessageAnnotationValidator.array(),
    'audio?': OpenAIChatCompletionAudioValidator.or('null'),
    'function_call?': OpenAIChatCompletionMessageFunctionCallValidator.or('null'),
    'tool_calls?': OpenAIChatCompletionMessageToolCallValidator.array()
}) satisfies Type<OpenAIChatCompletionMessage>;

export const OpenAIChatCompletionTokenLogprobTopLogprobValidator = type({
    token: 'string',
    bytes: type('number[]').or('null'),
    logprob: 'number'
}) satisfies Type<OpenAIChatCompletionTokenLogprobTopLogprob>;

export const OpenAIChatCompletionTokenLogprobValidator = type({
    token: 'string',
    bytes: type('number[]').or('null'),
    logprob: 'number',
    top_logprobs: OpenAIChatCompletionTokenLogprobTopLogprobValidator.array()
}) satisfies Type<OpenAIChatCompletionTokenLogprob>;

export const OpenAIChatCompletionChoiceLogprobsValidator = type({
    content: OpenAIChatCompletionTokenLogprobValidator.array().or('null'),
    refusal: OpenAIChatCompletionTokenLogprobValidator.array().or('null')
}) satisfies Type<OpenAIChatCompletionChoiceLogprobs>;

export const OpenAIChatCompletionChoiceValidator = type({
    finish_reason: "'stop'|'length'|'tool_calls'|'content_filter'|'function_call'",
    index: 'number',
    logprobs: OpenAIChatCompletionChoiceLogprobsValidator.or('null'),
    message: OpenAIChatCompletionMessageValidator
}) satisfies Type<OpenAIChatCompletionChoice>;

export const OpenAIChatCompletionValidator = type({
    id: 'string',
    choices: OpenAIChatCompletionChoiceValidator.array(),
    created: 'number',
    model: 'string',
    object: "'chat.completion'",
    'service_tier?': "'auto'|'default'|'flex'|'scale'|'priority'|null",
    'system_fingerprint?': 'string',
    'usage?': OpenAICompletionUsageValidator
}) satisfies Type<OpenAIChatCompletion>;

export const OpenAIChatCompletionChunkChoiceDeltaFunctionCallValidator = type({
    'arguments?': 'string',
    'name?': 'string'
}) satisfies Type<OpenAIChatCompletionChunkChoiceDeltaFunctionCall>;

export const OpenAIChatCompletionChunkChoiceDeltaToolCallFunctionValidator = type({
    'arguments?': 'string',
    'name?': 'string'
}) satisfies Type<OpenAIChatCompletionChunkChoiceDeltaToolCallFunction>;

export const OpenAIChatCompletionChunkChoiceDeltaToolCallValidator = type({
    index: 'number',
    'id?': 'string',
    'function?': OpenAIChatCompletionChunkChoiceDeltaToolCallFunctionValidator,
    'type?': "'function'"
}) satisfies Type<OpenAIChatCompletionChunkChoiceDeltaToolCall>;

export const OpenAIChatCompletionChunkChoiceDeltaValidator = type({
    'content?': stringOrNull,
    'function_call?': OpenAIChatCompletionChunkChoiceDeltaFunctionCallValidator,
    'refusal?': stringOrNull,
    'role?': "'developer'|'system'|'user'|'assistant'|'tool'",
    'tool_calls?': OpenAIChatCompletionChunkChoiceDeltaToolCallValidator.array()
}) satisfies Type<OpenAIChatCompletionChunkChoiceDelta>;

export const OpenAIChatCompletionChunkChoiceLogprobsValidator = type({
    content: OpenAIChatCompletionTokenLogprobValidator.array().or('null'),
    refusal: OpenAIChatCompletionTokenLogprobValidator.array().or('null')
}) satisfies Type<OpenAIChatCompletionChunkChoiceLogprobs>;

export const OpenAIChatCompletionChunkChoiceValidator = type({
    delta: OpenAIChatCompletionChunkChoiceDeltaValidator,
    finish_reason: "'stop'|'length'|'tool_calls'|'content_filter'|'function_call'|null",
    index: 'number',
    'logprobs?': OpenAIChatCompletionChunkChoiceLogprobsValidator.or('null')
}) satisfies Type<OpenAIChatCompletionChunkChoice>;

export const OpenAIChatCompletionChunkValidator = type({
    id: 'string',
    choices: OpenAIChatCompletionChunkChoiceValidator.array(),
    created: 'number',
    model: 'string',
    object: "'chat.completion.chunk'",
    'service_tier?': "'auto'|'default'|'flex'|'scale'|'priority'|null",
    'system_fingerprint?': 'string',
    'usage?': OpenAICompletionUsageValidator.or('null')
}) satisfies Type<OpenAIChatCompletionChunk>;

export const OpenAIOnlyResponseValidator = type({
    'system_fingerprint?': 'string | null',
    'logprobs?': 'unknown',
    'refusal?': 'string | null',
    'function_call?': type({
        'name?': 'string',
        'arguments?': 'string',
    }),
    'audio?': 'unknown',
    'annotations?': 'unknown[]',
}) satisfies Type<OpenAIOnlyResponse>;

export const OpenAIChatCompletionResponseValidator = OpenAIChatCompletionValidator.or(OpenAIChatCompletionChunkValidator);
