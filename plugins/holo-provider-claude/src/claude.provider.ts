import {BaseProvider, IAuditor, IProviderTranslator, IResponseFactory, ProviderContext} from '@holokai/sdk';
import {Anthropic} from '@anthropic-ai/sdk/client';
import {MessageCreateParamsBase} from '@anthropic-ai/sdk/resources/messages';
import {ModelInfosPage} from '@anthropic-ai/sdk/resources/models';
import {ClaudeAuditor} from './claude.auditor';
import {Message} from '@anthropic-ai/sdk/resources/messages/messages';
import {ClaudeTranslator} from './claude.translator';
import {ClaudeResponseFactory} from './claude.response.factory';
import {APIError} from "@anthropic-ai/sdk";
import {ErrorObject, ErrorResponse} from "@anthropic-ai/sdk/resources/shared";

export class ClaudeProvider extends BaseProvider<Anthropic, MessageCreateParamsBase> {

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

    async getModels(allowedModels: string[] | true): Promise<ModelInfosPage> {
        const response = await this.client.models.list({limit: 100});
        if (allowedModels === true) {
            return response;
        }

        response.data = response.data.filter(model => allowedModels.includes(model.id));
        return response;
    }

    protected async handleRequest(payload: MessageCreateParamsBase, ctx: ProviderContext) {
        if (payload.stream) {
            const s = this.client.messages.stream(payload);
            s.on('streamEvent', (event: any) => ctx.emitStreamEvent(event));
            s.on('text', (delta: string) => ctx.emitTextDelta(delta));
            return {final: () => s.finalMessage()};
        }

        // Non-streaming
        const req = {...payload, stream: false};
        return {final: () => this.client.messages.create(req) as Promise<Message>};
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