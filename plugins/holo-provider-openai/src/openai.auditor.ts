import {injectable} from 'tsyringe';
import {BaseAuditor, HoloWorkerRequest, pickDefined, ProviderEnvelope, ProviderEvent} from "@holokai/sdk";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {ResponseCreateParamsBase, ResponseUsage} from "openai/resources/responses/responses";
import {LlmRequest, LlmStatus} from "@holokai/sdk/core/entities";
import {CompletionUsage} from "openai/resources/completions";

@injectable()
export class OpenAIAuditor extends BaseAuditor {
    readonly provider = 'openai';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        const payload = workerRequest.payload as ChatCompletionCreateParamsBase;

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
        const payload = workerRequest.payload as ChatCompletionCreateParamsBase;
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

    protected async mapResponseMetrics(providerEvent: Extract<ProviderEvent, { type: 'done' | 'error' }>) {
        const metrics = await super.mapResponseMetrics(providerEvent);
        if (providerEvent.type === 'error') {
            return metrics;
        }

        const payload = providerEvent.message;
        let usage: ResponseUsage | CompletionUsage = payload.response ? payload.response.usage : payload.usage;

        if (!usage) {
            return metrics;
        }

        let input_tokens;
        let output_tokens;
        if (payload.response) {
            usage = usage as ResponseUsage;
            input_tokens = usage.input_tokens;
            output_tokens = usage.output_tokens;
        } else {
            usage = usage as CompletionUsage;
            input_tokens = usage.prompt_tokens;
            output_tokens = usage.completion_tokens;
        }

        return pickDefined({
            ...metrics,
            usage_raw: usage,
            input_tokens,
            output_tokens
        });
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent): Promise<LlmStatus> {
        if (providerEvent.type === 'done') {
            const payload = providerEvent.message;
            const choice = payload.choices?.[0];
            if (choice?.finish_reason) {
                if (choice.finish_reason === 'length') {
                    return LlmStatus.PARTIAL;
                } else if (choice.finish_reason === 'content_filter') {
                    return LlmStatus.ERROR;
                }
            }
        }
        return super.mapResponseStatus(providerEvent);
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
