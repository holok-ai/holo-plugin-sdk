import {BaseProvider} from '@holokai/sdk/provider';
import type {IAuditor, IProviderTranslator, IResponseFactory, ProviderContext} from '@holokai/types/provider';
import {pickHeadersByPrefix} from '@holokai/sdk';
import {Anthropic} from '@anthropic-ai/sdk/client';
import {MessageCreateParamsBase} from '@anthropic-ai/sdk/resources/messages';
import {ModelInfosPage} from '@anthropic-ai/sdk/resources/models';
import {ClaudeAuditor} from './claude.auditor';
import {Message, MessageCountTokensParams, RawMessageStreamEvent} from '@anthropic-ai/sdk/resources/messages/messages';
import {ClaudeTranslator} from './claude.translator';
import {ClaudeResponseFactory} from './claude.response.factory';
import {APIError} from "@anthropic-ai/sdk";
import {ErrorObject, ErrorResponse} from "@anthropic-ai/sdk/resources/shared";
import {ClaudeProtocols} from "./plugin";

export class ClaudeProvider extends BaseProvider<Anthropic, MessageCreateParamsBase | MessageCountTokensParams> {

    async getModels(allowedModels: string[] | true): Promise<ModelInfosPage> {
        const response = await this.client.models.list({limit: 100});
        if (allowedModels === true) {
            return response;
        }

        response.data = response.data.filter(model => allowedModels.includes(model.id));
        return response;
    }

    async getModelNameFromRequest(payload: MessageCreateParamsBase | MessageCountTokensParams): Promise<string> {
        return payload.model;
    }

    protected createAuditor(): IAuditor {
        return new ClaudeAuditor();
    }

    protected createClient(): Anthropic {
        return new Anthropic(this._config);
    }

    protected createTranslator(): IProviderTranslator {
        return ClaudeTranslator.instance();
    }

    protected createResponseFactory(): IResponseFactory {
        return ClaudeResponseFactory.instance();
    }

    protected async createRequestRunner(payload: MessageCreateParamsBase | MessageCountTokensParams, ctx: ProviderContext) {
        const headers = ctx.headers ? pickHeadersByPrefix(ctx.headers, ['anthropic-']) : [];
        const options = {
            headers
        };

        switch (ctx.protocol.name) {
            case ClaudeProtocols.COUNT_TOKENS:
                const tokenParams = payload as MessageCountTokensParams;
                return {
                    start: async () => {
                        this.client.messages.countTokens(tokenParams)
                    }
                };
            default:
                const messageParams = payload as MessageCreateParamsBase;
                if (messageParams.stream) {
                    const s = this.client.messages.stream(messageParams, options);
                    s.on('streamEvent', (event: RawMessageStreamEvent, _snapshot: Message) => ctx.emitStreamEvent(event));
                    s.on('text', (delta: string) => ctx.emitTextDelta(delta));
                    return {start: () => s.finalMessage()};
                }

                // Non-streaming
                const req = {...messageParams, stream: false};
                return {
                    start: async () => {
                        const result = await this.client.messages.create(req, options) as Message;
                        const text = result.content
                            ?.filter((block: any) => block.type === "text")
                            .map((block: any) => block.text)
                            .join("\n");
                        ctx.emitTextDelta(text);
                        return result;
                    }
                };
        }
    }

    protected async handleError(error: APIError): Promise<ErrorResponse> {
        if (error.error) {
            return {
                type: 'error',
                request_id: error.requestID ?? null,
                error: error.error as ErrorObject
            }
        }
        return this.responseFactory.createError(error.message, 'api_error');
    }
}