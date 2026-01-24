import {AsyncEventQueue, IProvider, IResponseFactory, ModelInfo, ProviderContext, ProviderEvent} from "./types";
import {HoloWorkerRequest, WorkerRequestEnvelope} from "../core/worker";
import {ClassLogger} from "@holokai/sdk/core";
import {IAuditor} from "./auditor";
import {IProviderTranslator} from "./translator";
import {LlmRequest, LlmResponse} from "../core/entities";


export type ProviderRunner<Final = any> = { final: () => Promise<Final>; cancel?: () => void };

export abstract class BaseProvider<ProviderClient = any, RequestPayload = any, Final = any> extends ClassLogger implements IProvider {
    protected models: Record<string, ModelInfo> = {};
    protected readonly client: ProviderClient;
    public readonly auditor: IAuditor;
    public readonly translator: IProviderTranslator;
    public readonly responseFactory: IResponseFactory;

    constructor(
        public readonly name: string,
        public readonly family: string,
        public readonly version: string,
        protected readonly _config: any
    ) {
        super();

        this.client = this.createClient();
        this.auditor = this.createAuditor();
        this.translator = this.createTranslator();
        this.responseFactory = this.createResponseFactory();
    }

    protected abstract createClient(): ProviderClient;

    protected abstract createAuditor(): IAuditor;

    protected abstract createTranslator(): IProviderTranslator;

    protected abstract createResponseFactory(): IResponseFactory

    abstract getModels(allowedModels: string[] | true): Promise<any>;

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<LlmRequest> {
        return this.auditor.auditRequest(workerRequest);
    }

    async auditResponse(
        workerEnvelope: WorkerRequestEnvelope,
        providerEvent: ProviderEvent
    ): Promise<LlmResponse> {
        return this.auditor.auditResponse(workerEnvelope, providerEvent);
    }

    async processWorkerRequest(
        request: HoloWorkerRequest,
        _opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>> {
        const q = new AsyncEventQueue<ProviderEvent>();

        const {requestId, payload} = request as any;
        const requestPayload = payload as RequestPayload;

        const start = Date.now();
        let seq = 0;
        let fullText = "";

        const metrics = {
            timeToFirstToken: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalProcessingTime: 0,
        };

        const push = (ev: Omit<ProviderEvent, "requestId" | "seq" | "ts">) => {
            q.push({...ev, requestId, seq: seq++, ts: Date.now()} as ProviderEvent);
        };

        const ctx = {
            emitStreamEvent: (event: any) =>
                push({type: "stream_event", event} as ProviderEvent),
            emitTextDelta: (text: string) => {
                if (!metrics.timeToFirstToken) metrics.timeToFirstToken = Date.now() - start;
                fullText += text;
                push({type: "text_delta", text} as ProviderEvent);
            },
        };

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

                metrics.inputTokens = (final as any)?.usage?.input_tokens ?? 0;
                metrics.outputTokens = (final as any)?.usage?.output_tokens ?? 0;
                metrics.totalProcessingTime = Date.now() - start;

                push({type: "done", message: final, text: fullText, metrics} as ProviderEvent);
            } catch (e: any) {
                push({type: "error", error: await this.handleError(e)} as ProviderEvent);
            } finally {
                q.end();
            }
        })();

        return q;
    }

    protected abstract handleError(error: any): Promise<any>;

    protected abstract handleRequest(
        payload: RequestPayload,
        ctx: ProviderContext
    ): Promise<ProviderRunner<Final>>;

    get id(): string {
        return this._config.id;
    }
}