import type {IAuditor, IProvider, IProviderTranslator, IResponseFactory, ProviderRunner} from "@holokai/types/provider";
import {ModelInfo, ProviderContext, ProviderEvent} from "@holokai/types/provider";
import {HoloWorkerRequest, WorkerRequestEnvelope} from "@holokai/types/worker";
import {ProviderRequest, ProviderResponse} from "@holokai/types/entities";
import {AsyncEventQueue, ClassLogger, filterForwardableHeaders, pickDefined, pickHeadersByPrefix} from "../core";
import {IProviderPlugin} from "@holokai/types";

export abstract class BaseProvider<ProviderClient = any, RequestPayload = any, Final = any> extends ClassLogger implements IProvider {
    public readonly auditor: IAuditor;
    public readonly translator: IProviderTranslator;
    public readonly responseFactory: IResponseFactory;
    protected models: Record<string, ModelInfo> = {};
    protected readonly client: ProviderClient;

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly plugin: IProviderPlugin,
        protected readonly _config: any
    ) {
        super();

        this.client = this.createClient();
        this.auditor = this.createAuditor();
        this.translator = this.createTranslator();
        this.responseFactory = this.createResponseFactory();
    }

    abstract getModels(allowedModels: string[] | true): Promise<any>;

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest> {
        return this.auditor.auditRequest(workerRequest);
    }

    async auditResponse(
        workerEnvelope: WorkerRequestEnvelope,
        providerEvent: ProviderEvent
    ): Promise<ProviderResponse> {
        return this.auditor.auditResponse(workerEnvelope, providerEvent);
    }

    async processWorkerRequest(
        request: HoloWorkerRequest,
        _opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>> {
        const q = new AsyncEventQueue<ProviderEvent>();

        if (request.isPassthrough) {
            return this.handlePassthrough(request, q);
        }

        const {requestId, protocol, payload, rawRequest} = request;
        const requestPayload = payload as RequestPayload;

        const start = Date.now();
        let fullText = "";

        const metrics = {
            timeToFirstToken: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalProcessingTime: 0,
        };

        const push = this.createEventPusher(q, requestId);

        const ctx = pickDefined({
            protocol,
            headers: rawRequest.headers,
            query: rawRequest.query,
            emitStreamEvent: (event: any) =>
                push({type: "stream_event", event} as ProviderEvent),
            emitTextDelta: (text: string) => {
                if (!metrics.timeToFirstToken) metrics.timeToFirstToken = Date.now() - start;
                fullText += text;
                push({type: "text_delta", text} as ProviderEvent);
            },
        }) as ProviderContext;

        let run: ProviderRunner<Final>;

        try {
            run = await this.handleRequest(requestPayload, ctx);
        } catch (e: any) {
            push({type: "error", error: await this.handleError(e)} as ProviderEvent);
            q.end();
            return q;
        }

        // IMPORTANT: do not await here — return q immediately for streaming
        void (async () => {
            try {
                const final = await run.final();
                metrics.totalProcessingTime = Date.now() - start;

                push({
                    type: "done",
                    message: final,
                    text: fullText.length ? fullText : JSON.stringify(final),
                    metrics
                } as ProviderEvent);
            } catch (e: any) {
                push({type: "error", error: await this.handleError(e)} as ProviderEvent);
            } finally {
                q.end();
            }
        })();

        return q;
    }

    public abstract getModelNameFromRequest(payload: any): Promise<string | undefined>

    protected abstract createClient(): ProviderClient;

    protected abstract createAuditor(): IAuditor;

    protected abstract createTranslator(): IProviderTranslator;

    protected abstract createResponseFactory(): IResponseFactory

    protected abstract handleError(error: any): Promise<any>;

    protected abstract handleRequest(
        payload: RequestPayload,
        ctx: ProviderContext
    ): Promise<ProviderRunner<Final>>;

    protected getHeaders(request: HoloWorkerRequest, config: any): Record<string, string> {
        const headers: Record<string, string> = {
            ...filterForwardableHeaders(request.rawRequest.headers),
            ...pickHeadersByPrefix(request.rawRequest.headers, [this.name.toLowerCase() + '-']),
        };

        if (config.apiKey) {
            headers['authorization'] = `Bearer ${config.apiKey}`;
        }

        return headers;
    }

    private createEventPusher(q: AsyncEventQueue<ProviderEvent>, requestId: string) {
        let seq = 0;
        return (ev: Omit<ProviderEvent, "requestId" | "seq" | "ts">) => {
            q.push({...ev, requestId, seq: seq++, ts: Date.now()} as ProviderEvent);
        };
    }

    private async handlePassthrough(
        request: HoloWorkerRequest,
        q: AsyncEventQueue<ProviderEvent>
    ): Promise<AsyncEventQueue<ProviderEvent>> {
        const {requestId, passthroughPath, rawRequest, payload} = request;
        const start = Date.now();
        const push = this.createEventPusher(q, requestId);

        void (async () => {
            try {
                const config = this._config;

                if (!config?.baseUrl) {
                    push({
                        type: "error",
                        error: {message: 'Provider config missing baseUrl'},
                        status: 500
                    } as ProviderEvent);
                    q.end();
                    return;
                }

                const queryString = new URLSearchParams(rawRequest.query as any).toString();
                const targetUrl = `${config.baseUrl}${passthroughPath}${queryString ? '?' + queryString : ''}`;

                const fetchResponse = await fetch(targetUrl, {
                    method: rawRequest.method,
                    headers: this.getHeaders(request, config),
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(config.timeout || 120000)
                });

                const contentType = fetchResponse.headers.get('content-type') || '';
                const isStreaming = contentType.includes('text/event-stream') || contentType.includes('stream');

                if (isStreaming && fetchResponse.body) {
                    const reader = fetchResponse.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                        const {done, value} = await reader.read();
                        if (done) break;
                        push({
                            type: "stream_event",
                            event: {raw: decoder.decode(value, {stream: true})}
                        } as ProviderEvent);
                    }
                } else {
                    const responseText = await fetchResponse.text();
                    push({
                        type: "done",
                        message: JSON.parse(responseText),
                        text: responseText,
                        metrics: {
                            timeToFirstToken: 0,
                            inputTokens: 0,
                            outputTokens: 0,
                            totalProcessingTime: Date.now() - start
                        }
                    } as ProviderEvent);
                    q.end();
                    return;
                }

                push({
                    type: "done",
                    message: {status: 'completed'},
                    text: '',
                    metrics: {
                        timeToFirstToken: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                        totalProcessingTime: Date.now() - start
                    }
                } as ProviderEvent);
            } catch (error) {
                push({type: "error", error: {message: (error as Error).message}, status: 500} as ProviderEvent);
            } finally {
                q.end();
            }
        })();

        return q;
    }
}