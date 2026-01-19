// OpenAI ChatCompletions API type aliases (map to OpenAI SDK types)
import type {
    ChatCompletion,
    ChatCompletionAssistantMessageParam,
    ChatCompletionAudio,
    ChatCompletionAudioParam,
    ChatCompletionChunk,
    ChatCompletionContentPart,
    ChatCompletionContentPartImage,
    ChatCompletionContentPartInputAudio,
    ChatCompletionContentPartRefusal,
    ChatCompletionContentPartText,
    ChatCompletionCreateParamsBase,
    ChatCompletionCustomTool,
    ChatCompletionFunctionTool,
    ChatCompletionMessage,
    ChatCompletionMessageCustomToolCall,
    ChatCompletionMessageFunctionToolCall,
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
    ChatCompletionPredictionContent,
    ChatCompletionStreamOptions,
    ChatCompletionTokenLogprob,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption
} from "openai/resources/chat/completions";
import type {CompletionUsage} from "openai/resources/completions";
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

// Response types
export type OpenAICompletionUsage = CompletionUsage;
export type OpenAICompletionUsageCompletionTokensDetails = CompletionUsage.CompletionTokensDetails;
export type OpenAICompletionUsagePromptTokensDetails = CompletionUsage.PromptTokensDetails;
export type OpenAIChatCompletionAudio = ChatCompletionAudio;
export type OpenAIChatCompletionMessageAnnotationURLCitation = ChatCompletionMessage.Annotation.URLCitation;
export type OpenAIChatCompletionMessageAnnotation = ChatCompletionMessage.Annotation;
export type OpenAIChatCompletionMessageFunctionCall = ChatCompletionMessage.FunctionCall;
export type OpenAIChatCompletionMessageFunctionToolCall = ChatCompletionMessageFunctionToolCall;
export type OpenAIChatCompletionMessageCustomToolCall = ChatCompletionMessageCustomToolCall;
export type OpenAIChatCompletionMessageToolCallFunction = ChatCompletionMessageFunctionToolCall.Function;
export type OpenAIChatCompletionMessageToolCallCustom = ChatCompletionMessageCustomToolCall.Custom;
export type OpenAIChatCompletionMessageToolCall = ChatCompletionMessageToolCall;
export type OpenAIChatCompletionMessage = ChatCompletionMessage;
export type OpenAIChatCompletionTokenLogprobTopLogprob = ChatCompletionTokenLogprob.TopLogprob;
export type OpenAIChatCompletionTokenLogprob = ChatCompletionTokenLogprob;
export type OpenAIChatCompletionChoiceLogprobs = ChatCompletion.Choice.Logprobs;
export type OpenAIChatCompletionChoice = ChatCompletion.Choice;
export type OpenAIChatCompletion = ChatCompletion;
export type OpenAIChatCompletionChunkChoiceDeltaFunctionCall = ChatCompletionChunk.Choice.Delta.FunctionCall;
export type OpenAIChatCompletionChunkChoiceDeltaToolCallFunction = ChatCompletionChunk.Choice.Delta.ToolCall.Function;
export type OpenAIChatCompletionChunkChoiceDeltaToolCall = ChatCompletionChunk.Choice.Delta.ToolCall;
export type OpenAIChatCompletionChunkChoiceDelta = ChatCompletionChunk.Choice.Delta;
export type OpenAIChatCompletionChunkChoiceLogprobs = ChatCompletionChunk.Choice.Logprobs;
export type OpenAIChatCompletionChunkChoice = ChatCompletionChunk.Choice;
export type OpenAIChatCompletionChunk = ChatCompletionChunk;
export type OpenAIChatCompletionResponse = ChatCompletion | ChatCompletionChunk;
export type OpenAIOnlyResponseFields = readonly[
    'system_fingerprint',
    'logprobs',
    'refusal',
    'function_call',
    'audio',
    'annotations'
];
export type OpenAIOnlyResponse = {
    system_fingerprint?: string | null;
    logprobs?: unknown;
    refusal?: string | null;
    function_call?: {
        name?: string;
        arguments?: string;
    };
    audio?: unknown;
    annotations?: unknown[];
};
