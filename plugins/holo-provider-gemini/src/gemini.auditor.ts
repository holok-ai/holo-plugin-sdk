import {injectable} from 'tsyringe';
import {BaseAuditor} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";
import type {HoloWorkerRequest, WorkerResponseEnvelope} from "@holokai/types/worker";
import type {ProviderRequest} from "@holokai/types/entities";
import {LlmStatus} from "@holokai/types/entities";

@injectable()
export class GeminiAuditor extends BaseAuditor {
    readonly provider = 'gemini';

    protected toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        const payload = workerRequest.payload as any;

        llmRequest.access_model = payload.model;

        const userPrompt = this.extractUserPromptFromContents(payload.contents);
        if (userPrompt !== undefined) {
            llmRequest.metadata.user_prompt = userPrompt;
        }

        if (payload.config?.systemInstruction) {
            const si = payload.config.systemInstruction;
            llmRequest.metadata.system_prompt = typeof si === 'string'
                ? si
                : JSON.stringify(si);
        }
    }

    protected mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void {
        const payload = workerRequest.payload as any;
        const config = payload.config;
        const options: Record<string, any> = {};

        if (config?.temperature !== undefined) options.temperature = config.temperature;
        if (config?.topP !== undefined) options.topP = config.topP;
        if (config?.topK !== undefined) options.topK = config.topK;
        if (config?.maxOutputTokens !== undefined) options.maxOutputTokens = config.maxOutputTokens;
        if (config?.stopSequences !== undefined) options.stopSequences = config.stopSequences;
        if (config?.responseMimeType !== undefined) options.responseMimeType = config.responseMimeType;

        if (Object.keys(options).length > 0) {
            llmRequest.metadata.options = options;
        }
    }

    protected async mapResponseMetrics(providerEvent: Extract<ProviderEvent, {
        type: 'done' | 'error'
    }>, envelope: WorkerResponseEnvelope) {
        const metrics = await super.mapResponseMetrics(providerEvent, envelope);

        if (providerEvent.type === 'error') {
            return metrics;
        }

        const {usageMetadata} = providerEvent.message;
        if (!usageMetadata) return metrics;

        return pickDefined({
            ...metrics,
            usage_raw: usageMetadata,
            input_tokens: usageMetadata.promptTokenCount,
            output_tokens: usageMetadata.candidatesTokenCount
        });
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent, envelope: WorkerResponseEnvelope): Promise<LlmStatus> {
        if (providerEvent.type === 'done') {
            const candidates = providerEvent.message?.candidates;
            if (candidates && candidates.length > 0) {
                const finishReason = candidates[0].finishReason;
                if (finishReason === 'MAX_TOKENS') return LlmStatus.PARTIAL;
            }
        }
        return super.mapResponseStatus(providerEvent, envelope);
    }

    protected async createProviderEnvelope(
        payload: any
    ): Promise<ProviderEnvelope> {
        const logger = this.mlog(this.createProviderEnvelope);
        if (!payload.model) {
            logger.error(`Missing model: ${JSON.stringify(payload)}`);
        }

        const systemInstruction = payload.config?.systemInstruction;

        return pickDefined({
            access_model: payload.model,
            system_prompt: systemInstruction
                ? (typeof systemInstruction === 'string' ? systemInstruction : JSON.stringify(systemInstruction))
                : undefined
        }) as ProviderEnvelope;
    }

    protected extractExtraTokens(metrics: Record<string, any>, base: Record<string, number>): Record<string, number> {
        const usage = metrics.usage_raw;
        if (!usage) return base;
        return pickDefined({
            ...base,
            thinking: usage.thoughtsTokenCount,
            cache_read: usage.cachedContentTokenCount,
        });
    }

    private extractUserPromptFromContents(contents?: any[]): string | undefined {
        if (!contents || !Array.isArray(contents)) return undefined;

        const userMessages = contents.filter(msg => msg.role === 'user');
        if (userMessages.length === 0) return undefined;

        const lastUserMessage = userMessages[userMessages.length - 1];
        if (typeof lastUserMessage.parts === 'string') {
            return lastUserMessage.parts;
        } else if (Array.isArray(lastUserMessage.parts)) {
            const textParts = lastUserMessage.parts.filter((part: any) => part.text !== undefined);
            return textParts.length > 0 ? textParts[0].text : undefined;
        }

        return undefined;
    }
}
