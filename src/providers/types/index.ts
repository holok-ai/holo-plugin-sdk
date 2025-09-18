import {LLMWorkerRequest, LLMWorkerResponse} from '../../types';
import {OllamaChatRequest} from "../ollama";
import {OpenAIChatRequest} from "../openai";
import {ClaudeChatRequest} from "../claude";

export * from '../types/auditor.types';
export * from '../types/validator.types';
export * from '../types/translators';
export * from '../types/ai.provider';

export * from '../claude/types';
export * from '../ollama/types';
export * from '../openai/types';
export * from '../holo/types';


/**
 * Interface for LLM providers
 * All LLM provider implementations must conform to this interface
 */
export interface IProvider {
    name: string;
    config: AIProviderConfig;

    /**
     * Initialize the provider.
     */
    init(): Promise<void>;

    /**
     * Get available models from the provider.
     * @returns Array of available models.
     */
    getModels(): Promise<ModelInfo[]>;


    /**
     * Handle LLMWorkerRequest - unified interface for all providers
     */
    handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat>;

    /**
     * Handle response chunk data with ResponseStream
     */
    onResponseChunk(responseChunk: LLMWorkerResponse): Promise<void>;
}

export interface AIProviderConfig {
    baseUrl?: string
    apiKey?: string
    auditEnabled: boolean
}

export interface OllamaProviderConfig extends AIProviderConfig {
    host: string,
    timeout: number
}

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

// Request type enum
export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat'
}

export interface AIRequestStat {
    type: RequestType;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}

export type ProviderChatRequest =
    ClaudeChatRequest
    | OllamaChatRequest
    | OpenAIChatRequest;

export enum ProviderType {
    OLLAMA = 'OLLAMA',
    CLAUDE = 'ANTHROPIC',
    ANTHROPIC = 'ANTHROPIC',
    OPENAI = 'OPENAI',
    PERPLEXITY = 'PERPLEXITY'
}
