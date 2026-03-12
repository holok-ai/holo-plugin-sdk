import {injectable} from 'tsyringe';
import {pickDefined} from "@holokai/sdk";
import {BaseAuditor} from "@holokai/sdk/provider";
import {HoloWorkerRequest} from "@holokai/types/worker";
import {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";
import {LlmStatus, ProviderRequest} from "@holokai/types/entities";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {ResponseCreateParamsBase, ResponseUsage} from "openai/resources/responses/responses";
import {CompletionUsage} from "openai/resources/completions";
import {OpenAIProtocols} from "./plugin";

@injectable()
export class OpenAIAuditor extends BaseAuditor {
    readonly provider = 'openai';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        if (workerRequest.protocol.name === OpenAIProtocols.RESPONSES) {
            const payload = workerRequest.payload as ResponseCreateParamsBase;

            if (payload.model) {
                llmRequest.access_model = payload.model as string;
            }

            const userPrompt = this.extractUserPromptFromInput(payload.input);
            if (userPrompt !== undefined) {
                llmRequest.metadata.user_prompt = userPrompt;
            }

            const systemPrompt = this.extractSystemPromptFromInput(payload.input);
            if (systemPrompt !== undefined) {
                llmRequest.metadata.system_prompt = systemPrompt;
            }
        } else {
            const payload = workerRequest.payload as ChatCompletionCreateParamsBase;

            llmRequest.access_model = payload.model;

            const userPrompt = this.extractUserPromptFromMessages(payload.messages);
            if (userPrompt !== undefined) {
                llmRequest.metadata.user_prompt = userPrompt;
            }

            const systemPrompt = this.extractSystemPromptFromMessages(payload.messages);
            if (systemPrompt !== undefined) {
                llmRequest.metadata.system_prompt = systemPrompt;
            }
        }
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        const options: Record<string, any> = {};

        if (workerRequest.protocol.name === OpenAIProtocols.RESPONSES) {
            const payload = workerRequest.payload as ResponseCreateParamsBase;
            if (payload.max_output_tokens !== undefined) options.max_output_tokens = payload.max_output_tokens;
            if (payload.temperature !== undefined) options.temperature = payload.temperature;
            if (payload.top_p !== undefined) options.top_p = payload.top_p;
            if (payload.stream !== undefined) options.stream = payload.stream;
            if (payload.tools !== undefined) options.tools = payload.tools;
            if (payload.tool_choice !== undefined) options.tool_choice = payload.tool_choice;
        } else {
            const payload = workerRequest.payload as ChatCompletionCreateParamsBase;
            if (payload.max_completion_tokens !== undefined) options.max_completion_tokens = payload.max_completion_tokens;
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
            if (payload.safety_identifier !== undefined) options.safety_identifier = payload.safety_identifier;
            if (payload.user !== undefined) options.user = payload.user;
        }

        if (Object.keys(options).length > 0) {
            llmRequest.metadata.options = options;
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

    protected async createProviderEnvelope(payload: ResponseCreateParamsBase | ChatCompletionCreateParamsBase): Promise<ProviderEnvelope> {
        return pickDefined({
            access_model: payload.model
        }) as ProviderEnvelope
    }

    private extractUserPromptFromInput(input: ResponseCreateParamsBase['input']): string | undefined {
        if (!input) return undefined;

        // Simple string input — the whole thing is the user prompt
        if (typeof input === 'string') {
            return input;
        }

        if (!Array.isArray(input)) return undefined;

        // Walk in reverse to find the last user-role entry
        for (let i = input.length - 1; i >= 0; i--) {
            const entry = input[i];
            if (!entry || typeof entry !== 'object') continue;
            if (!('role' in entry) || (entry as any).role !== 'user') continue;

            const content = (entry as any).content;
            if (typeof content === 'string') {
                return content;
            }

            if (Array.isArray(content)) {
                // Responses API uses type:'input_text'; also accept type:'text' for safety
                const textParts = content
                    .filter((c: any) => (c.type === 'input_text' || c.type === 'text') && typeof c.text === 'string')
                    .map((c: any) => c.text as string);
                if (textParts.length > 0) {
                    return textParts.join('\n');
                }
            }
        }

        return undefined;
    }

    private extractSystemPromptFromInput(input: ResponseCreateParamsBase['input']): string | undefined {
        if (!input || !Array.isArray(input)) return undefined;

        for (const entry of input) {
            if (!entry || typeof entry !== 'object') continue;
            if (!('role' in entry) || (entry as any).role !== 'system') continue;

            const content = (entry as any).content;
            if (typeof content === 'string') {
                return content;
            }
        }

        return undefined;
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
