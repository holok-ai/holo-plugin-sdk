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
}

// Extended Ollama request types with additional queue metadata
export interface OllamaGenerateQueueRequest extends GenerateRequest {}

export interface OllamaChatQueueRequest extends ChatRequest {}

export interface ClaudeWorkerRequest extends MessageCreateParamsBase {}

export interface OpenAIWorkerRequest extends ChatCompletionCreateParamsBase {}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes = OllamaGenerateQueueRequest | OllamaChatQueueRequest | ClaudeWorkerRequest | OpenAIWorkerRequest;