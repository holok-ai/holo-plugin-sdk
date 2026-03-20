import type {ProviderEvent, WireChunk} from '@holokai/holo-types/provider';
import type {HoloStreamEvent} from '@holokai/holo-types/holo';
import {BaseWireAdapter} from './base';
import {HoloResponse} from "@holokai/holo-types";
import {pickDefined} from "../../core";

export class HoloWireAdapter extends BaseWireAdapter {
    private textAccumulator = '';
    private toolCalls: Map<number, { id?: string; name: string; arguments: string }> = new Map();
    private responseId?: string;
    private model?: string;

    formatWire(data: string | HoloStreamEvent): string {
        if (typeof data === 'string') {
            return `event: ${data}\ndata: {}\n\n`;
        }
        return `event: ${data.type}\ndata: ${JSON.stringify(data)}\n\n`;
    }

    emitCreated(id: string, model: string): HoloStreamEvent {
        this.responseId = id;
        this.model = model;
        return {
            type: 'response.created',
            response: {id, model, output: [], created: Date.now(), usage: {}, finish_reason: null}
        };
    }

    emitTextDelta(index: number, text: string): HoloStreamEvent {
        this.textAccumulator += text;
        return {type: 'response.output_text.delta', index, delta: text};
    }

    emitReasoningDelta(index: number, text: string): HoloStreamEvent {
        return {type: 'response.reasoning.delta', index, delta: text};
    }

    emitToolCallDelta(index: number, delta: { id?: string; name?: string; arguments_delta?: string }): HoloStreamEvent {
        const existing = this.toolCalls.get(index);
        if (existing) {
            if (delta.id) existing.id = delta.id;
            if (delta.name) existing.name += delta.name;
            if (delta.arguments_delta) existing.arguments += delta.arguments_delta;
        } else {
            const entry: { id?: string; name: string; arguments: string } = {
                name: delta.name ?? '',
                arguments: delta.arguments_delta ?? ''
            };
            if (delta.id) entry.id = delta.id;
            this.toolCalls.set(index, entry);
        }
        return {type: 'response.tool_call.delta', index, tool_call_delta: delta};
    }

    async emitHoloEvent(ev: ProviderEvent, holoEvent: HoloStreamEvent): Promise<WireChunk[]> {
        return [await this.chunkify(ev, async () => this.formatWire(holoEvent))];
    }

    protected async fromNonStreaming(ev: ProviderEvent): Promise<WireChunk[]> {
        if (ev.type === 'done') {
            const response = this.buildFinalResponse(ev);
            return [await this.chunkify(ev, async () => JSON.stringify(response), true)];
        }
        if (ev.type === 'error') {
            const errorEvent: HoloStreamEvent = {
                type: 'response.failed',
                error: {message: String(ev.error), code: String(ev.status ?? 500)},
            };
            const opts: { status: number; headers?: Record<string, string> } = {status: ev.status ?? 400};
            if (ev.headers) opts.headers = ev.headers;
            return [await this.chunkify(ev, async () => JSON.stringify(errorEvent), true, opts)];
        }
        return [];
    }

    protected async onStreamEvent(_ev: Extract<ProviderEvent, { type: 'stream_event' }>): Promise<WireChunk[]> {
        return [];
    }

    protected async onDoneStreaming(ev: Extract<ProviderEvent, { type: 'done' }>): Promise<WireChunk[]> {
        const response = this.buildFinalResponse(ev);
        const completedEvent: HoloStreamEvent = {
            type: 'response.completed',
            response,
            ...pickDefined({
                usage: response.usage,
                finish_reason: response.finish_reason
            })
        };
        return [await this.chunkify(ev, async () => this.formatWire(completedEvent), true, {fullText: ev.text})];
    }

    protected async onErrorStreaming(ev: Extract<ProviderEvent, { type: 'error' }>): Promise<WireChunk[]> {
        if (this.wireSeq === 0) {
            return this.fromNonStreaming(ev);
        }
        const errorEvent: HoloStreamEvent = {
            type: 'response.failed',
            error: {message: String(ev.error), code: String(ev.status ?? 500)},
        };
        return [await this.chunkify(ev, async () => this.formatWire(errorEvent), true)];
    }

    private buildFinalResponse(ev: Extract<ProviderEvent, { type: 'done' }>): HoloResponse {
        const output = [];

        if (this.textAccumulator || ev.text) {
            output.push({role: 'assistant' as const, content: ev.text || this.textAccumulator});
        }

        return {
            id: this.responseId ?? ev.requestId,
            model: this.model ?? '',
            output,
            created: Date.now(),
            finish_reason: mapFinishReason(ev),
            usage: pickDefined({
                input_tokens: ev.metrics.inputTokens,
                output_tokens: ev.metrics.outputTokens,
                total_tokens: ev.metrics.totalTokens,
                time_to_first_token: ev.metrics.timeToFirstToken,
                total_processing_time: ev.metrics.totalProcessingTime
            })
        };
    }
}

function mapFinishReason(ev: Extract<ProviderEvent, {
    type: 'done'
}>): 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | null {
    const msg = ev.message;
    if (!msg) return 'stop';
    const reason = msg.stop_reason ?? msg.finish_reason ?? msg.choices?.[0]?.finish_reason;
    switch (reason) {
        case 'end_turn':
        case 'stop':
            return 'stop';
        case 'max_tokens':
        case 'length':
            return 'length';
        case 'tool_use':
        case 'tool_calls':
            return 'tool_calls';
        case 'content_filter':
            return 'content_filter';
        default:
            return 'stop';
    }
}
