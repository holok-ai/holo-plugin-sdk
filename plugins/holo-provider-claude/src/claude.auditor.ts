import {injectable} from 'tsyringe';
import {BaseAuditor} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import type {LlmRequest} from "@holokai/types/entities";
import {LlmStatus} from "@holokai/types/entities";
import {MessageCreateParamsBase} from "@anthropic-ai/sdk/resources/messages";
import {MessageStreamParams} from "@anthropic-ai/sdk/resources/messages/messages";
import {BetaMessageStreamParams} from "@anthropic-ai/sdk/resources/beta/messages/messages";

@injectable()
export class ClaudeAuditor extends BaseAuditor {
    readonly provider = 'claude';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        const payload = workerRequest.payload as MessageStreamParams | BetaMessageStreamParams;

        llmRequest.model_slug = payload.model;

        const userPrompt = this.extractUserPromptFromMessages(payload.messages);
        if (userPrompt !== undefined) {
            llmRequest.user_prompt = userPrompt;
        }

        if (payload.system !== undefined) {
            llmRequest.system_prompt = typeof payload.system === 'string'
                ? payload.system
                : JSON.stringify(payload.system);
        }
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        const payload = workerRequest.payload as MessageStreamParams | BetaMessageStreamParams;
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

    protected async mapResponseMetrics(providerEvent: Extract<ProviderEvent, { type: 'done' | 'error' }>) {
        const metrics = await super.mapResponseMetrics(providerEvent);

        if (providerEvent.type === 'error') {
            return metrics;
        }
        const {usage} = providerEvent.message

        return pickDefined({
            ...metrics,
            usage_raw: usage,
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens
        });
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent): Promise<LlmStatus> {
        if (providerEvent.type === 'done') {
            const {stop_reason} = providerEvent.message;
            if (stop_reason && stop_reason === 'max_tokens') return LlmStatus.PARTIAL;
        }
        return super.mapResponseStatus(providerEvent);
    }

    protected async createProviderEnvelope(
        payload: MessageCreateParamsBase
    ): Promise<ProviderEnvelope> {
        const logger = this.mlog(this.createProviderEnvelope);
        if (!payload.model) {
            logger.error(`Missing model: ${JSON.stringify(payload)}`);
        }

        return pickDefined({
            model_slug: payload.model,
            system_prompt: payload.system ?
                (Array.isArray(payload.system) ? JSON.stringify(payload.system) : payload.system) : undefined
        }) as ProviderEnvelope;
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
