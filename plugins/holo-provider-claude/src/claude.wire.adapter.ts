import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";

export class ClaudeWireAdapter extends BaseWireAdapter {
    protected onStreamEvent(ev: Extract<ProviderEvent, { type: "stream_event" }>): WireChunk[] {
        const payload = ev.event as any;

        const eventLine = `event: ${payload?.type ?? "message"}\n`;
        const dataLine = `data: ${JSON.stringify(payload)}\n\n`;

        const out: WireChunk[] = [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: eventLine + dataLine,
        }];

        const t = payload?.type;
        if (t === "message_stop" || t === "error") {
            out.push({
                requestId: ev.requestId,
                seq: ev.seq + 1,
                body: "",
                done: true,
            });
        }

        return out;
    }

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): WireChunk[] {
        return [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: "",
            done: true,
        }];
    }

    protected onErrorStreaming(ev: Extract<ProviderEvent, { type: "error" }>): WireChunk[] {
        const errPayload = {
            type: "error",
            error: {
                type: "internal_error",
                message: ev.error.message,
                code: ev.error.code,
            },
        };

        const eventLine = `event: error\n`;
        const dataLine = `data: ${JSON.stringify(errPayload)}\n\n`;

        return [
            {requestId: ev.requestId, seq: ev.seq, body: eventLine + dataLine},
            {requestId: ev.requestId, seq: ev.seq + 1, body: "", done: true},
        ];
    }

    protected nonStreamingErrorBody(ev: Extract<ProviderEvent, { type: "error" }>): any {
        return {
            type: "error",
            error: {
                type: "internal_error",
                message: ev.error.message,
                code: ev.error.code,
            },
        };
    }
}