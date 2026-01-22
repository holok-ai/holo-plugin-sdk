import OpenAI from 'openai';
import {BaseProvider, IAuditor, IProviderTranslator, ProviderContext, RequestType, RunHandle} from "@holokai/sdk";
import {ResponseCreateParamsBase} from "openai/resources/responses/responses";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";
import {OpenAIAuditor} from "./openai.auditor";
import {ModelsPage} from "openai/resources/models";
import {OpenAITranslator} from "./openai.translator";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends BaseProvider<OpenAI, ResponseCreateParamsBase | ChatCompletionCreateParamsBase> {

    protected createAuditor(): IAuditor {
        return new OpenAIAuditor();
    }

    protected createClient(): OpenAI {
        return new OpenAI(this._config);
    }

    protected createTranslator(): IProviderTranslator {
        return OpenAITranslator.Instance();
    }

    async getModels(allowedModels: string[] | true): Promise<ModelsPage> {
        const response = await this.client.models.list();
        if (allowedModels === true) {
            return response;
        }

        response.data = response.data.filter(model => allowedModels.includes(model.id));
        return response;
    }

    protected async handleRequest(
        payload: ResponseCreateParamsBase | ChatCompletionCreateParamsBase,
        ctx: ProviderContext
    ): Promise<RunHandle<any>> {
        switch (ctx.requestType) {
            case RequestType.RESPONSES:
                return this.runResponses(payload as ResponseCreateParamsBase, ctx);
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
                    return this.client.responses.create({...req, stream: false} as any);
                },
            };
        }

        const finalPromise = (async () => {
            const stream = await this.client.responses.create({...req, stream: true} as any);

            let terminalEvent: any = null;
            let responseId: string | null = null;
            let usage: any = null;
            let status: string | null = null;

            for await (const event of stream as any) {
                ctx.emitStreamEvent(event);

                // Often you can capture id/status as they appear
                if (event?.response?.id) responseId = event.response.id;
                if (event?.response?.status) status = event.response.status;
                if (event?.response?.usage) usage = event.response.usage;

                if (event?.type === "response.output_text.delta" && typeof event.delta === "string") {
                    ctx.emitTextDelta(event.delta);
                }

                if (
                    event?.type === "response.completed" ||
                    event?.type === "response.failed" ||
                    event?.type === "response.incomplete" ||
                    event?.type === "error"
                ) {
                    terminalEvent = event;
                }
            }

            // Return something meaningful
            return {
                responseId,
                status,
                usage,
                terminalEvent,
            };
        })();

        return {final: () => finalPromise};
    }

    // --- Chat Completions API ---
    private async runChatCompletions(
        req: ChatCompletionCreateParamsBase,
        ctx: ProviderContext
    ): Promise<RunHandle<any>> {
        if (!req.stream) {
            return {
                final: async () => {
                    return this.client.chat.completions.create({...req, stream: false});
                },
            };
        }

        const streamingReq: any = {
            ...req,
            stream: true,
            stream_options: {include_usage: true},
        };

        const finalPromise = (async () => {
            const stream = await this.client.chat.completions.create(streamingReq);

            let finalChunk: any = null;

            for await (const chunk of stream as any) {
                ctx.emitStreamEvent(chunk);

                const delta = chunk?.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length) {
                    ctx.emitTextDelta(delta);
                }

                if (chunk?.usage) finalChunk = chunk;
            }

            return finalChunk ?? {ok: true};
        })();

        return {final: () => finalPromise};
    }

}
