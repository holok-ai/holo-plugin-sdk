import { MessageCreateParamsBase } from '@anthropic-ai/sdk/resources/messages';
import { GenerateRequest, ChatRequest } from 'ollama';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions/completions';

// Provider enum
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude',
    OPENAI = 'openai'
}

// Request type enum
export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat'
}

export interface LLMWorkerRequest {
    provider: Provider;
    sourceId: string;
    requestId: string;
    type: RequestType;
    payload: LLMPayloadTypes;
    timestamp: number;
}

export interface LLMWorkerResponse {
    sourceId: string;
    requestId: string;
    provider: Provider;
    payload: any;
    fullResponse?: string;
    workerId?: string;
    timestamp?: number;
    metrics?: {
        inputTokens: number;
        outputTokens: number;
        timeToFirstToken: number;
        totalProcessingTime: number;
    };
}

// Extended Ollama request types with additional queue metadata
export interface OllamaWorkerGenerateRequest extends GenerateRequest {}

export interface OllamaWorkerChatRequest extends ChatRequest {}

export interface ClaudeWorkerRequest extends MessageCreateParamsBase {}

export interface OpenAIWorkerRequest extends ChatCompletionCreateParamsBase {}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes = OllamaWorkerChatRequest | OllamaWorkerGenerateRequest | ClaudeWorkerRequest | OpenAIWorkerRequest;