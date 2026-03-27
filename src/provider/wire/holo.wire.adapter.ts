import type {ProviderEvent, WireChunk} from '@holokai/holo-types/provider';
import type {HoloContent, HoloMessage, HoloStreamEvent, HoloToolCall, HoloUsage} from '@holokai/holo-types/holo';
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
            case 'stream_event': {
                const rawEvent = ev.event as Record<string, unknown> | undefined;
                this.log.debug(`[HoloWireAdapter] stream_event type=${rawEvent?.['type']}`);
                const toolChunks = this.toolCallChunksFromStreamEvent(ev.event);
                if (toolChunks.length > 0) {
                    this.log.debug(`[HoloWireAdapter] emitting ${toolChunks.length} tool_call_delta(s)`);
                }
                for (const holoEvent of toolChunks) {
                    chunks.push(await this.chunkify(ev, async () => this.formatWire(holoEvent)));
                }
                return chunks;
            }
            case 'done':
                this.log.debug(`[HoloWireAdapter] done — finish_reason=${JSON.stringify((ev.message as Record<string, unknown>)?.['stop_reason'] ?? (ev.message as Record<string, unknown>)?.['finish_reason'])}, toolCalls=${this.toolCalls.size}`);
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

    // TODO: This method contains provider-specific parsing (Claude content_block_start/delta,
    // OpenAI choices[0].delta.tool_calls, Ollama message.tool_calls). Providers should normalize
    // tool calls into a common ProviderEvent format (e.g. a 'tool_call_delta' event type) in their
    // stream translators so the wire adapter only deals with Holo-normalized types.
    private toolCallChunksFromStreamEvent(event: Record<string, unknown>): HoloStreamEvent[] {
        if (!event || typeof event !== 'object') return [];

        // --- Claude format: content_block_start / content_block_delta ---
        if (event['type'] === 'content_block_start') {
            const cb = event['content_block'] as Record<string, unknown> | undefined;
            if (cb?.['type'] === 'tool_use') {
                const index = typeof event['index'] === 'number' ? event['index'] : 0;
                const delta: { id?: string; name?: string } = {};
                if (typeof cb['id'] === 'string') delta.id = cb['id'];
                if (typeof cb['name'] === 'string') delta.name = cb['name'];
                return [this.emitToolCallDelta(index, delta)];
            }
        }

        if (event['type'] === 'content_block_delta') {
            const delta = event['delta'] as Record<string, unknown> | undefined;
            if (delta?.['type'] === 'input_json_delta') {
                const index = typeof event['index'] === 'number' ? event['index'] : 0;
                const partial = typeof delta['partial_json'] === 'string' ? delta['partial_json'] : '';
                return [this.emitToolCallDelta(index, {arguments_delta: partial})];
            }
        }

        // --- OpenAI chat completions format: choices[0].delta.tool_calls ---
        const choices = event['choices'] as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(choices) && choices.length > 0) {
            const delta = choices[0]['delta'] as Record<string, unknown> | undefined;
            const toolCalls = delta?.['tool_calls'] as Array<Record<string, unknown>> | undefined;
            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                const results: HoloStreamEvent[] = [];
                for (const tc of toolCalls) {
                    const index = typeof tc['index'] === 'number' ? tc['index'] : 0;
                    const id = typeof tc['id'] === 'string' ? tc['id'] : undefined;
                    const fn = tc['function'] as Record<string, unknown> | undefined;
                    const name = typeof fn?.['name'] === 'string' ? fn['name'] : undefined;
                    const argsDelta = typeof fn?.['arguments'] === 'string' ? fn['arguments'] : undefined;

                    const d: Record<string, string> = {};
                    if (id) { d.id = id; }
                    if (name) { d.name = name; }
                    if (d.id || d.name) {
                        results.push(this.emitToolCallDelta(index, d));
                    }
                    if (argsDelta) {
                        results.push(this.emitToolCallDelta(index, {arguments_delta: argsDelta}));
                    }
                }
                return results;
            }
        }

        // --- Ollama format: message.tool_calls array ---
        const msg = event['message'] as Record<string, unknown> | undefined;
        if (msg) {
            const toolCalls = msg['tool_calls'] as Array<Record<string, unknown>> | undefined;
            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
                const results: HoloStreamEvent[] = [];
                for (let i = 0; i < toolCalls.length; i++) {
                    const tc = toolCalls[i];
                    const fn = tc['function'] as Record<string, unknown> | undefined;
                    if (!fn) continue;
                    const name = typeof fn['name'] === 'string' ? fn['name'] : '';
                    const args = fn['arguments'] ?? {};
                    const argsStr = typeof args === 'string' ? args : JSON.stringify(args);
                    // Emit start (name) + full arguments in one shot since ollama sends complete tool calls
                    const baseIndex = this.toolCalls.size + i;
                    results.push(this.emitToolCallDelta(baseIndex, {name}));
                    results.push(this.emitToolCallDelta(baseIndex, {arguments_delta: argsStr}));
                }
                return results;
            }
        }

        return [];
    }

    private buildFinalResponse(ev: Extract<ProviderEvent, { type: 'done' }>): HoloResponse {
        const output: HoloMessage[] = [];
        const text = ev.text || this.textAccumulator;
        const hasToolCalls = this.toolCalls.size > 0;

        if (hasToolCalls) {
            const sortedCalls = [...this.toolCalls.entries()].sort((a, b) => a[0] - b[0]);
            const contentBlocks: HoloContent[] = [];
            if (text) contentBlocks.push({type: 'text', text});
            for (const [, tc] of sortedCalls) {
                let args: Record<string, unknown> = {};
                try { if (tc.arguments) args = JSON.parse(tc.arguments); } catch { /* ignore */ }
                const block: HoloContent = tc.id
                    ? {type: 'tool_call', id: tc.id, name: tc.name, arguments: args}
                    : {type: 'tool_call', name: tc.name, arguments: args};
                contentBlocks.push(block);
            }
            const toolCallProjections: HoloToolCall[] = sortedCalls.map(([, tc]) => {
                let args: Record<string, unknown> = {};
                try { if (tc.arguments) args = JSON.parse(tc.arguments); } catch { /* ignore */ }
                const call: HoloToolCall = {type: 'function', function: {name: tc.name, arguments: args}};
                if (tc.id) call.id = tc.id;
                return call;
            });
            output.push({role: 'assistant', content: contentBlocks, tool_calls: toolCallProjections});
        } else if (text) {
            output.push({role: 'assistant', content: text});
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
