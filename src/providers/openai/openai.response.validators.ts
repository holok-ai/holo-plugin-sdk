import {type, type Type} from 'arktype';
import type {
    ChatCompletion,
    ChatCompletionAudio,
    ChatCompletionChunk,
    ChatCompletionMessage,
    ChatCompletionMessageToolCall
} from 'openai/resources/chat/completions';
import type {CompletionUsage} from 'openai/resources/completions';
import {ChatCompletionTokenLogprob} from "openai/src/resources/chat/completions/completions";
import {stringOrNull} from "../types/validator.types";

// OpenAI response type aliases (map to OpenAI SDK types)
export type OpenAICompletionUsage = CompletionUsage;
export type OpenAICompletionUsageCompletionTokensDetails = CompletionUsage.CompletionTokensDetails;
export type OpenAICompletionUsagePromptTokensDetails = CompletionUsage.PromptTokensDetails;
export type OpenAIChatCompletionAudio = ChatCompletionAudio;
export type OpenAIChatCompletionMessageAnnotationURLCitation = ChatCompletionMessage.Annotation.URLCitation;
export type OpenAIChatCompletionMessageAnnotation = ChatCompletionMessage.Annotation;
export type OpenAIChatCompletionMessageFunctionCall = ChatCompletionMessage.FunctionCall;
export type OpenAIChatCompletionMessageToolCallFunction = ChatCompletionMessageToolCall.Function;
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

export const OpenAIResponseValidator = OpenAIChatCompletionValidator.or(OpenAIChatCompletionChunkValidator);
