// OpenAI response type aliases (map to OpenAI SDK types)
import type {
    ChatCompletion,
    ChatCompletionAudio,
    ChatCompletionChunk,
    ChatCompletionMessage,
    ChatCompletionMessageCustomToolCall,
    ChatCompletionMessageFunctionToolCall,
    ChatCompletionMessageToolCall
} from "openai/resources/chat/completions";
import type {CompletionUsage} from "openai/resources/completions";
import {ChatCompletionTokenLogprob} from "openai/resources/chat/completions/completions";

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
export type OpenAIResponse = ChatCompletion | ChatCompletionChunk;
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
