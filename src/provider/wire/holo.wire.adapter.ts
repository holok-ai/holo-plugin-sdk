import type {ProviderEvent, WireChunk} from '@holokai/holo-types/provider';
import type {HoloStreamEvent, HoloUsage} from '@holokai/holo-types/holo';
import type {ProtocolCapability} from '@holokai/holo-types/entities';
import {BaseWireAdapter} from './base';
import {HoloResponse} from "@holokai/holo-types";
import {pickDefined} from "../../core";

export class HoloWireAdapter extends BaseWireAdapter {
    private textAccumulator = '';
    private toolCalls: Map<number, { id?: string; name: string; arguments: string }> = new Map();
    private responseId?: string;
    private model?: string;
    private firstEvent = true;
    private readonly capability: ProtocolCapability | undefined;

    constructor(requestId: string, isStreaming: boolean, initialModel?: string, capability?: ProtocolCapability) {
        super(requestId, isStreaming);
        if (initialModel) this.model = initialModel;
        this.capability = capability;
    }

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
            if (this.capability === 'embed' || this.capability === 'metrics') {
                return [await this.chunkify(ev, async () => JSON.stringify(ev.message), true)];
            }
            const response = ev.holoResponse ?? this.buildFinalResponse(ev);
            return [await this.chunkify(ev, async () => JSON.stringify(response), true)];
        }
        if (ev.type === 'error') {
            const status = ev.status ?? 500;
            const errorBody = typeof ev.error === 'string'
                ? {message: ev.error}
                : (ev.error ?? {message: ev.text ?? 'Unknown error'});
            const errorEvent: HoloStreamEvent = {
                type: 'response.failed',
                error: {message: errorBody.message ?? ev.text ?? String(ev.error), code: String(status)},
            };
            const opts: { status: number; headers?: Record<string, string> } = {status};
            if (ev.headers) opts.headers = ev.headers;
            return [await this.chunkify(ev, async () => JSON.stringify(errorEvent), true, opts)];
        }
        return [];
    }

    protected async fromStreaming(ev: ProviderEvent): Promise<WireChunk[]> {
        const chunks: WireChunk[] = [];

        if (this.firstEvent) {
            this.firstEvent = false;
            const createdEvent = this.emitCreated(this.requestId, this.model ?? '');
            chunks.push(await this.chunkify(ev, async () => this.formatWire(createdEvent)));
        }

        switch (ev.type) {
            case 'text_delta': {
                const deltaEvent = this.emitTextDelta(0, ev.text);
                chunks.push(await this.chunkify(ev, async () => this.formatWire(deltaEvent)));
                return chunks;
            }
            case 'stream_event':
                return chunks;
            case 'done':
                chunks.push(...await this.onDoneStreaming(ev));
                return chunks;
            case 'error':
                chunks.push(...await this.onErrorStreaming(ev));
                return chunks;
            default:
                return chunks;
        }
    }

    protected async onDoneStreaming(ev: Extract<ProviderEvent, { type: 'done' }>): Promise<WireChunk[]> {
        const response = ev.holoResponse ?? this.buildFinalResponse(ev);
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
        const status = ev.status ?? 500;
        const errorBody = typeof ev.error === 'string'
            ? {message: ev.error}
            : (ev.error ?? {message: ev.text ?? 'Unknown error'});
        const errorEvent: HoloStreamEvent = {
            type: 'response.failed',
            error: {message: errorBody.message ?? ev.text ?? String(ev.error), code: String(status)},
        };
        return [await this.chunkify(ev, async () => this.formatWire(errorEvent), true)];
    }

    private buildFinalResponse(ev: Extract<ProviderEvent, { type: 'done' }>): HoloResponse {
        const output = [];

        if (this.textAccumulator || ev.text) {
            output.push({role: 'assistant' as const, content: ev.text || this.textAccumulator});
        }

        const usage: HoloUsage = {};
        if (ev.metrics.inputTokens) usage.input_tokens = ev.metrics.inputTokens;
        if (ev.metrics.outputTokens) usage.output_tokens = ev.metrics.outputTokens;
        const total = ev.metrics.inputTokens + ev.metrics.outputTokens;
        if (total) usage.total_tokens = total;

        return {
            id: this.responseId ?? ev.requestId,
            model: this.model ?? '',
            output,
            created: Date.now(),
            finish_reason: mapFinishReason(ev),
            usage,
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
