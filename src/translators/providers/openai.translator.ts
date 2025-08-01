import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';
import { OpenAIWorkerRequest } from '../../types/provider-request.types';

@injectable()
export class OpenAIRequestTranslator extends BaseRequestTranslator {
    readonly provider = Provider.OPENAI;

    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        this.setCommonFields(workerRequest, llmRequest);

        const payload = workerRequest.payload as OpenAIWorkerRequest;
        
        // Set model
        llmRequest.model_slug = payload.model;

        // Extract user prompt from messages
        llmRequest.user_prompt = this.extractUserPromptFromMessages(payload.messages);

        // Extract system prompt from messages
        llmRequest.system_prompt = this.extractSystemPromptFromMessages(payload.messages);

        // Set options (OpenAI-specific parameters)
        llmRequest.options = {
            max_tokens: payload.max_tokens,
            temperature: payload.temperature,
            top_p: payload.top_p,
            frequency_penalty: payload.frequency_penalty,
            presence_penalty: payload.presence_penalty,
            stop: payload.stop,
            stream: payload.stream,
            tools: payload.tools,
            tool_choice: payload.tool_choice,
            response_format: payload.response_format,
            seed: payload.seed,
            user: payload.user
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
            // Handle content array - extract text content
            const textParts = lastUserMessage.content
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text);
            return textParts.length > 0 ? textParts.join('\n') : undefined;
        }
        
        return undefined;
    }

    private extractSystemPromptFromMessages(messages?: any[]): string | undefined {
        if (!messages || !Array.isArray(messages)) return undefined;
        
        const systemMessage = messages.find(msg => msg.role === 'system');
        return systemMessage && typeof systemMessage.content === 'string' ? systemMessage.content : undefined;
    }
}