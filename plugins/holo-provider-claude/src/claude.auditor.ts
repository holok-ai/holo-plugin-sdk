import {injectable} from 'tsyringe';
import {BaseAuditor, extractPromptByRole} from "@holokai/sdk/provider";
import {extractTextContent, extractTopLevelPrompt, pickDefined} from "@holokai/sdk";
import type {ProviderDoneEvent, ProviderEvent} from "@holokai/types/provider";
import type {HoloWorkerRequest, WorkerResponseEnvelope} from "@holokai/types/worker";
import type {ProviderEnvelope, ProviderResponseMetrics} from "@holokai/types/entities";
import {FinishReason, ProviderResponseStatus} from "@holokai/types/entities";
import {MessageCreateParamsBase} from "@anthropic-ai/sdk/resources/messages";
import {Message, MessageStreamParams, MessageTokensCount} from "@anthropic-ai/sdk/resources/messages/messages";
import {BetaMessageStreamParams} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import {ClaudeProtocols} from "./plugin";

@injectable()
export class ClaudeAuditor extends BaseAuditor {
    readonly provider = 'claude';

    protected async extractRequestOptions(workerRequest: HoloWorkerRequest): Promise<Record<string, any>> {
        const payload = workerRequest.payload as MessageStreamParams | BetaMessageStreamParams;

        const {
            max_tokens,
            metadata,
            stop_sequences,
            stream,
            temperature,
            top_k,
            top_p,
        } = payload;

        return {
            ...pickDefined({
                max_tokens,
                stop_sequences,
                stream,
                temperature,
                top_k,
                top_p,
            }),
            ...(metadata ?? {}),
        };
    }

    protected async mapProviderResponseMetrics(providerEvent: ProviderDoneEvent, protocolName: string) {
        let message = providerEvent.message as MessageTokensCount | Message;
        switch (protocolName) {
            case ClaudeProtocols.COUNT_TOKENS:
                return pickDefined({
                    input_tokens: (message as MessageTokensCount).input_tokens,
                }) as Partial<ProviderResponseMetrics>;
            default: {
                const usage = (message as Message).usage;
                const {input_tokens, output_tokens} = usage;

                return pickDefined({
                    input_tokens,
                    output_tokens,
                    total_tokens: input_tokens + output_tokens,
                    usage_raw: usage
                }) as Partial<ProviderResponseMetrics>;
            }
        }
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent, envelope: WorkerResponseEnvelope): Promise<ProviderResponseStatus> {
        if (providerEvent.type === 'done') {
            const stop_reason = providerEvent.message?.stop_reason;
            if (stop_reason === 'max_tokens') return ProviderResponseStatus.PARTIAL;
        }
        return super.mapResponseStatus(providerEvent, envelope);
    }

    protected async extractFinishReason(providerEvent: ProviderEvent, _envelope: WorkerResponseEnvelope): Promise<FinishReason | undefined> {
        if (providerEvent.type === 'error') return FinishReason.ERROR;
        if (providerEvent.type !== 'done') return undefined;

        const stopReason = providerEvent.message?.stop_reason;
        switch (stopReason) {
            case 'end_turn':
                return FinishReason.STOP;
            case 'tool_use':
                return FinishReason.TOOL_CALLS;
            case 'max_tokens':
                return FinishReason.LENGTH;
            case 'stop_sequence':
                return FinishReason.STOP;
            default:
                return FinishReason.STOP;
        }
    }

    protected async createProviderEnvelope(
        workerRequest: HoloWorkerRequest
    ): Promise<ProviderEnvelope> {
        const payload = workerRequest.payload as MessageCreateParamsBase;

        const last_user_prompt = extractPromptByRole(
            payload.messages,
            "user",
            "last",
            (msg) => extractTextContent(msg.content),
        );
        const system_prompt = workerRequest.systemPrompt?.system_prompt ?? extractTopLevelPrompt(payload.system);

        return pickDefined({
            last_user_prompt,
            access_model: payload.model,
            system_prompt,
        }) as ProviderEnvelope;
    }
}
