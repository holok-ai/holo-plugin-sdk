import {injectable} from 'tsyringe';
import {
    BaseAuditor,
    HoloWorkerRequest,
    HoloWorkerResponse,
    LlmRequest,
    LlmResponse,
    LlmStatus,
    pickDefined,
    ProviderEnvelope
} from "@holokai/sdk";
import {OpenAIChatRequest} from "./types";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {ResponseCreateParamsBase} from "openai/resources/responses/responses";

@injectable()
export class OpenAIAuditor extends BaseAuditor {
    readonly provider = 'openai';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        const payload = workerRequest.payload as OpenAIChatRequest;

        // Set model
        llmRequest.model_slug = payload.model;

        // Extract user prompt from messages
        const userPrompt = this.extractUserPromptFromMessages(payload.messages);
        if (userPrompt !== undefined) {
            llmRequest.user_prompt = userPrompt;
        }

        // Extract system prompt from messages
        const systemPrompt = this.extractSystemPromptFromMessages(payload.messages);
        if (systemPrompt !== undefined) {
            llmRequest.system_prompt = systemPrompt;
        }
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        const payload = workerRequest.payload as OpenAIChatRequest;
        // Set options (OpenAI-specific parameters)
        const options: Record<string, any> = {};
        if (payload.max_tokens !== undefined) options.max_tokens = payload.max_tokens;
        if (payload.temperature !== undefined) options.temperature = payload.temperature;
        if (payload.top_p !== undefined) options.top_p = payload.top_p;
        if (payload.frequency_penalty !== undefined) options.frequency_penalty = payload.frequency_penalty;
        if (payload.presence_penalty !== undefined) options.presence_penalty = payload.presence_penalty;
        if (payload.stop !== undefined) options.stop = payload.stop;
        if (payload.stream !== undefined) options.stream = payload.stream;
        if (payload.tools !== undefined) options.tools = payload.tools;
        if (payload.tool_choice !== undefined) options.tool_choice = payload.tool_choice;
        if (payload.response_format !== undefined) options.response_format = payload.response_format;
        if (payload.seed !== undefined) options.seed = payload.seed;
        if (payload.user !== undefined) options.user = payload.user;

        if (Object.keys(options).length > 0) {
            llmRequest.options = options;
        }
    }

    protected mapResponseToHolo(
        workerResponse: HoloWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>
    ): void {
        const payload = workerResponse.payload;
        // Extract model from payload
        llmResponse.model_slug = payload.model || 'unknown';

        // Extract response text from final response
        if (workerResponse.fullResponse) {
            llmResponse.response = workerResponse.fullResponse;
        } else if (payload.object === 'chat.completion') {
            // Non-streaming completion
            const choice = payload.choices?.[0];
            if (choice?.message?.content) {
                llmResponse.response = choice.message.content;
            }
        } else if (payload.object === 'chat.completion.chunk') {
            // Streaming chunk
            const choice = payload.choices?.[0];
            if (choice?.delta?.content) {
                llmResponse.response = choice.delta.content;
            }
        }
    }

    protected collectResponseMetrics(
        workerResponse: HoloWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>
    ): void {

        const payload = workerResponse.payload;

        // Extract token usage from metrics or payload
        if (workerResponse.metrics) {
            llmResponse.usage_raw = workerResponse.metrics;
            llmResponse.input_tokens = workerResponse.metrics.inputTokens;
            llmResponse.output_tokens = workerResponse.metrics.outputTokens;
            llmResponse.time_to_first_token = workerResponse.metrics.timeToFirstToken;
            llmResponse.total_processing_time = workerResponse.metrics.totalProcessingTime;

        } else if (payload.usage) {
            llmResponse.usage_raw = payload.usage;
            llmResponse.input_tokens = payload.usage.prompt_tokens;
            llmResponse.output_tokens = payload.usage.completion_tokens;
            llmResponse.time_to_first_token = payload.usage.timeToFirstToken;
            llmResponse.total_processing_time = payload.usage.totalProcessingTime;
        }

        // Set status based on completion and finish reason
        const choice = payload.choices?.[0];
        if (choice?.finish_reason) {
            if (choice.finish_reason === 'length') {
                llmResponse.status = LlmStatus.PARTIAL;
            } else if (choice.finish_reason === 'stop' || choice.finish_reason === 'end_turn') {
                llmResponse.status = LlmStatus.SUCCESS;
            } else if (choice.finish_reason === 'content_filter') {
                llmResponse.status = LlmStatus.ERROR;
                llmResponse.error_message = 'Content filtered by OpenAI';
            } else {
                llmResponse.status = LlmStatus.SUCCESS;
            }
        } else if (payload.error) {
            llmResponse.status = LlmStatus.ERROR;
            llmResponse.error_message = payload.error.message || 'OpenAI API error';
        } else {
            llmResponse.status = LlmStatus.SUCCESS;
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

    protected async createProviderEnvelope(payload: ResponseCreateParamsBase | ChatCompletionCreateParamsBase): Promise<ProviderEnvelope> {
        return pickDefined({
            model_slug: payload.model
        }) as ProviderEnvelope
    }
}
