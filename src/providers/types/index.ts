import {LLMWorkerRequest, LLMWorkerResponse, RequestType} from '../../types';
import {ClaudeChatRequest} from "../claude/claude.request.validators";
import {OllamaChatRequest} from "../ollama/ollama.request.validators";
import {OpenAIChatRequest} from "../openai/openai.request.validators";

export * from './auditor.types';

// Universal Request/Response System
export * from '../holo/holo.request.validators';
export * from '../holo/holo.response.validators';

// Provider-specific translators
export * as ClaudeTranslator from '../claude/claude.translator';
export * as ClaudeRequestTranslators from '../claude/translators/claude.request.translators';
export * as OpenAITranslator from '../openai/openai.translator';
export * as OllamaTranslator from '../ollama/ollama.translator';

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

export interface AIRequestStat {
    type: RequestType;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}

export {ProviderType} from '../../types';
export {ClaudeChatRequest} from '../claude/claude.request.validators';
export {OllamaChatRequest} from '../ollama/ollama.request.validators';
export {OpenAIChatRequest} from '../openai/openai.request.validators';

export {OllamaResponse} from '../ollama/ollama.response.validators';
export {OpenAIResponse} from '../openai/openai.response.validators';

export type ProviderRequestTypes =
    ClaudeChatRequest
    | OllamaChatRequest
    | OpenAIChatRequest;
export {HoloRequest} from "../holo/types/requests";
export {HoloRequestMetadata} from "../holo/types/requests";
export {HoloResponseFormat} from "../holo/types/requests";
export {HoloToolChoice} from "../holo/types/requests";
export {HoloTool} from "../holo/types/requests";
export {HoloRequestMessage} from "../holo/types/requests";
export {ClaudeResponse} from "../claude/types";
export {HoloStreamChunk} from "../holo";
export {HoloResponse} from "../holo";
export {HoloResponseStreamChoice} from "../holo";
export {HoloResponseStreamDelta} from "../holo";
export {HoloResponseChoice} from "../holo";
export {HoloFinishReason} from "../holo";
export {HoloResponseMessage} from "../holo";
export {HoloResponseToolCall} from "../holo";
export {HoloResponseUsage} from "../holo";
