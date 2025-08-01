import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';
import { ClaudeWorkerRequest } from '../../types/provider-request.types';

@injectable()
export class ClaudeRequestTranslator extends BaseRequestTranslator {
    readonly provider = Provider.CLAUDE;

    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        this.setCommonFields(workerRequest, llmRequest);

        const payload = workerRequest.payload as ClaudeWorkerRequest;
        
        // Set model
        llmRequest.model_slug = payload.model;

        // Extract user prompt from messages
        llmRequest.user_prompt = this.extractUserPromptFromMessages(payload.messages);

        // Claude uses system parameter for system prompt (can be string or TextBlockParam array)
        llmRequest.system_prompt = typeof payload.system === 'string' 
            ? payload.system 
            : payload.system ? JSON.stringify(payload.system) : undefined;

        // Set options (Claude-specific parameters)
        llmRequest.options = {
            max_tokens: payload.max_tokens,
            temperature: payload.temperature,
            top_p: payload.top_p,
            top_k: payload.top_k,
            stop_sequences: payload.stop_sequences,
            stream: payload.stream,
            ...payload.metadata
        };
    }

    private extractUserPromptFromMessages(messages?: any[]): string | undefined {
        if (!messages || !Array.isArray(messages)) return undefined;
        
        const userMessages = messages.filter(msg => msg.role === 'user');
        if (userMessages.length === 0) return undefined;
        
        // Return the last user message content
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (typeof lastUserMessage.content === 'string') {
            return lastUserMessage.content;
        } else if (Array.isArray(lastUserMessage.content)) {
            // Handle content blocks - extract text content
            const textBlocks = lastUserMessage.content.filter((block: any) => block.type === 'text');
            return textBlocks.length > 0 ? textBlocks[0].text : undefined;
        }
        
        return undefined;
    }
}