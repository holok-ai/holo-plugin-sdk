import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest, RequestType } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';
import { OllamaWorkerChatRequest, OllamaWorkerGenerateRequest } from '../../types/provider-request.types';

@injectable()
export class OllamaRequestTranslator extends BaseRequestTranslator {
    readonly provider = Provider.OLLAMA;

    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        this.setCommonFields(workerRequest, llmRequest);

        const payload = workerRequest.payload as OllamaWorkerChatRequest | OllamaWorkerGenerateRequest;
        
        // Set model
        llmRequest.model_slug = payload.model;

        // Set prompt/message content based on request type
        if (workerRequest.type === RequestType.CHAT) {
            const chatPayload = payload as OllamaWorkerChatRequest;
            llmRequest.user_prompt = this.extractUserPromptFromMessages(chatPayload.messages);
            llmRequest.system_prompt = this.extractSystemPromptFromMessages(chatPayload.messages);
        } else if (workerRequest.type === RequestType.GENERATE) {
            const generatePayload = payload as OllamaWorkerGenerateRequest;
            llmRequest.user_prompt = generatePayload.prompt;
            llmRequest.system_prompt = generatePayload.system;
        }

        // Set options
        llmRequest.options = payload.options || {};
    }

    private extractUserPromptFromMessages(messages?: any[]): string | undefined {
        if (!messages || !Array.isArray(messages)) return undefined;
        
        const userMessages = messages.filter(msg => msg.role === 'user');
        if (userMessages.length === 0) return undefined;
        
        // Return the last user message content
        const lastUserMessage = userMessages[userMessages.length - 1];
        return typeof lastUserMessage.content === 'string' ? lastUserMessage.content : undefined;
    }

    private extractSystemPromptFromMessages(messages?: any[]): string | undefined {
        if (!messages || !Array.isArray(messages)) return undefined;
        
        const systemMessage = messages.find(msg => msg.role === 'system');
        return systemMessage && typeof systemMessage.content === 'string' ? systemMessage.content : undefined;
    }
}