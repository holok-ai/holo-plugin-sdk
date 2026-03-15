import type {
    HoloContent,
    HoloContentReasoning,
    HoloContentText,
    HoloContentToolCall,
    HoloFinishReason,
    HoloInvalidToolCall,
    HoloMessage,
    HoloResponse,
    HoloStreamEvent,
    HoloToolCall,
    HoloUsage,
} from '@holokai/types/holo';

/**
 * Accumulates {@link HoloStreamEvent} deltas into a complete {@link HoloResponse}.
 *
 * Feed events via {@link push}, then call {@link toResponse} to get the assembled result.
 * Used internally by {@link HoloStream} but can also be used standalone.
 */
export class HoloStreamAccumulator {
    private id: string = '';
    private model?: string;
    private created?: number;
    private textParts: string[] = [];
    private reasoningParts: string[] = [];
    private toolCalls: Map<number, { id?: string; name: string; arguments: string }> = new Map();
    private invalidToolCalls: HoloInvalidToolCall[] = [];
    private usage?: HoloUsage;
    private finishReason: HoloFinishReason = null;

    /** Process a single stream event, merging its data into the accumulated state. */
    push(event: HoloStreamEvent): void {
        switch (event.type) {
            case 'response.created':
                if (event.response) {
                    if (event.response.id) this.id = event.response.id;
                    this.model = event.response.model;
                    this.created = event.response.created as number;
                }
                break;

            case 'response.output_text.delta':
                if (event.delta) {
                    this.textParts.push(event.delta);
                }
                break;

            case 'response.reasoning.delta':
                if (event.delta) {
                    this.reasoningParts.push(event.delta);
                }
                break;

            case 'response.tool_call.delta':
                if (event.tool_call_delta && event.index !== undefined) {
                    const existing = this.toolCalls.get(event.index) ?? {name: '', arguments: ''};
                    if (event.tool_call_delta.id) existing.id = event.tool_call_delta.id;
                    if (event.tool_call_delta.name) existing.name += event.tool_call_delta.name;
                    if (event.tool_call_delta.arguments_delta) existing.arguments += event.tool_call_delta.arguments_delta;
                    this.toolCalls.set(event.index, existing);
                }
                break;

            case 'response.content_block.start':
            case 'response.content_block.delta':
            case 'response.content_block.stop':
            case 'response.message.start':
            case 'response.message.stop':
                break;

            case 'response.usage':
                if (event.usage) this.usage = event.usage;
                break;

            case 'response.completed':
                if (event.response) return;
                if (event.usage) this.usage = event.usage;
                if (event.finish_reason !== undefined) this.finishReason = event.finish_reason;
                break;

            case 'response.failed':
                this.finishReason = 'error';
                break;
        }
    }

    /** Assemble all accumulated deltas into a complete {@link HoloResponse}. */
    toResponse(): HoloResponse {
        const text = this.textParts.join('');
        const reasoning = this.reasoningParts.join('');
        const hasText = text.length > 0;
        const hasReasoning = reasoning.length > 0;
        const hasToolCalls = this.toolCalls.size > 0;

        const output: HoloMessage[] = [];

        if (hasText || hasReasoning || hasToolCalls) {
            const isStructured = hasReasoning || hasToolCalls;

            if (isStructured) {
                const contentBlocks: HoloContent[] = [];

                if (hasReasoning) {
                    const block: HoloContentReasoning = {type: 'reasoning'};
                    block.text = reasoning;
                    contentBlocks.push(block);
                }

                if (hasText) {
                    const block: HoloContentText = {type: 'text', text};
                    contentBlocks.push(block);
                }

                if (hasToolCalls) {
                    const toolCallBlocks = this.buildToolCallBlocks();
                    contentBlocks.push(...toolCallBlocks);
                }

                const message: HoloMessage = {role: 'assistant', content: contentBlocks};

                if (hasToolCalls) {
                    message.tool_calls = this.buildToolCallProjections();
                    if (this.invalidToolCalls.length > 0) {
                        message.invalid_tool_calls = this.invalidToolCalls;
                    }
                }

                output.push(message);
            } else {
                output.push({role: 'assistant', content: text});
            }
        }

        const response: HoloResponse = {
            model: this.model ?? '',
            output,
            created: this.created ?? Date.now(),
            finish_reason: this.finishReason,
            usage: this.usage ?? {},
        };
        if (this.id) response.id = this.id;
        return response;
    }

    /** Return the concatenated text output accumulated so far. */
    getText(): string {
        return this.textParts.join('');
    }

    private buildToolCallBlocks(): HoloContentToolCall[] {
        const blocks: HoloContentToolCall[] = [];
        for (const [, tc] of [...this.toolCalls.entries()].sort((a, b) => a[0] - b[0])) {
            const parsed = this.parseArguments(tc.arguments);
            const block: HoloContentToolCall = {
                type: 'tool_call',
                name: tc.name,
                arguments: parsed ?? {},
            };
            if (tc.id) block.id = tc.id;
            if (parsed === null) {
                block.raw_arguments = tc.arguments;
                const invalid: HoloInvalidToolCall = {
                    error: 'Failed to parse tool call arguments as JSON',
                    raw_arguments: tc.arguments,
                };
                if (tc.id) invalid.id = tc.id;
                if (tc.name) invalid.name = tc.name;
                this.invalidToolCalls.push(invalid);
            }
            blocks.push(block);
        }
        return blocks;
    }

    private buildToolCallProjections(): HoloToolCall[] {
        const calls: HoloToolCall[] = [];
        for (const [, tc] of [...this.toolCalls.entries()].sort((a, b) => a[0] - b[0])) {
            const parsed = this.parseArguments(tc.arguments);
            const call: HoloToolCall = {
                type: 'function',
                function: {
                    name: tc.name,
                    arguments: parsed ?? {},
                },
            };
            if (tc.id) call.id = tc.id;
            calls.push(call);
        }
        return calls;
    }

    private parseArguments(raw: string): Record<string, unknown> | null {
        if (!raw) return {};
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
            return {};
        } catch {
            return null;
        }
    }
}
