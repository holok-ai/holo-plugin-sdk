import {type, type Type} from 'arktype';
import type {
    ChatResponse,
    EmbeddingsResponse,
    EmbedResponse,
    ErrorResponse,
    GenerateResponse,
    ListResponse,
    Message,
    ModelDetails,
    ModelResponse,
    ProgressResponse,
    ShowResponse,
    StatusResponse,
    ToolCall
} from 'ollama';

// Ollama response type aliases (map to Ollama SDK types)
export type OllamaToolCall = ToolCall;
export type OllamaMessage = Message;
export type OllamaGenerateResponse = GenerateResponse;
export type OllamaChatResponse = ChatResponse;
export type OllamaEmbedResponse = EmbedResponse;
export type OllamaEmbeddingsResponse = EmbeddingsResponse;
export type OllamaProgressResponse = ProgressResponse;
export type OllamaModelDetails = ModelDetails;
export type OllamaModelResponse = ModelResponse;
export type OllamaShowResponse = ShowResponse;
export type OllamaListResponse = ListResponse;
export type OllamaErrorResponse = ErrorResponse;
export type OllamaStatusResponse = StatusResponse;

export const OllamaToolCallValidator = type({
    function: type({
        name: 'string',
        arguments: 'Record<string, unknown>'
    })
}) satisfies Type<OllamaToolCall>;

export const OllamaMessageValidator = type({
    role: 'string',
    content: 'string',
    'images?': type('string[]'),
    'tool_calls?': OllamaToolCallValidator.array()
}) satisfies Type<OllamaMessage>;

export const OllamaGenerateResponseValidator = type({
    model: 'string',
    created_at: 'Date',
    response: 'string',
    done: 'boolean',
    done_reason: 'string',
    context: 'number[]',
    total_duration: 'number',
    load_duration: 'number',
    prompt_eval_count: 'number',
    prompt_eval_duration: 'number',
    eval_count: 'number',
    eval_duration: 'number'
}) satisfies Type<OllamaGenerateResponse>;

export const OllamaChatResponseValidator = type({
    model: 'string',
    created_at: 'Date',
    message: OllamaMessageValidator,
    done: 'boolean',
    done_reason: 'string',
    total_duration: 'number',
    load_duration: 'number',
    prompt_eval_count: 'number',
    prompt_eval_duration: 'number',
    eval_count: 'number',
    eval_duration: 'number'
}) satisfies Type<OllamaChatResponse>;

export const OllamaEmbedResponseValidator = type({
    model: 'string',
    embeddings: 'number[][]',
    total_duration: 'number',
    load_duration: 'number',
    prompt_eval_count: 'number'
}) satisfies Type<OllamaEmbedResponse>;

export const OllamaEmbeddingsResponseValidator = type({
    embedding: 'number[]'
}) satisfies Type<OllamaEmbeddingsResponse>;

export const OllamaProgressResponseValidator = type({
    status: 'string',
    digest: 'string',
    total: 'number',
    completed: 'number'
}) satisfies Type<OllamaProgressResponse>;

export const OllamaModelDetailsValidator = type({
    parent_model: 'string',
    format: 'string',
    family: 'string',
    families: 'string[]',
    parameter_size: 'string',
    quantization_level: 'string'
}) satisfies Type<OllamaModelDetails>;

export const OllamaModelResponseValidator = type({
    name: 'string',
    modified_at: 'Date',
    model: 'string',
    size: 'number',
    digest: 'string',
    details: OllamaModelDetailsValidator,
    expires_at: 'Date',
    size_vram: 'number'
}) satisfies Type<OllamaModelResponse>;

export const OllamaShowResponseValidator = type({
    license: 'string',
    modelfile: 'string',
    parameters: 'string',
    template: 'string',
    system: 'string',
    details: OllamaModelDetailsValidator,
    messages: OllamaMessageValidator.array(),
    modified_at: 'Date',
    model_info: type('instanceof', Map<string, any>),
    'projector_info?': type('instanceof', Map<string, any>)
}) satisfies Type<OllamaShowResponse>;

export const OllamaListResponseValidator = type({
    models: OllamaModelResponseValidator.array()
}) satisfies Type<OllamaListResponse>;

export const OllamaErrorResponseValidator = type({
    error: 'string'
}) satisfies Type<OllamaErrorResponse>;

export const OllamaStatusResponseValidator = type({
    status: 'string',
    'digest?': 'string',
    'total?': 'number',
    'completed?': 'number'
}) satisfies Type<OllamaStatusResponse>;

export type OllamaResponse = GenerateResponse | ChatResponse | EmbedResponse | EmbeddingsResponse | ProgressResponse | ModelResponse | ShowResponse | ListResponse | ErrorResponse | StatusResponse;

export type OllamaOnlyResponseFields = readonly[
    'done',
    'done_reason',
    'response',
    'context',
    'total_duration',
    'load_duration',
    'prompt_eval_count',
    'prompt_eval_duration',
    'eval_count',
    'eval_duration'
];
export type OllamaOnlyResponse = {
    done?: boolean;
    done_reason?: string;
    response?: string;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
};

export const OllamaOnlyResponseValidator = type({
    'done?': 'boolean',
    'done_reason?': 'string',
    'response?': 'string',
    'context?': 'number[]',
    'total_duration?': 'number',
    'load_duration?': 'number',
    'prompt_eval_count?': 'number',
    'prompt_eval_duration?': 'number',
    'eval_count?': 'number',
    'eval_duration?': 'number',
}) satisfies Type<OllamaOnlyResponse>;

export const OllamaResponseValidator = OllamaGenerateResponseValidator
    .or(OllamaChatResponseValidator)
    .or(OllamaEmbedResponseValidator)
    .or(OllamaEmbeddingsResponseValidator)
    .or(OllamaProgressResponseValidator)
    .or(OllamaModelResponseValidator)
    .or(OllamaShowResponseValidator)
    .or(OllamaListResponseValidator)
    .or(OllamaErrorResponseValidator)
    .or(OllamaStatusResponseValidator);
