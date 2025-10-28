import {Type, type} from "arktype";
import {ClaudeModelInfo, Model, OllamaModelDetails, OllamaModelResponse, OpenAIModel} from "../types";

// OpenAI Model Validator
// Matches OpenAI SDK Model type from openai/resources/models.d.ts
export const OpenAIModelValidator = type({
    id: 'string',
    created: 'number',
    object: "'model'",
    owned_by: 'string'
}) satisfies Type<OpenAIModel>;

// Claude Model Validator
// Matches Anthropic SDK ModelInfo type from @anthropic-ai/sdk/resources/models.d.ts
export const ClaudeModelInfoValidator = type({
    id: 'string',
    created_at: 'string',
    display_name: 'string',
    type: "'model'"
}) satisfies Type<ClaudeModelInfo>;

// Ollama Model Details Validator
// Matches Ollama SDK ModelDetails type
export const OllamaModelDetailsValidator = type({
    parent_model: 'string',
    format: 'string',
    family: 'string',
    families: 'string[]',
    parameter_size: 'string',
    quantization_level: 'string'
}) satisfies Type<OllamaModelDetails>;

// Ollama Model Response Validator
// Matches Ollama SDK ModelResponse type from ollama/dist/shared/ollama.27169772.d.ts
// Note: Cache stores ISO 8601 strings, not Date objects (for REST API parity)
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

// Cache Model Validator (with optional metadata)
export const ModelValidator = type({
    name: 'string',
    accessModel: 'string',
    providerName: 'string',
    'metadata?': {
        'openai?': OpenAIModelValidator,
        'claude?': ClaudeModelInfoValidator,
        'ollama?': OllamaModelResponseValidator
    }
}) satisfies Type<Model>;
