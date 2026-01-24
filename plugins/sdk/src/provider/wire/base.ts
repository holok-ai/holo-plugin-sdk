import {ProviderEvent} from "../types";
import {RequestType} from "../../holo";
import {ClassLogger, pickDefined} from "@holokai/sdk/core";

export type WireChunk = {
    requestId: string;
    seq: number;
    headers?: Record<string, string>; // first chunk only
    status?: number; // first chunk only HTTP Status
    body: string;                    // bytes to write
    done?: true;
};

export interface IWireAdapter {
    requestId: string;
    isStreaming: boolean;

    start(status?: number): WireChunk;

    fromProviderEvent(ev: ProviderEvent): WireChunk[];    // produce 0..n wire chunks
}

export interface WireAdapterParams {
    requestId: string;
    isStreaming: boolean;
    requestType: RequestType;
}

export abstract class BaseWireAdapter extends ClassLogger implements IWireAdapter {

    constructor(
        public readonly requestId: string,
        public readonly isStreaming: boolean
    ) {
        super();
    }

    start(status: number = 200): WireChunk {

        const headers = this.isStreaming ? this.streamingHeaders() : this.nonStreamingHeaders();

        return {
            requestId: this.requestId,
            seq: 0,
            headers,
            status,
            body: ""
        };

    }

    fromProviderEvent(ev: ProviderEvent): WireChunk[] {
        if (!this.isStreaming) return this.fromNonStreaming(ev);
        return this.fromStreaming(ev);
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
                body: JSON.stringify(ev.message),
                done: true
            }];
        }

        if (ev.type === "error") {
            return [pickDefined({
                requestId: ev.requestId,
                seq: ev.seq,
                status: ev.status,
                body: JSON.stringify(ev.error),
                done: true
            }) as WireChunk];
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
            body: ev.error,
            done: true
        }];
    }
}