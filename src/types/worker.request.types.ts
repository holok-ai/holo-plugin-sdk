import {MessageCreateParamsBase} from '@anthropic-ai/sdk/resources/messages';
import {ChatRequest, GenerateRequest} from 'ollama';
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions/completions';
import {ProviderType} from "./provider.types";

// Request type enum
export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat'
}

export interface LLMWorkerRequest {
    organizationId?: string;
    providerType: ProviderType;
    sourceId: string;
    applicationId?: string;
    userId?: string;
    requestId: string;
    type: RequestType;
    payload: LLMPayloadTypes;
    timestamp: number;
}

export interface LLMWorkerResponse {
    organizationId?: string;
    sourceId: string;
    requestId: string;
    providerType: ProviderType;
    payload: any;
    fullResponse?: string;
    workerId: string;
    timestamp?: number;
    metrics?: {
        inputTokens: number;
        outputTokens: number;
        timeToFirstToken: number;
        totalProcessingTime: number;
    };
}

// Extended Ollama request types with additional queue metadata
export interface OllamaWorkerGenerateRequest extends GenerateRequest {
}

export interface OllamaWorkerChatRequest extends ChatRequest {
}

export interface ClaudeWorkerRequest extends MessageCreateParamsBase {
}

export interface OpenAIWorkerRequest extends ChatCompletionCreateParamsBase {
}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes =
    OllamaWorkerChatRequest
    | OllamaWorkerGenerateRequest
    | ClaudeWorkerRequest
    | OpenAIWorkerRequest;
