import {BaseWireAdapter, ProviderEvent, WireChunk} from "@holokai/sdk";

export class OpenAIResponsesWireAdapter extends BaseWireAdapter {
    protected onStreamEvent(ev: Extract<ProviderEvent, { type: "stream_event" }>): WireChunk[] {
        const out: WireChunk[] = [{
            requestId: ev.requestId,
            seq: ev.seq,
            body: `data: ${JSON.stringify(ev.event)}\n\n`,
        }];

        const t = (ev.event as any)?.type;
        if (t === "response.completed" || t === "response.failed" || t === "response.incomplete" || t === "error") {
            out.push({
                requestId: ev.requestId,
                seq: ev.seq + 1,
                body: `data: [DONE]\n\n`,
                done: true,
            });
        }

        return out;
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