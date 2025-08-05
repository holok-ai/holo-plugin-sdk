import { injectable } from 'tsyringe';
import { BaseRequestTranslator } from './base.translator';
import { Provider, LLMWorkerRequest, LLMWorkerResponse } from '../../types/provider-request.types';
import { LlmRequest, LlmResponse, LlmStatus } from '../../db/types';
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
        const userPrompt = this.extractUserPromptFromMessages(payload.messages);
        if (userPrompt !== undefined) {
            llmRequest.user_prompt = userPrompt;
        }

        // Claude uses system parameter for system prompt (can be string or TextBlockParam array)
        if (payload.system !== undefined) {
            llmRequest.system_prompt = typeof payload.system === 'string' 
                ? payload.system 
                : JSON.stringify(payload.system);
        }

        // Set options (Claude-specific parameters)
        const options: Record<string, any> = {};
        if (payload.max_tokens !== undefined) options.max_tokens = payload.max_tokens;
        if (payload.temperature !== undefined) options.temperature = payload.temperature;
        if (payload.top_p !== undefined) options.top_p = payload.top_p;
        if (payload.top_k !== undefined) options.top_k = payload.top_k;
        if (payload.stop_sequences !== undefined) options.stop_sequences = payload.stop_sequences;
        if (payload.stream !== undefined) options.stream = payload.stream;
        if (payload.metadata !== undefined) Object.assign(options, payload.metadata);
        
        if (Object.keys(options).length > 0) {
            llmRequest.options = options;
        }
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
        } else if (payload.content && Array.isArray(payload.content)) {
            // Non-streaming final message format
            llmResponse.response = payload.content.map((block: any) => block.text).join('');
        } else if (payload.delta?.text) {
            // Streaming content block delta
            llmResponse.response = payload.delta.text;
        }

        // Extract token usage from metrics or payload
        if (workerResponse.metrics) {
            llmResponse.input_tokens = workerResponse.metrics.inputTokens;
            llmResponse.output_tokens = workerResponse.metrics.outputTokens;
            llmResponse.time_to_first_token = workerResponse.metrics.timeToFirstToken;
            llmResponse.total_processing_time = workerResponse.metrics.totalProcessingTime;
        } else if (payload.usage) {
            llmResponse.input_tokens = payload.usage.input_tokens;
            llmResponse.output_tokens = payload.usage.output_tokens;
        }

        // Set status based on completion and stop reason
        if (payload.type === 'message_stop' || payload.stop_reason) {
            if (payload.stop_reason === 'max_tokens') {
                llmResponse.status = LlmStatus.PARTIAL;
            } else if (payload.stop_reason === 'stop_sequence' || payload.stop_reason === 'end_turn') {
                llmResponse.status = LlmStatus.SUCCESS;
            } else {
                llmResponse.status = LlmStatus.SUCCESS;
            }
        } else if (payload.type === 'error') {
            llmResponse.status = LlmStatus.ERROR;
            llmResponse.error_message = payload.error?.message || 'Claude API error';
        } else {
            llmResponse.status = LlmStatus.SUCCESS;
        }
    }
}