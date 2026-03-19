import {injectable} from 'tsyringe';
import {countTokens, extractPromptByRole, extractTextContent, normalizeText, pickDefined} from "@holokai/sdk";
import {BaseAuditor} from "@holokai/sdk/provider";
import {HoloWorkerRequest, WorkerResponseEnvelope} from "@holokai/types/worker";
import {ProviderDoneEvent, ProviderEvent} from "@holokai/types/provider";
import {FinishReason, ProviderEnvelope, ProviderResponseMetrics, ProviderResponseStatus} from "@holokai/types/entities";
import {ChatCompletionChunk, ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {ResponseCompletedEvent, ResponseCreateParamsBase} from "openai/resources/responses/responses";
import {OpenAIProtocols} from "./plugin";

@injectable()
export class OpenAIAuditor extends BaseAuditor {
    readonly provider = 'openai';

    protected async extractRequestOptions(workerRequest: HoloWorkerRequest): Promise<Record<string, any>> {
        let options: Record<string, any>;

        if (workerRequest.protocol.name === OpenAIProtocols.RESPONSES) {
            const payload = workerRequest.payload as ResponseCreateParamsBase;

            const {
                max_output_tokens,
                metadata,
                prompt_cache_key,
                prompt_cache_retention,
                safety_identifier,
                stream,
                stream_options,
                temperature,
                tool_choice,
                tools,
                top_p
            } = payload;

            options = pickDefined({
                max_output_tokens,
                metadata,
                prompt_cache_key,
                prompt_cache_retention,
                safety_identifier,
                stream,
                stream_options,
                temperature,
                tool_choice,
                tools,
                top_p
            });
        } else {
            const payload = workerRequest.payload as ChatCompletionCreateParamsBase;

            const {
                frequency_penalty,
                logit_bias,
                logprobs,
                max_completion_tokens,
                max_tokens,
                n,
                parallel_tool_calls,
                presence_penalty,
                response_format,
                safety_identifier,
                seed,
                stop,
                stream,
                stream_options,
                temperature,
                tool_choice,
                tools,
                top_logprobs,
                top_p,
                user,
            } = payload;

            options = pickDefined({
                frequency_penalty,
                logit_bias,
                logprobs,
                max_completion_tokens,
                max_tokens,
                n,
                parallel_tool_calls,
                presence_penalty,
                response_format,
                safety_identifier,
                seed,
                stop,
                stream,
                stream_options,
                temperature,
                tool_choice,
                tools,
                top_logprobs,
                top_p,
                user,
            });
        }

        return options;
    }

    protected async mapProviderResponseMetrics(providerEvent: ProviderDoneEvent, protocolName: string): Promise<Partial<ProviderResponseMetrics>> {
        if (protocolName === OpenAIProtocols.RESPONSES) {
            const usage = (providerEvent.message as ResponseCompletedEvent).response.usage;
            if (!usage) return {};
            const {input_tokens, output_tokens, total_tokens} = usage;

            if (!usage) return {};
            return pickDefined({
                input_tokens,
                output_tokens,
                total_tokens,
                usage_raw: usage
            }) as Partial<ProviderResponseMetrics>;
        } else if (protocolName === OpenAIProtocols.CHAT_COMPLETIONS) {
            const payload = providerEvent.message as ChatCompletionChunk;
            const usage = payload.usage;
            if (!usage) return {};

            return pickDefined({
                input_tokens: usage.prompt_tokens,
                output_tokens: usage.completion_tokens,
                total_tokens: usage.total_tokens,
                usage_raw: usage
            }) as Partial<ProviderResponseMetrics>;
        }
        return {};
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent, envelope: WorkerResponseEnvelope): Promise<ProviderResponseStatus> {
        if (providerEvent.type === 'done'
        ) {
            const payload = providerEvent.message;
            const choice = payload.choices?.[0];
            if (choice?.finish_reason) {
                if (choice.finish_reason === 'length') {
                    return ProviderResponseStatus.PARTIAL;
                } else if (choice.finish_reason === 'content_filter') {
                    return ProviderResponseStatus.ERROR;
                }
            }
        }
        return super.mapResponseStatus(providerEvent, envelope);
    }

    protected async extractFinishReason(providerEvent: ProviderEvent, _envelope: WorkerResponseEnvelope): Promise<FinishReason | undefined> {
        if (providerEvent.type === 'error'
        )
            return FinishReason.ERROR;
        if (providerEvent.type !== 'done') return undefined;

        const message = providerEvent.message;

        if (message?.response) {
            const status = message.response.status;
            if (status === 'failed') return FinishReason.ERROR;
            if (status === 'incomplete') return FinishReason.LENGTH;
            const hasToolCalls = message.response.output?.some((item: any) => item.type === 'function_call');
            return hasToolCalls ? FinishReason.TOOL_CALLS : FinishReason.STOP;
        }

        const finishReason = message?.choices?.[0]?.finish_reason;
        switch (finishReason) {
            case 'tool_calls':
                return FinishReason.TOOL_CALLS;
            case 'length':
                return FinishReason.LENGTH;
            case 'content_filter':
                return FinishReason.CONTENT_FILTER;
            default:
                return FinishReason.STOP;
        }
    }

    protected estimateInputTokens(envelope: WorkerResponseEnvelope):
        number | undefined {
        const payload = envelope.payload as ResponseCreateParamsBase | ChatCompletionCreateParamsBase | undefined;
        if (!payload) return undefined;
        try {
            if ('input' in payload && payload.input) {
                return countTokens(typeof payload.input === 'string' ? payload.input : JSON.stringify(payload.input));
            }
            if ('messages' in payload && payload.messages) {
                return countTokens(JSON.stringify(payload.messages));
            }
        } catch { /* fallthrough */
        }
        return undefined;
    }

    protected async createProviderEnvelope(workerRequest: HoloWorkerRequest): Promise<ProviderEnvelope> {
        let last_user_prompt
            :
            string | null = null;
        let system_prompt: string | null = null;
        let access_model: string | undefined;

        if (workerRequest.protocol.name === OpenAIProtocols.RESPONSES) {
            const payload = workerRequest.payload as ResponseCreateParamsBase;
            access_model = payload.model;

            const input = payload.input;

            last_user_prompt =
                typeof input === 'string'
                    ? normalizeText(input)
                    : extractPromptByRole(
                        input as any[] | undefined,
                        'user',
                        'last',
                        (msg) => extractTextContent(msg.content),
                    );

            system_prompt =
                workerRequest.systemPrompt?.system_prompt ??
                (typeof payload.instructions === 'string'
                    ? normalizeText(payload.instructions)
                    : extractPromptByRole(
                        input as any[] | undefined,
                        'system',
                        'first',
                        (msg) => extractTextContent(msg.content),
                    ));
        } else {
            const payload = workerRequest.payload as ChatCompletionCreateParamsBase;
            access_model = payload.model;

            const messages = payload.messages;

            last_user_prompt = extractPromptByRole(
                messages as any[] | undefined,
                'user',
                'last',
                (msg) => extractTextContent(msg.content),
            );

            system_prompt =
                workerRequest.systemPrompt?.system_prompt ??
                extractPromptByRole(
                    messages as any[] | undefined,
                    'system',
                    'first',
                    (msg) => extractTextContent(msg.content),
                );
        }

        return pickDefined({
            last_user_prompt,
            system_prompt,
            access_model,
        }) as ProviderEnvelope;
    }
}
