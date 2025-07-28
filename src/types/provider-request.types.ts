import { MessageCreateParamsBase } from '@anthropic-ai/sdk/resources/messages';
import { GenerateRequest, ChatRequest } from 'ollama';

// Provider enum
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude',
    OPENAI = 'openai'
}

export interface LLMWorkerRequest {
    provider: Provider;
    sourceId: string;
    requestId: string;
    type: string;
    payload: LLMPayloadTypes;
    timestamp: number;
}

export interface LLMWorkerResponse {
    sourceId: string;
    requestId: string;
    provider: Provider;
    payload: any;
    fullResponse?: string;
}

// Extended Ollama request types with additional queue metadata
export interface OllamaGenerateQueueRequest extends GenerateRequest {}

export interface OllamaChatQueueRequest extends ChatRequest {}

export interface ClaudeWorkerRequest extends MessageCreateParamsBase {}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes = OllamaGenerateQueueRequest | OllamaChatQueueRequest | ClaudeWorkerRequest;