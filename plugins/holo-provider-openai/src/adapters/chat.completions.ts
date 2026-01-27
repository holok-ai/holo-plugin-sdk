import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";

export class OpenAIChatWireAdapter extends BaseWireAdapter {
    protected onStreamEvent(ev: Extract<ProviderEvent, { type: "stream_event" }>): WireChunk[] {
        return [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: `data: ${JSON.stringify(ev.event)}\n\n`,
        }];
    }

    protected onDoneStreaming(ev: Extract<ProviderEvent, { type: "done" }>): WireChunk[] {
        return [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: `data: [DONE]\n\n`,
            done: true,
        }];
    }

    protected onErrorStreaming(ev: Extract<ProviderEvent, { type: "error" }>): WireChunk[] {
        const errObj = {
            error: {
                message: ev.error.message,
                type: "invalid_request_error",
                code: ev.error.code ?? "internal_error",
            },
        };

        return [
            {requestId: ev.requestId, seq: ev.seq, body: `data: ${JSON.stringify(errObj)}\n\n`},
            {requestId: ev.requestId, seq: ev.seq + 1, body: `data: [DONE]\n\n`, done: true},
        ];
    }

    protected nonStreamingErrorBody(ev: Extract<ProviderEvent, { type: "error" }>): any {
        return {
            error: {
                message: ev.error.message,
                type: "invalid_request_error",
                code: ev.error.code ?? "internal_error",
            },
        };
    }
}