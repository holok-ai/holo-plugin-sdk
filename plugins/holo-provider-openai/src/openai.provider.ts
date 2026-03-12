import OpenAI from 'openai';
import {BaseProvider} from '@holokai/sdk/provider';
import type {IAuditor, IProviderTranslator, IResponseFactory} from '@holokai/types/provider';
import {ProviderContext, RunHandle} from '@holokai/types/provider';
import {ResponseCreateParamsBase, ResponseErrorEvent, ResponseStreamEvent} from 'openai/resources/responses/responses';
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions';
import {OpenAIAuditor} from './openai.auditor';
import {Model, ModelsPage} from 'openai/resources/models';
import {OpenAITranslator} from './openai.translator';
import {OpenAIResponseFactory} from './openai.response.factory';
import {APIError} from "openai/core/error";
import {ChatCompletionCreateParamsStreaming} from "openai/resources/chat/completions/completions";
import {Stream} from "openai/core/streaming";
import {EmbeddingCreateParams} from "openai/resources";
import {OpenAIProtocols} from "./plugin";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends BaseProvider<OpenAI, ResponseCreateParamsBase | ChatCompletionCreateParamsBase> {

    async getModels(allowedModels: string[] | true): Promise<{ object: string, data: Model[] }> {
        const response = await this.client.models.list() as ModelsPage;
        if (allowedModels === true) {
            return response;
        }
        const data = response.data.filter(model => allowedModels.includes(model.id));

        return {
            object: response.object,
            data
        };
    }

    async getModelNameFromRequest(payload: ResponseCreateParamsBase | ChatCompletionCreateParamsBase): Promise<string | undefined> {
        return payload.model;
    }

    async runEmbed(payload: EmbeddingCreateParams) {
        return {
            final: async () => this.client.embeddings.create(payload)
        }
    }

    protected createAuditor(): IAuditor {
        return new OpenAIAuditor();
    }

    protected createClient(): OpenAI {
        this.log.info(JSON.stringify(this._config));
        return new OpenAI(this._config);
    }

    protected createTranslator(): IProviderTranslator {
        return OpenAITranslator.instance();
    }

    protected createResponseFactory(): IResponseFactory {
        return OpenAIResponseFactory.instance();
    }

    protected async handleError(error: APIError): Promise<ResponseErrorEvent> {
        if (error.error) {
            // may need to validate what the error is
            return error.error as ResponseErrorEvent;
        }

        return this.responseFactory.createError(error.message, error.code ? error.code : undefined);
    }

    protected async handleRequest(
        payload: ResponseCreateParamsBase | ChatCompletionCreateParamsBase | EmbeddingCreateParams,
        ctx: ProviderContext
    ): Promise<RunHandle<any>> {
        switch (ctx.protocol.name) {
            case OpenAIProtocols.RESPONSES:
                return this.runResponses(payload as ResponseCreateParamsBase, ctx);
            case OpenAIProtocols.EMBED:
                return this.runEmbed(payload as EmbeddingCreateParams);
            default:
                return this.runChatCompletions(payload as ChatCompletionCreateParamsBase, ctx);
        }
    }

    // --- Responses API ---
    private async runResponses(
        req: ResponseCreateParamsBase,
        ctx: ProviderContext
    ): Promise<RunHandle<any>> {
        if (!req.stream) {
            return {
                final: async () => {
                    return this.client.responses.create({...req, stream: false});
                },
            };
        }

        const finalPromise = (async () => {
            const stream = await this.client.responses.create({
                ...req,
                stream: true
            } as ResponseCreateParamsBase) as Stream<ResponseStreamEvent>;

            let finalChunk;

            for await (const event of stream) {
                if (
                    event.type === 'response.completed' ||
                    event.type === 'response.failed' ||
                    event.type === 'response.incomplete' ||
                    event.type === 'error'
                ) {
                    finalChunk = event;
                    break;
                }
                ctx.emitStreamEvent(event);

                if (event.type === 'response.output_text.delta') {
                    ctx.emitTextDelta(event.delta);
                }
            }

            return finalChunk;
        })();

        return {final: () => finalPromise};
    }

    // --- Chat Completions API ---
    private async runChatCompletions(
        req: ChatCompletionCreateParamsBase,
        ctx: ProviderContext
    ) {
        if (!req.stream) {
            return {
                final: async () => {
                    return this.client.chat.completions.create({...req, stream: false});
                },
            };
        }

        const streamingReq = req as ChatCompletionCreateParamsStreaming;

        this.client.chat.completions.create(streamingReq);
        const includesUsage = streamingReq.stream_options?.include_usage === true

        const finalPromise = (async () => {
            const stream = await this.client.chat.completions.create(streamingReq);

            let finalChunk;
            for await (const chunk of stream) {
                if ((includesUsage && !!chunk.usage) ||
                    (!includesUsage && !!chunk.choices?.[0]?.finish_reason)) {
                    finalChunk = chunk;
                    break;
                }
                const delta = chunk.choices?.[0]?.delta?.content;
                ctx.emitStreamEvent(chunk);
                if (typeof delta === 'string' && delta.length) {
                    ctx.emitTextDelta(delta);
                }
            }
            return finalChunk;
        })();

        return {final: () => finalPromise};
    }

}
