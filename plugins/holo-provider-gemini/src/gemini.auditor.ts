import {injectable} from 'tsyringe';
import {BaseAuditor} from "@holokai/sdk/provider";
import {extractPromptByRole, extractTextParts, extractTopLevelPrompt, pickDefined} from "@holokai/sdk";
import type {ProviderDoneEvent, ProviderEvent} from "@holokai/types/provider";
import type {HoloWorkerRequest, WorkerResponseEnvelope} from "@holokai/types/worker";
import type {ProviderEnvelope, ProviderResponseMetrics} from "@holokai/types/entities";
import {FinishReason, ProviderResponseStatus} from "@holokai/types/entities";
import {GeminiProtocols} from "./plugin";
import {
    EmbedContentParameters,
    EmbedContentResponse,
    GenerateContentParameters,
    GenerateContentResponse
} from "@google/genai";

@injectable()
export class GeminiAuditor extends BaseAuditor {
    readonly provider = 'gemini';

    protected async extractRequestOptions(workerRequest: HoloWorkerRequest): Promise<Record<string, any>> {
        return {
            ...(workerRequest.payload as EmbedContentParameters | GenerateContentParameters).config
        }
    }

    protected async mapProviderResponseMetrics(providerEvent: ProviderDoneEvent, protocolName: string) {
        if (protocolName === GeminiProtocols.EMBED_CONTENT) {
            return {
                usage_raw: (providerEvent.message as EmbedContentResponse).metadata
            } as Partial<ProviderResponseMetrics>
        } else {
            const message = providerEvent.message as GenerateContentResponse;
            const usage = message.usageMetadata;
            return pickDefined({
                input_tokens: usage?.promptTokenCount,
                output_tokens: usage?.candidatesTokenCount,
                total_tokens: usage?.totalTokenCount,
                usage_raw: usage
            }) as Partial<ProviderResponseMetrics>
        }
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent, envelope: WorkerResponseEnvelope): Promise<ProviderResponseStatus> {
        if (providerEvent.type === 'done') {
            const candidates = providerEvent.message?.candidates;
            if (candidates && candidates.length > 0) {
                const finishReason = candidates[0].finishReason;
                if (finishReason === 'MAX_TOKENS') return ProviderResponseStatus.PARTIAL;
            }
        }
        return super.mapResponseStatus(providerEvent, envelope);
    }

    protected async extractFinishReason(providerEvent: ProviderEvent, _envelope: WorkerResponseEnvelope): Promise<FinishReason | undefined> {
        if (providerEvent.type === 'error') return FinishReason.ERROR;
        if (providerEvent.type !== 'done') return undefined;
        const candidates = providerEvent.message?.candidates;
        if (!candidates || candidates.length === 0) return FinishReason.STOP;

        const finishReason = candidates[0].finishReason;
        switch (finishReason) {
            case 'STOP':
                return FinishReason.STOP;
            case 'MAX_TOKENS':
                return FinishReason.LENGTH;
            case 'SAFETY':
                return FinishReason.CONTENT_FILTER;
            case 'RECITATION':
                return FinishReason.CONTENT_FILTER;
            default:
                return FinishReason.STOP;
        }
    }

    protected async createProviderEnvelope(
        workerRequest: HoloWorkerRequest
    ): Promise<ProviderEnvelope> {
        const payload = workerRequest.payload as GenerateContentParameters;

        const last_user_prompt = extractPromptByRole(
            payload.contents as any[] | undefined,
            "user",
            "last",
            (msg) => extractTextParts(msg.parts),
        )
        const system_prompt = workerRequest.systemPrompt?.system_prompt ?? extractTopLevelPrompt(payload.config?.systemInstruction);

        return pickDefined({
            access_model: payload.model,
            last_user_prompt,
            system_prompt,
        }) as ProviderEnvelope;
    }
}
