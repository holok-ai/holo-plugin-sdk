import {ChatCompletion, ChatCompletionChunk} from "openai/resources/chat/completions/completions";

/**
 * Model information interface
 */
export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    size?: number;
    parameterCount?: string;
    quantization?: string;
    family?: string;
    parentModel?: string;
    format?: string;

    [key: string]: any; // Allow additional properties
}

/**
 * Chat message interface
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Generation parameters for text generation
 */

/**
 * Generation options interface
 */
export interface LlmOptions {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    stop?: string | string[];
    stream?: boolean;
    user?: string;

    [key: string]: any; // Allow additional provider-specific options
}

export interface GenerateParams extends LlmOptions {
    model: string;
    prompt: string;

}

/**
 * Generation parameters for chat completion
 */
export interface ChatParams extends LlmOptions {
    model: string;
    messages: ChatMessage[];
}

/**
 * Model status interface
 */
export interface ModelStatus {
    id: string;
    loaded: boolean;
    size?: number;
    digest?: string;
    details?: {
        parent_model?: string;
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization_level?: string;
    };
    expires_at?: string;
    size_vram?: number;

    [key: string]: any;
}

/**
 * Model operation result interface
 */
export interface ModelOperationResult {
    success: boolean;
    message?: string;
    error?: string;

    [key: string]: any;
}

/**
 * Token callback function type
 */
export type TokenCallback = (token: ChatCompletion | ChatCompletionChunk) => void;

/**
 * Completion callback function type
 */
export type CompletionCallback = (result: any) => void;

/**
 * Error callback function type
 */
export type ErrorCallback = (error: Error) => void;

