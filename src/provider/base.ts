import type {
    DiscoveredModel,
    IAuditor,
    IProvider,
    IProviderTranslator,
    IResponseFactory,
    ProviderEventMetrics,
    ProviderRunner
} from "@holokai/holo-types/provider";
import {ModelInfo, ProviderContext, ProviderEvent} from "@holokai/holo-types/provider";
import {HoloWorkerRequest} from "@holokai/holo-types/worker";
import {ProtocolCapability, ProviderRequest, ProviderResponse} from "@holokai/holo-types/entities";
import {AsyncEventQueue, ClassLogger, countTokens, pickDefined} from "../core";
import {HoloResponse, IProviderPlugin, WorkerResponseEnvelope} from "@holokai/holo-types";

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

    abstract discoverModels(): Promise<DiscoveredModel[]>;

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest> {
        return this.auditor.auditRequest(workerRequest);
    }

    async auditResponse(
        workerEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<ProviderResponse> {
        return this.auditor.auditResponse(workerEnvelope, providerEvent);
    }

    async processWorkerRequest(
        request: HoloWorkerRequest,
        _opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>> {
        const q = new AsyncEventQueue<ProviderEvent>();

        const {requestId, protocol, payload, httpRequestDetails} = request;
        const requestPayload = request.isHoloNative
            ? await this.translatePayload(protocol?.capability, payload, protocol?.name) as RequestPayload
            : payload as RequestPayload;

        let fullText = "";

        const metrics: ProviderEventMetrics = {
            startTime: Date.now(),
            timeToFirstToken: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalProcessingTime: 0,
        };

        const push = this.createEventPusher(q, requestId);

        const query = {...(httpRequestDetails?.query ?? {})};
        if (request.isHoloNative && request.isStreaming) {
            query.alt = 'sse';
            query.stream = 'true';
        }

        const ctx = pickDefined({
            protocol,
            headers: httpRequestDetails?.headers,
            query,
            emitStreamEvent: (event: any) =>
                push({type: "stream_event", event} as ProviderEvent),
            emitTextDelta: (text?: string | null) => {
                if (metrics.timeToFirstToken === 0) {
                    metrics.firstTime = Date.now();
                    metrics.timeToFirstToken = metrics.firstTime - metrics.startTime;
                }
                if (text != null) {
                    fullText += text;
                    push({type: "text_delta", text} as ProviderEvent);
                }
            },
            emitToolCallDelta: (index: number, delta: { id?: string; name?: string; arguments_delta?: string }) =>
                push({type: "tool_call_delta", index, delta} as ProviderEvent),
        }) as ProviderContext;

        let runner: ProviderRunner<Final>;

        try {
            runner = await this.createRequestRunner(requestPayload, ctx);
        } catch (e: any) {
            metrics.endTime = Date.now();
            metrics.totalProcessingTime = metrics.endTime - metrics.startTime;
            metrics.outputTokens = countTokens(fullText);
            const handledError = await this.handleError(e);
            push({
                type: "error",
                error: handledError,
                text: (e as Error).message,
                status: this.getErrorStatus(e, handledError),
                headers: e?.headers,
                metrics,
                acc: fullText
            } as ProviderEvent);
            q.end();
            return q;
        }

        // IMPORTANT: do not await here — return q immediately for streaming
        void (async () => {
            try {
                const final = await runner.start();
                if (metrics.timeToFirstToken === 0) {
                    metrics.firstTime = Date.now();
                    metrics.timeToFirstToken = metrics.firstTime - metrics.startTime;
                }
                metrics.endTime = Date.now();
                metrics.totalProcessingTime = metrics.endTime - metrics.startTime;
                metrics.outputTokens = countTokens(fullText);

                if (request.isHoloNative && protocol?.capability === ProtocolCapability.EMBED && this.translator.toHoloEmbedResponse) {
                    const normalized = await this.translator.toHoloEmbedResponse(final);
                    push({type: "done", message: normalized, text: '', metrics} as ProviderEvent);
                } else {
                    if (!fullText && request.isHoloNative && final) {
                        try {
                            const translated = await this.translator.toHoloResponse(final);
                            const extractedText = (translated.output ?? [])
                                .filter((m: any) => m.role === 'assistant')
                                .map((m: any) => typeof m.content === 'string' ? m.content : '')
                                .join('');
                            if (extractedText) fullText = extractedText;
                        } catch { /* best-effort fallback */
                        }
                    }

                    const holoResponse: HoloResponse | undefined = (request.isHoloNative && !request.isStreaming) ? {
                        id: requestId,
                        model: await this.getModelNameFromRequest(requestPayload) ?? '',
                        output: fullText ? [{role: 'assistant', content: fullText}] : [],
                        created: Date.now(),
                        finish_reason: this.auditor.mapFinishReason(final, protocol?.name),
                        usage: this.auditor.mapUsage(final, protocol?.name),
                    } : undefined;

                    push({
                        type: "done",
                        message: final,
                        text: fullText,
                        holoResponse,
                        metrics
                    } as ProviderEvent);
                }
            } catch (e: any) {
                metrics.endTime = Date.now();
                metrics.totalProcessingTime = metrics.endTime - metrics.startTime;
                metrics.outputTokens = countTokens(fullText);
                const handledError = await this.handleError(e);
                push({
                    type: "error",
                    error: handledError,
                    text: (e as Error).message,
                    status: this.getErrorStatus(e, handledError),
                    headers: e?.headers,
                    metrics
                } as ProviderEvent);
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

    protected getErrorStatus(e: any, handledError: any): number | undefined {
        return e?.status ?? e?.statusCode ?? handledError?.error?.code;
    }

    protected abstract createRequestRunner(
        payload: RequestPayload,
        ctx: ProviderContext
    ): Promise<ProviderRunner<Final>>;

    protected async translatePayload(capability: ProtocolCapability | undefined, payload: any, _protocolName?: string): Promise<any> {
        switch (capability) {
            case ProtocolCapability.GENERATE:
                if (this.translator.fromHoloGenerateRequest) {
                    return this.translator.fromHoloGenerateRequest(payload);
                }
                break;
            case ProtocolCapability.EMBED:
                if (this.translator.fromHoloEmbedRequest) {
                    return this.translator.fromHoloEmbedRequest(payload);
                }
                break;
            case ProtocolCapability.METRICS:
                if (this.translator.fromHoloCountTokensRequest) {
                    return this.translator.fromHoloCountTokensRequest(payload);
                }
                break;
        }
        return this.translator.fromHoloRequest(payload);
    }

    private createEventPusher(q: AsyncEventQueue<ProviderEvent>, requestId: string) {
        let seq = 0;
        return (ev: Omit<ProviderEvent, "requestId" | "seq" | "ts">) => {
            q.push({...ev, requestId, seq: seq++, ts: Date.now()} as ProviderEvent);
        };
    }
}