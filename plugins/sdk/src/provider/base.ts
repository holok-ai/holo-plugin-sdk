import {AsyncEventQueue, IProvider, ModelInfo, ProviderContext, ProviderEvent} from "./types";
import {HoloWorkerRequest} from "../core/worker";
import {ObservableClassLogger} from "@holokai/sdk/core";


export abstract class BaseProvider<ReqPayload = any, Final = any> extends ObservableClassLogger implements IProvider {
    protected models: Record<string, ModelInfo> = {};

    protected constructor(
        public readonly name: string,
        public readonly family: string,
        public readonly version: string,
        protected readonly _config: any,
    ) {
        super();
    }

    abstract getModels(): Promise<ModelInfo[]>;

    async processWorkerRequest(
        request: HoloWorkerRequest,
        _opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>> {
        const q = new AsyncEventQueue<ProviderEvent>();

        const {requestId, payload} = request as any;
        const providerPayload = payload as ReqPayload;

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
            emitStreamEvent: (event: any) => push({type: "stream_event", event} as any),
            emitTextDelta: (text: string) => {
                if (!metrics.timeToFirstToken) metrics.timeToFirstToken = Date.now() - start;
                fullText += text;
                push({type: "text_delta", text} as any);
            },
        };

        let run: { final: () => Promise<Final>; cancel?: () => void };

        try {
            run = await this.handleRequest(providerPayload, ctx);
        } catch (e: any) {
            push({type: "error", error: {message: e?.message ?? String(e)}} as any);
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

                push({type: "done", message: final, fullText, metrics} as any);
            } catch (e: any) {
                push({type: "error", error: {message: e?.message ?? String(e)}} as any);
            } finally {
                q.end();
            }
        })();

        return q;
    }

    protected abstract handleRequest(
        payload: ReqPayload,
        ctx: ProviderContext
    ): Promise<{ final: () => Promise<Final>; cancel?: () => void }>;

    get id(): string {
        return this._config.id;
    }

    protected audit(response: any, _acc: any = null) {
        this.emit('audit', response);
    }

    protected data(response: any, _acc: any = null) {
        this.emit('data', response);
    }

    protected error(response: any) {
        this.emit('error', response);
    }

    protected done(response: any, _acc: any = null) {
        this.emit('done', response, _acc);
    }
}