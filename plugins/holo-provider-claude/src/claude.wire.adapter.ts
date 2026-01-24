import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";

export class ClaudeWireAdapter extends BaseWireAdapter {
    protected onStreamEvent(ev: Extract<ProviderEvent, { type: "stream_event" }>): WireChunk[] {
        const event = ev.event as any;

        const eventLine = `event: ${event?.type ?? "message"}\n`;
        const dataLine = `data: ${JSON.stringify(event)}\n\n`;

        const out: WireChunk[] = [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: eventLine + dataLine,
        }];

        // const t = event?.type;
        // if (t === "message_stop" || t === "error") {
        //     out.push({
        //         requestId: ev.requestId,
        //         seq: ev.seq + 1,
        //         body: "",
        //         done: true,
        //     });
        // }

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
        const eventLine = `event: error\n`;
        const dataLine = `data: ${JSON.stringify(ev.error)}\n\n`;

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