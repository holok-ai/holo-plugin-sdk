import {ClassLogger, pickDefined, stringifyAny} from '../../core';
import type {IWireAdapter, ProviderEvent, WireChunk} from '@holokai/types/provider';

export abstract class BaseWireAdapter extends ClassLogger implements IWireAdapter {
    wireSeq = 0;

    constructor(
        public readonly requestId: string,
        public readonly isStreaming: boolean
    ) {
        super();
    }

    async fromProviderEvent(ev: ProviderEvent): Promise<WireChunk[]> {
        if (!this.isStreaming) return this.fromNonStreaming(ev);
        return this.fromStreaming(ev);
    }

    abstract formatWire(data: any): string;

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

    protected async chunkify(ev: ProviderEvent, bodyFn: (ev: any) => Promise<string>, done?: true, options?: {
        fullText?: string,
        status?: number;
        headers?: Record<string, string>
    }): Promise<WireChunk> {
        const isFirst = this.wireSeq == 0;
        const seq = this.wireSeq++;
        const body = await bodyFn(ev);
        const fullText = options?.fullText;

        const chunk = pickDefined({
            fullText,
            requestId: this.requestId,
            seq,
            eventSeq: ev.seq,
            body,
            done,
        }) as WireChunk;

        if (isFirst) {
            const status = options?.status ?? (ev.type === 'error' ? (ev.status ?? 400) : 200);
            const headers =
                options?.headers ??
                (ev.type === 'error' && ev.headers ? ev.headers : undefined) ?? this.defaultHeadersForFirst(ev);

            chunk.status = status;
            chunk.headers = headers;
        } else {
            // generally do NOT send headers/status after first chunk; allow explicit override if needed
            if (options?.status !== undefined) chunk.status = options.status;
            if (options?.headers) chunk.headers = options.headers;
        }

        return chunk;
    }

    // --- non-streaming ---
    protected async fromNonStreaming(ev: ProviderEvent): Promise<WireChunk[]> {
        if (ev.type === 'done') {
            return [await this.chunkify(ev, async (ev: Extract<ProviderEvent, {
                type: 'done'
            }>) => stringifyAny(ev.message), true)];
        }
        if (ev.type === 'error') {
            return [await this.chunkify(ev, async (ev: Extract<ProviderEvent, {
                type: 'error'
            }>) => stringifyAny(ev.error), true, pickDefined({status: ev.status ?? 400, headers: ev.headers}))];
        }
        return [];
    }

    // --- streaming ---
    protected async fromStreaming(ev: ProviderEvent): Promise<WireChunk[]> {
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

    protected async onStreamEvent(ev: Extract<ProviderEvent, { type: 'stream_event' }>): Promise<WireChunk[]> {
        return [await this.chunkify(ev, this.defaultStreamEventFormatter.bind(this))];
    }

    protected async onDoneStreaming(ev: Extract<ProviderEvent, { type: 'done' }>): Promise<WireChunk[]> {
        return [await this.chunkify(ev, this.defaultDoneStreamFormatter.bind(this), true, {fullText: ev.text})];
    }

    protected async onErrorStreaming(ev: Extract<ProviderEvent, { type: 'error' }>): Promise<WireChunk[]> {
        if (this.wireSeq === 0) {
            return await this.fromNonStreaming(ev);
        }
        // Mid-stream: default behavior (provider adapters should usually override)
        return [await this.chunkify(ev, this.defaultStreamErrorFormatter.bind(this), true)];
    }

    protected async defaultDoneStreamFormatter(ev: Extract<ProviderEvent, { type: 'done' }>): Promise<string> {
        return this.formatWire(ev.message);
    }

    protected async defaultStreamErrorFormatter(ev: Extract<ProviderEvent, { type: 'error' }>): Promise<string> {
        return stringifyAny(ev.error);
    }

    protected async defaultStreamEventFormatter(ev: Extract<ProviderEvent, { type: 'stream_event' }>): Promise<string> {
        return this.formatWire(ev.event);
    }
}