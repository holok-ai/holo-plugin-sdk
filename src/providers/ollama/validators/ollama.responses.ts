import {type, type Type} from 'arktype';
import {
    OllamaChatResponse,
    OllamaEmbeddingsResponse,
    OllamaEmbedResponse,
    OllamaErrorResponse,
    OllamaGenerateResponse,
    OllamaListResponse,
    OllamaMessageValidator,
    OllamaModelDetails,
    OllamaModelResponse,
    OllamaOnlyResponse,
    OllamaProgressResponse,
    OllamaResponse,
    OllamaShowResponse,
    OllamaStatusResponse
} from "../types";


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
    .or(OllamaStatusResponseValidator) satisfies Type<OllamaResponse>;
