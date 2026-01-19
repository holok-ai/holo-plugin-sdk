import {ProviderEvent} from "../types";
import {RequestType} from "../../holo";

export type WireChunk = {
    requestId: string;
    seq: number;
    headers?: Record<string, string>; // first chunk only
    body: string;                    // bytes to write
    done?: true;
};

export interface IWireAdapter {
    requestId: string;
    isStreaming: boolean;

    start(): WireChunk;

    fromProviderEvent(ev: ProviderEvent): WireChunk[];    // produce 0..n wire chunks
}

export interface WireAdapterParams {
    requestId: string;
    isStreaming: boolean;
    requestType: RequestType;
}

export abstract class BaseWireAdapter implements IWireAdapter {
    constructor(
        public readonly requestId: string,
        public readonly isStreaming: boolean
    ) {
    }

    start(): WireChunk {
        return this.isStreaming ? this.startStreaming() : this.startNonStreaming();
    }

    fromProviderEvent(ev: ProviderEvent): WireChunk[] {
        if (!this.isStreaming) return this.fromNonStreaming(ev);
        return this.fromStreaming(ev);
    }

    protected startNonStreaming(): WireChunk {
        return {
            requestId: this.requestId,
            seq: 0,
            headers: this.nonStreamingHeaders(),
            body: ""
        };
    }

    protected startStreaming(): WireChunk {
        return {
            requestId: this.requestId,
            seq: 0,
            headers: this.streamingHeaders(),
            body: ""
        };
    }

    protected nonStreamingHeaders(): Record<string, string> {
        return {"Content-Type": "application/json"};
    }

    protected streamingHeaders(): Record<string, string> {
        return {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        };
    }

    protected fromNonStreaming(ev: ProviderEvent): WireChunk[] {
        if (ev.type === "done") {
            return [{
                requestId: ev.requestId,
                seq: ev.seq,
                body: JSON.stringify(this.nonStreamingDoneBody(ev)),
                done: true
            }];
        }

        if (ev.type === "error") {
            return [{
                requestId: ev.requestId,
                seq: ev.seq,
                body: JSON.stringify(this.nonStreamingErrorBody(ev)),
                done: true
            }];
        }

        return [];
    }

    protected fromStreaming(ev: ProviderEvent): WireChunk[] {
        switch (ev.type) {
            case "provider_start":
                return this.onProviderStart(ev);
            case "stream_event":
                return this.onStreamEvent(ev);
            case "done":
                return this.onDoneStreaming(ev);
            case "error":
                return this.onErrorStreaming(ev);
            case "text_delta":
            default:
                return [];
        }
    }

    protected onProviderStart(_ev: Extract<ProviderEvent, { type: "provider_start" }>): WireChunk[] {
        return [];
    }

    protected abstract onStreamEvent(ev: Extract<ProviderEvent, { type: "stream_event" }>): WireChunk[];

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): WireChunk[] {
        return [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: "",
            done: true
        }];
    }

    protected onErrorStreaming(ev: Extract<ProviderEvent, { type: "error" }>): WireChunk[] {
        return [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: "",
            done: true
        }];
    }

    protected nonStreamingDoneBody(ev: Extract<ProviderEvent, { type: "done" }>): any {
        return ev.message;
    }

    protected nonStreamingErrorBody(ev: Extract<ProviderEvent, { type: "error" }>): any {
        return {
            error: {
                message: ev.error.message,
                type: "internal_error",
                code: ev.error.code,
            },
        };
    }
}