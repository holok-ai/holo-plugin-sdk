import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest, LLMWorkerResponse, RequestType } from '../../types/provider-request.types';
import { LlmRequest, LlmResponse, LlmStatus } from '../../db/types';
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
            const userPrompt = this.extractUserPromptFromMessages(chatPayload.messages);
            const systemPrompt = this.extractSystemPromptFromMessages(chatPayload.messages);
            if (userPrompt !== undefined) {
                llmRequest.user_prompt = userPrompt;
            }
            if (systemPrompt !== undefined) {
                llmRequest.system_prompt = systemPrompt;
            }
        } else if (workerRequest.type === RequestType.GENERATE) {
            const generatePayload = payload as OllamaWorkerGenerateRequest;
            if (generatePayload.prompt !== undefined) {
                llmRequest.user_prompt = generatePayload.prompt;
            }
            if (generatePayload.system !== undefined) {
                llmRequest.system_prompt = generatePayload.system;
            }
        }

        // Set options
        if (payload.options !== undefined) {
            llmRequest.options = payload.options;
        }
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

    translateResponse(
        workerResponse: LLMWorkerResponse, 
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void {
        this.setCommonResponseFields(workerResponse, llmResponse, requestContext);

        const payload = workerResponse.payload;
        
        // Extract model from payload
        llmResponse.model_slug = payload.model || 'unknown';
        
        // Extract response text from final response
        if (workerResponse.fullResponse) {
            llmResponse.response = typeof workerResponse.fullResponse === 'string' 
                ? workerResponse.fullResponse 
                : JSON.stringify(workerResponse.fullResponse);
        } else if (payload.response) {
            // Generate format
            llmResponse.response = payload.response;
        } else if (payload.message?.content) {
            // Chat format
            llmResponse.response = payload.message.content;
        }

        // Extract token usage from metrics or payload
        if (workerResponse.metrics) {
            llmResponse.input_tokens = workerResponse.metrics.inputTokens;
            llmResponse.output_tokens = workerResponse.metrics.outputTokens;
            llmResponse.time_to_first_token = workerResponse.metrics.timeToFirstToken;
            llmResponse.total_processing_time = workerResponse.metrics.totalProcessingTime;
        } else {
            // Fallback to payload data
            const promptTokens = payload.prompt_eval_count || 0;
            const responseTokens = payload.eval_count || 0;
            llmResponse.input_tokens = promptTokens;
            llmResponse.output_tokens = responseTokens;
            
            if (payload.total_duration) {
                llmResponse.total_processing_time = Math.round(payload.total_duration / 1000000); // Convert nanoseconds to milliseconds
            }
        }

        // Set status based on completion
        if (payload.done === true) {
            llmResponse.status = LlmStatus.SUCCESS;
        } else {
            llmResponse.status = LlmStatus.PARTIAL;
        }
    }
}