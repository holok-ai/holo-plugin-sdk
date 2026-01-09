import {RequestType} from "@holokai/sdk/holo";
import {HoloWorkerRequest} from "../core/worker";

export type ProviderEvent =
    | { type: "provider_start"; requestId: string; provider: string; ts: number }
    | { type: "stream_event"; requestId: string; seq: number; event: any; ts: number }
    | { type: "text_delta"; requestId: string; seq: number; text: string; ts: number }
    | { type: "done"; requestId: string; seq: number; message: any; fullText?: string; metrics?: any; ts: number }
    | { type: "error"; requestId: string; seq: number; error: { message: string; code?: string }; ts: number };


export class AsyncEventQueue<T> implements AsyncIterable<T> {
    private q: T[] = [];
    private pending: ((v: IteratorResult<T>) => void)[] = [];
    private ended = false;
    private err: any = null;

    push(item: T) {
        if (this.ended) return;
        const r = this.pending.shift();
        if (r) r({value: item, done: false});
        else this.q.push(item);
    }

    end() {
        this.ended = true;
        while (this.pending.length) this.pending.shift()!({value: undefined as any, done: true});
    }

    fail(e: any) {
        this.err = e;
        this.end();
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
            next: () => {
                if (this.err) return Promise.reject(this.err);
                if (this.q.length) return Promise.resolve({value: this.q.shift()!, done: false});
                if (this.ended) return Promise.resolve({value: undefined as any, done: true});
                return new Promise<IteratorResult<T>>(resolve => this.pending.push(resolve));
            },
        };
    }
}

export type ProviderContext = {
    requestType?: RequestType;
    // stream: boolean;
    // signal?: AbortSignal;

    // Provider uses these; BaseProvider supplies them
    emitStreamEvent: (event: any) => void;
    emitTextDelta: (text: string) => void;
};

export type RunHandle<Final> = {
    final: () => Promise<Final>;
    cancel?: () => void;
};

export interface ProviderConfig {
    id: string;
    name: string;
    provider_type: string;
    api_key: string;
    model: string;
    plugin_id: string | null; // null for legacy hardcoded providers
    base_url?: string;
    headers?: Record<string, string>;
    timeout?: number;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    retry?: {
        max_attempts?: number;
        backoff?: 'exponential' | 'linear';
    };
}

export interface ProviderCapabilities {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxTokens: number;
}


/**
 * Model information interface
 */
export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    size?: number;
    parameterCount?: string;
    quantization?: string;
    family?: string;
    parentModel?: string;
    format?: string;

    [key: string]: any; // Allow additional properties
}


export interface AIRequestStat {
    type: RequestType;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}


export interface IProvider {
    name: string;
    family: string;
    version: string;

    processWorkerRequest(
        request: HoloWorkerRequest,
        opts?: { signal?: AbortSignal }
    ): Promise<AsyncEventQueue<ProviderEvent>>;
}
