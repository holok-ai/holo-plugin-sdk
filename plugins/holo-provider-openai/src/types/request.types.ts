// OpenAI ChatCompletions API type aliases (map to OpenAI SDK types)
import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionAudioParam,
    ChatCompletionContentPart,
    ChatCompletionContentPartImage,
    ChatCompletionContentPartInputAudio,
    ChatCompletionContentPartRefusal,
    ChatCompletionContentPartText,
    ChatCompletionCreateParamsBase,
    ChatCompletionCustomTool,
    ChatCompletionFunctionTool,
    ChatCompletionMessageParam,
    ChatCompletionPredictionContent,
    ChatCompletionStreamOptions,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption
} from "openai/resources/chat/completions";
import type {
    FunctionDefinition,
    FunctionParameters,
    Metadata,
    ReasoningEffort,
    ResponseFormatJSONObject,
    ResponseFormatJSONSchema,
    ResponseFormatText
} from "openai/resources/shared";

export type OpenAIFunctionParameters = FunctionParameters;
export type OpenAIFunctionDefinition = FunctionDefinition;
export type OpenAIMetadata = Metadata;
export type OpenAIReasoningEffort = ReasoningEffort;
export type OpenAIResponseFormatText = ResponseFormatText;
export type OpenAIResponseFormatJSONObject = ResponseFormatJSONObject;
export type OpenAIResponseFormatJSONSchema = ResponseFormatJSONSchema;
export type OpenAIResponseFormat = ResponseFormatJSONObject | ResponseFormatText | ResponseFormatJSONSchema;
export type OpenAIResponseFormatJSONSchemaJSONSchema = ResponseFormatJSONSchema.JSONSchema;
export type OpenAIChatCompletionContentPartText = ChatCompletionContentPartText;
export type OpenAIChatCompletionContentPartRefusal = ChatCompletionContentPartRefusal;
export type OpenAIChatCompletionContentPartImage = ChatCompletionContentPartImage;
export type OpenAIChatCompletionContentPartImageImageURL = ChatCompletionContentPartImage.ImageURL;
export type OpenAIChatCompletionContentPartInputAudio = ChatCompletionContentPartInputAudio;
export type OpenAIChatCompletionContentPartInputAudioInputAudio = ChatCompletionContentPartInputAudio.InputAudio;
export type OpenAIChatCompletionContentPart = ChatCompletionContentPart;
export type OpenAIChatCompletionContentPartFile = ChatCompletionContentPart.File;
export type OpenAIChatCompletionContentPartFileFile = ChatCompletionContentPart.File.File;
export type OpenAIChatCompletionAudioParam = ChatCompletionAudioParam;
export type OpenAIChatCompletionFunctionTool = ChatCompletionFunctionTool;
export type OpenAIChatCompletionCustomTool = ChatCompletionCustomTool;
export type OpenAIChatCompletionCustomToolCustom = ChatCompletionCustomTool.Custom;
export type OpenAIChatCompletionTool = ChatCompletionTool;
export type OpenAIChatCompletionToolChoiceOption = ChatCompletionToolChoiceOption;
export type OpenAIChatCompletionPredictionContent = ChatCompletionPredictionContent;
export type OpenAIChatCompletionStreamOptions = ChatCompletionStreamOptions;
export type OpenAIAssistantMessageAudio = ChatCompletionAssistantMessageParam.Audio;
export type OpenAIRequestMessage = ChatCompletionMessageParam;
export type OpenAIOnlyChatRequestFields = readonly[
    'audio',
    'logit_bias',
    'logprobs',
    'modalities',
    'n',
    'parallel_tool_calls',
    'prediction',
    'prompt_cache_key',
    'reasoning_effort',
    'safety_identifier',
    'store',
    'stream_options',
    'top_logprobs',
    'user',
    'web_search_options'
];
export type OpenAIChatRequest = ChatCompletionCreateParamsBase;
export type OpenAIOnlyChatRequest = Pick<OpenAIChatRequest, OpenAIOnlyChatRequestFields[number]>;
export type OpenAISharedChatRequest = Omit<OpenAIChatRequest, OpenAIOnlyChatRequestFields[number]>;
