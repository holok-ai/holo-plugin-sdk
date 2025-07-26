import { GenerateRequest, ChatRequest } from 'ollama';

// Provider enum
export enum Provider {
    OLLAMA = 'ollama',
    CLAUDE = 'claude',
    OPENAI = 'openai'
}

// Extended Ollama request types with additional queue metadata
export interface OllamaGenerateQueueRequest extends GenerateRequest {
    provider: Provider.OLLAMA;
    sourceId: string;
    requestId: string;
    type: 'generate';
}

export interface OllamaChatQueueRequest extends ChatRequest {
    provider: Provider.OLLAMA;
    sourceId: string;
    requestId: string;
    type: 'chat';
}

// Union type for all Ollama queue requests
export type OllamaQueueRequest = OllamaGenerateQueueRequest | OllamaChatQueueRequest;