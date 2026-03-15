import type {HoloFinishReason, HoloResponse, HoloStreamEvent, HoloUsage} from '@holokai/types/holo';

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
        const output = [];

        if (text) {
            output.push({role: 'assistant' as const, content: text});
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
}
