import OpenAI from 'openai';
import {BaseProvider, ModelInfo, ProviderContext, RequestType, RunHandle} from "@holokai/sdk";
import {ResponseCreateParamsBase} from "openai/resources/responses/responses";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends BaseProvider {
    protected readonly client: OpenAI;

    // need to initialize client on constructor since blank OpenAI will throw error
    constructor(
        public readonly name: string,
        public readonly family: string,
        public readonly version: string,
        protected readonly _config: any) {
        super(name, family, version, _config);
        this.client = new OpenAI(this._config);
    }

    async getModels(): Promise<ModelInfo[]> {
        const logger = this.mlog(this.getModels);
        try {
            const response = await this.client.models.list();
            const modelList = response.data.map(model => ({
                id: model.id,
                name: model.id,
                modified_at: new Date(model.created * 1000).toISOString()
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`OpenAI models: ${Object.keys(this.models)}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching OpenAI models: ${(error as Error).message}`);
            throw error;
        }
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
