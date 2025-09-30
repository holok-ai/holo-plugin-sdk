import {OllamaChatRequest, OllamaGenerateRequest, OllamaMessage, OllamaResponse} from "../ollama/types";
import {OpenAIChatRequest, OpenAIRequestMessage, OpenAIResponse} from "../openai/types";
import {LLMWorkerRequest, LLMWorkerResponse} from "../../types";
import {ClaudeChatRequest, ClaudeRequestMessage, ClaudeResponse} from "../claude/types";

export interface IProvider {
    name: string;
    config: AIProviderConfig;

    init(): Promise<void>;

    getModels(): Promise<ModelInfo[]>;

    processRequest(request: LLMWorkerRequest): Promise<AIRequestStat>;

    handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat>;

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

export type ProviderResponse =
    ClaudeResponse
    | OllamaResponse
    | OpenAIResponse;

export type ProviderChatRequest =
    ClaudeChatRequest
    | OllamaChatRequest
    | OpenAIChatRequest;

export type ProviderRequest =
    OllamaChatRequest
    | OllamaGenerateRequest
    | ClaudeChatRequest
    | OpenAIChatRequest;

export type ProviderMessage =
    ClaudeRequestMessage
    | OllamaMessage
    | OpenAIRequestMessage


export enum ProviderType {
    OLLAMA = 'OLLAMA',
    CLAUDE = 'CLAUDE',
    OPENAI = 'OPENAI',
    PERPLEXITY = 'PERPLEXITY'
}
