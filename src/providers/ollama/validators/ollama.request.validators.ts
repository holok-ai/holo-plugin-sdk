import {type, type Type} from 'arktype';
import {GenerateRequest} from 'ollama';
import {
    OllamaChatRequest,
    OllamaGenerateRequest,
    OllamaMessage,
    OllamaOnlyChatRequest,
    OllamaOptions,
    OllamaSharedChatRequest,
    OllamaTool,
    OllamaToolCall
} from "../types";

export const OllamaImageValidator = type('instanceof', Uint8Array).array().or('string[]');

export const OllamaOptionsValidator = type({
    numa: 'boolean',
    num_ctx: 'number',
    num_batch: 'number',
    num_gpu: 'number',
    main_gpu: 'number',
    low_vram: 'boolean',
    f16_kv: 'boolean',
    logits_all: 'boolean',
    vocab_only: 'boolean',
    use_mmap: 'boolean',
    use_mlock: 'boolean',
    embedding_only: 'boolean',
    num_thread: 'number',
    num_keep: 'number',
    seed: 'number',
    num_predict: 'number',
    top_k: 'number',
    top_p: 'number',
    tfs_z: 'number',
    typical_p: 'number',
    repeat_last_n: 'number',
    temperature: 'number',
    repeat_penalty: 'number',
    presence_penalty: 'number',
    frequency_penalty: 'number',
    mirostat: 'number',
    mirostat_tau: 'number',
    mirostat_eta: 'number',
    penalize_newline: 'boolean',
    stop: 'string[]'
}) satisfies Type<OllamaOptions>;

export const OllamaToolCallValidator = type({
    function: {
        name: 'string',
        arguments: 'Record<string, unknown>'
    }
}) satisfies Type<OllamaToolCall>;

export const OllamaMessageValidator = type({
    role: 'string',
    content: 'string',
    'images?': OllamaImageValidator,
    'tool_calls?': OllamaToolCallValidator.array()
}) satisfies Type<OllamaMessage>;

export const OllamaToolValidator = type({
    type: 'string',
    function: {
        'name?': 'string',
        'description?': 'string',
        'type?': 'string',
        'parameters?': {
            'type?': 'string',
            '$defs?': 'unknown',
            'items?': 'unknown',
            'required?': 'string[]',
            'properties?': {
                '[string]': {
                    'type?': type('string').or('string[]'),
                    'items?': 'unknown',
                    'description?': 'string',
                    'enum?': 'unknown[]'
                }
            }
        }
    }
}) satisfies Type<OllamaTool>;

// Common fields that exist across all providers
export const OllamaSharedChatRequestValidator = type({
    model: 'string',
    'stream?': 'boolean',
    'messages?': OllamaMessageValidator.array(),
    'tools?': OllamaToolValidator.array(),
    'format?': 'string | object'
}) satisfies Type<OllamaSharedChatRequest>;

// Fields unique to Ollama
export const OllamaOnlyChatRequestValidator = type({
    'keep_alive?': 'string | number',
    'options?': OllamaOptionsValidator.partial(), // Ollama-specific configuration
}) satisfies Type<OllamaOnlyChatRequest>;

export const OllamaSharedGenerateRequestValidator = type({
    model: 'string',
    'stream?': 'boolean',
    'format?': 'string | object', // Maps to response_format
})

export const OllamaOnlyGenerateRequestValidator = type({
    'keep_alive?': 'string | number',
    'options?': OllamaOptionsValidator.partial(), // Ollama-specific configuration
    prompt: 'string', // Generate mode
    'suffix?': 'string', // Generate mode
    'system?': 'string', // Generate mode
    'template?': 'string', // Generate mode
    'context?': 'number[]', // Generate mode
    'raw?': 'boolean', // Generate mode
    'images?': OllamaImageValidator // Generate mode
})

export const OllamaGenerateRequestValidator = type.merge(
    OllamaSharedGenerateRequestValidator,
    OllamaOnlyGenerateRequestValidator
) satisfies Type<OllamaGenerateRequest>;

export const OllamaChatRequestValidator = type.merge(
    OllamaSharedChatRequestValidator,
    OllamaOnlyChatRequestValidator
) satisfies Type<OllamaChatRequest>;

const ollamaGenerateDefault: Partial<GenerateRequest> = {
    stream: false
};

const ollamaChatDefault: Partial<OllamaChatRequest> = {
    stream: true,
    messages: []
};

export const OllamaGenerateRequestWithDefaults = OllamaGenerateRequestValidator.pipe((data) => {
    return {
        ...ollamaGenerateDefault,
        ...data
    };
});

export const OllamaChatRequestWithDefaults = OllamaChatRequestValidator.pipe((data) => {
    return {
        ...ollamaChatDefault,
        ...data
    };
});
