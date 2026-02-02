import {ClassLogger, pickDefined} from '@holokai/sdk/core';
import {ProviderEvent} from '../types';
import type {RequestType} from '@holokai/sdk/holo';

export type WireChunk = {
    requestId: string;
    seq: number;                 // wire seq (0..n), owned by adapter
    eventSeq?: number;           // correlation to ProviderEvent.seq
    headers?: Record<string, string>; // typically first chunk only
    status?: number;             // typically first chunk only
    body: string;
    done?: true;
};

export interface IWireAdapter {
    requestId: string;
    isStreaming: boolean;

    fromProviderEvent(ev: ProviderEvent): WireChunk[];
}

export interface WireAdapterParams {
    requestId: string;
    isStreaming: boolean;
    requestType: RequestType;
}

export abstract class BaseWireAdapter extends ClassLogger implements IWireAdapter {
    wireSeq = 0;


    constructor(
        public readonly requestId: string,
        public readonly isStreaming: boolean
    ) {
        super();
    }

    fromProviderEvent(ev: ProviderEvent): WireChunk[] {
        if (!this.isStreaming) return this.fromNonStreaming(ev);
        return this.fromStreaming(ev);
    }

    // --- defaults ---
    protected nonStreamingHeaders(): Record<string, string> {
        return {'Content-Type': 'application/json'};
    }

    protected streamingHeaders(): Record<string, string> {
        return {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        };
    }

    protected defaultHeadersForFirst(ev: ProviderEvent): Record<string, string> {
        return (ev.type === 'error' || !this.isStreaming) ? this.nonStreamingHeaders() : this.streamingHeaders();
    }

    protected stringifyResponse(err: string | Error): string {
        return typeof err === 'string' ? err : JSON.stringify(err);
    }

    protected chunkify(response: any, ev: ProviderEvent, done?: true, override?: {
        status?: number;
        headers?: Record<string, string>
    }): WireChunk {
        const isFirst = this.wireSeq == 0;
        const seq = this.wireSeq++;
        const body = response === undefined ? '' :
            ev.type === 'error' || ev.type === 'done' ? this.stringifyResponse(response) : this.formatWire(response);

        const chunk = pickDefined({
            requestId: this.requestId,
            seq,
            eventSeq: ev.seq,
            body,
            done,
        }) as WireChunk;

        if (isFirst) {
            const status = override?.status ?? (ev.type === 'error' ? (ev.status ?? 400) : 200);
            const headers =
                override?.headers ??
                (ev.type === 'error' && ev.headers ? ev.headers : undefined) ?? this.defaultHeadersForFirst(ev);

            chunk.status = status;
            chunk.headers = headers;
        } else {
            // generally do NOT send headers/status after first chunk; allow explicit override if needed
            if (override?.status !== undefined) chunk.status = override.status;
            if (override?.headers) chunk.headers = override.headers;
        }

        return chunk;
    }

    // --- non-streaming ---
    protected fromNonStreaming(ev: ProviderEvent): WireChunk[] {
        if (ev.type === 'done') {
            return [this.chunkify(ev.message, ev, true)];
        }
        if (ev.type === 'error') {
            return [this.chunkify(ev.error, ev, true, pickDefined({status: ev.status ?? 400, headers: ev.headers}))];
        }
        return [];
    }

    // --- streaming ---
    protected fromStreaming(ev: ProviderEvent): WireChunk[] {
        switch (ev.type) {
            case 'stream_event':
                return this.onStreamEvent(ev);
            case 'done':
                return this.onDoneStreaming(ev);
            case 'error':
                return this.onErrorStreaming(ev);
            case 'text_delta':
            default:
                return [];
        }
    }

    protected onStreamEvent(ev: Extract<ProviderEvent, { type: 'stream_event' }>): WireChunk[] {
        return [this.chunkify(ev.event, ev)];
    }

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: 'done' }>): WireChunk[] {
        return [this.chunkify(ev.text, ev, true)];
    }

    protected onErrorStreaming(ev: Extract<ProviderEvent, { type: 'error' }>): WireChunk[] {
        if (this.wireSeq === 0) {
            return this.fromNonStreaming(ev);
        }
        // Mid-stream: default behavior (provider adapters should usually override)
        return [this.chunkify(ev.error, ev, true)];
    }

    abstract formatWire(data: any): string;
}