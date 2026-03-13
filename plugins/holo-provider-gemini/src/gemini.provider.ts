import {BaseProvider} from '@holokai/sdk/provider';
import type {IAuditor, IProviderTranslator, IResponseFactory, ProviderContext} from '@holokai/types/provider';
import {GoogleGenAI} from '@google/genai';
import {GeminiAuditor} from './gemini.auditor.js';
import {GeminiTranslator} from './gemini.translator.js';
import {GeminiResponseFactory, GeminiErrorResponse, GeminiErrorStatus} from './gemini.response.factory.js';
import {GeminiProtocols} from './plugin.js';

export class GeminiProvider extends BaseProvider<GoogleGenAI, any> {

    async getModels(allowedModels: string[] | true): Promise<any> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this._config.apiKey}`;
        const res = await fetch(url);
        const data = await res.json() as { models?: any[] };
        const response = data.models ?? [];

        if (allowedModels === true) {
            return response;
        }

        return response.filter(model =>
            allowedModels.includes(model.name?.replace('models/', '') ?? '')
        );
    }

    async getModelNameFromRequest(payload: any): Promise<string> {
        return payload.model;
    }

    protected createAuditor(): IAuditor {
        return new GeminiAuditor();
    }

    protected createClient(): GoogleGenAI {
        return new GoogleGenAI({apiKey: this._config.apiKey});
    }

    protected createTranslator(): IProviderTranslator {
        return GeminiTranslator.instance();
    }

    protected createResponseFactory(): IResponseFactory {
        return GeminiResponseFactory.instance();
    }

    protected async handleRequest(payload: any, ctx: ProviderContext) {
        switch (ctx.protocol.name) {
            case GeminiProtocols.EMBED_CONTENT: {
                return {
                    final: () => this.client.models.embedContent({
                        model: payload.model,
                        contents: payload.contents
                    })
                };
            }
            case GeminiProtocols.STREAM_GENERATE_CONTENT:
            default: {
                const {model, contents, config} = payload;
                const isStreaming = ctx.query?.alt === 'sse' || payload.stream === true;

                if (isStreaming) {
                    const stream = await this.client.models.generateContentStream({
                        model,
                        contents,
                        config
                    });

                    const finalPromise = (async () => {
                        let finalResponse: any;
                        for await (const chunk of stream) {
                            ctx.emitStreamEvent(chunk);
                            finalResponse = chunk;

                            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                ctx.emitTextDelta(text);
                            }
                        }
                        return finalResponse;
                    })();

                    return {
                        final: () => finalPromise
                    };
                }

                return {
                    final: () => this.client.models.generateContent({
                        model,
                        contents,
                        config
                    })
                };
            }
        }
    }

    protected async handleError(error: any): Promise<GeminiErrorResponse> {
        if (error.status && error.statusText) {
            return {
                error: {
                    code: error.status,
                    message: error.message || error.statusText,
                    status: this.mapHttpStatusToGeminiStatus(error.status)
                }
            };
        }
        return this.responseFactory.createError(error.message, 'api_error');
    }

    private mapHttpStatusToGeminiStatus(status: number): GeminiErrorStatus {
        switch (status) {
            case 400: return 'INVALID_ARGUMENT';
            case 401: return 'UNAUTHENTICATED';
            case 403: return 'PERMISSION_DENIED';
            case 404: return 'NOT_FOUND';
            case 429: return 'RESOURCE_EXHAUSTED';
            case 503: return 'UNAVAILABLE';
            default: return 'INTERNAL';
        }
    }
}
