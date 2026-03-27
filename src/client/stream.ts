import type {HoloResponse, HoloStreamEvent} from '@holokai/holo-types/holo';
import {HoloStreamAccumulator} from './merge';
import {HoloStreamError} from './errors';

type EventHandler<T> = (data: T) => void;

interface ToolCallDelta {
    id?: string;
    name?: string;
    arguments_delta?: string;
}

/**
 * Async-iterable stream of {@link HoloStreamEvent} objects from a streaming chat request.
 *
 * Can be consumed in three ways:
 * 1. **`for await`** — iterate over raw events
 * 2. **`.on()`** — register typed event handlers, then iterate or call a terminal method
 * 3. **`.text()` / `.finalResponse()`** — convenience methods that consume the stream and return the result
 *
 * @remarks A `HoloStream` can only be iterated once. Call {@link abort} to cancel an in-flight stream.
 *
 * @example
 * ```ts
 * const stream = await client.chat.stream({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * });
 *
 * for await (const event of stream) {
 *   if (event.type === 'response.output_text.delta') {
 *     process.stdout.write(event.delta ?? '');
 *   }
 * }
 * ```
 *
 * @see {@link HoloStreamEvent} for the event payload shape.
 * @see {@link HoloStreamAccumulator} for the underlying delta-merging logic.
 */
export class HoloStream implements AsyncIterable<HoloStreamEvent> {
    private readonly events: AsyncGenerator<HoloStreamEvent>;
    private readonly abortController: AbortController;
    private readonly accumulator = new HoloStreamAccumulator();
    private completedResponse?: HoloResponse;
    private failedError?: Error;
    private iterationStarted = false;
    private eventHandlers: Map<string, EventHandler<any>[]> = new Map();

    constructor(events: AsyncGenerator<HoloStreamEvent>, abortController: AbortController) {
        this.events = events;
        this.abortController = abortController;
    }

    [Symbol.asyncIterator](): AsyncIterator<HoloStreamEvent> {
        if (this.iterationStarted) {
            throw new Error('HoloStream can only be iterated once');
        }
        this.iterationStarted = true;

        const self = this;
        return {
            async next(): Promise<IteratorResult<HoloStreamEvent>> {
                const result = await self.events.next();
                if (result.done) return {done: true, value: undefined};

                const event = result.value;
                self.accumulator.push(event);
                self.dispatchEvent(event);

                if (event.type === 'response.completed' && event.response) {
                    self.completedResponse = event.response;
                }
                if (event.type === 'response.failed') {
                    self.failedError = new HoloStreamError(event.error?.message ?? 'Stream failed', event);
                }

                return {done: false, value: event};
            },
        };
    }

    on(event: 'response.output_text.delta', fn: EventHandler<string>): this;
    on(event: 'response.tool_call.delta', fn: EventHandler<ToolCallDelta>): this;
    on(event: 'response.reasoning.delta', fn: EventHandler<string>): this;
    on(event: 'response.completed', fn: EventHandler<HoloResponse>): this;
    on(event: 'response.failed', fn: EventHandler<Error>): this;
    /** Register an event handler. Handlers fire during iteration (either explicit or via terminal methods). */
    on(event: string, fn: EventHandler<any>): this {
        const handlers = this.eventHandlers.get(event) ?? [];
        handlers.push(fn);
        this.eventHandlers.set(event, handlers);
        return this;
    }

    /** Consume the entire stream and return the concatenated text output. */
    async text(): Promise<string> {
        await this.consume();
        if (this.failedError) throw this.failedError;
        return this.accumulator.getText();
    }

    /** Consume the entire stream and return the assembled {@link HoloResponse}. */
    async finalResponse(): Promise<HoloResponse> {
        await this.consume();
        if (this.failedError) throw this.failedError;
        const accumulated = this.accumulator.toResponse();
        // If the server says tool_calls but the completedResponse is missing them, use accumulator
        if (this.completedResponse?.finish_reason === 'tool_calls') {
            const hasToolCalls = this.completedResponse.output?.some(
                (m) => m.tool_calls?.length || (Array.isArray(m.content) && m.content.some((b: any) => b.type === 'tool_call'))
            );
            if (!hasToolCalls && accumulated.output?.length) return accumulated;
        }
        if (this.completedResponse?.output?.length) return this.completedResponse;
        if (accumulated.output.length) return accumulated;
        return this.completedResponse ?? accumulated;
    }

    /** Cancel the in-flight stream. */
    abort(): void {
        this.abortController.abort();
    }

    private async consume(): Promise<void> {
        if (this.completedResponse || this.failedError) return;

        for await (const _event of this) {
            // iteration handles accumulation via [Symbol.asyncIterator]
        }
    }

    private dispatchEvent(event: HoloStreamEvent): void {
        const handlers = this.eventHandlers.get(event.type);
        if (!handlers?.length) return;

        switch (event.type) {
            case 'response.output_text.delta':
                for (const h of handlers) h(event.delta ?? '');
                break;
            case 'response.reasoning.delta':
                for (const h of handlers) h(event.delta ?? '');
                break;
            case 'response.tool_call.delta':
                for (const h of handlers) h(event.tool_call_delta ?? {});
                break;
            case 'response.completed':
                for (const h of handlers) h(event.response ?? this.accumulator.toResponse());
                break;
            case 'response.failed':
                for (const h of handlers) h(new HoloStreamError(event.error?.message ?? 'Stream failed', event));
                break;
        }
    }
}
