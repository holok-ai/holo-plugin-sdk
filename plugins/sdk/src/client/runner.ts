import type {
    HoloContent,
    HoloContentToolCall,
    HoloMessage,
    HoloResponse,
    HoloTool,
    HoloToolChoice,
} from '@holokai/types/holo';
import type {HoloStream} from './stream';

/** Extracted tool call information passed to the user's tool handler. */
export interface HoloToolCallInfo {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

/**
 * The result returned by a tool handler, sent back to the model as a tool message.
 * @see {@link HoloContentToolResult} for the content-block representation.
 */
export interface HoloToolResult {
    tool_call_id: string;
    content: string | HoloContent[];
    is_error?: boolean;
}

/**
 * Configuration for {@link HoloToolRunner}.
 *
 * @example
 * ```ts
 * const runner = client.chat.runner({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'What is the weather in SF?' }],
 *   tools: [weatherTool],
 *   toolHandler: async (call) => {
 *     const result = await executeWeatherLookup(call.arguments);
 *     return { tool_call_id: call.id, content: JSON.stringify(result) };
 *   },
 * });
 * const response = await runner.finalResponse();
 * ```
 */
export interface HoloToolRunnerOptions {
    messages: HoloMessage[];
    tools: HoloTool[];
    /** Async callback invoked for each tool call. Return the result to feed back to the model. */
    toolHandler: (call: HoloToolCallInfo) => Promise<HoloToolResult>;
    model?: string;
    application?: string;
    provider?: string;
    thread_id?: string;
    branch?: string;
    temperature?: number;
    max_tokens?: number;
    tool_choice?: HoloToolChoice;
    /** Maximum number of tool-call round-trips before returning the last response (default: 50). */
    maxIterations?: number;
}

type EventHandler<T> = (data: T) => void;

type RunnerEventMap = {
    'text.delta': string;
    'tool_calls': HoloToolCallInfo[];
    'tool_result': { id: string; result: HoloToolResult };
    'iteration': { index: number; response: HoloResponse };
    'error': Error;
};

type RunnerEventType = keyof RunnerEventMap;

/**
 * Agentic tool-use loop that streams requests, executes tool calls, and feeds results back until the model stops calling tools.
 *
 * @remarks Create via {@link ChatNamespace.runner} rather than constructing directly.
 *
 * @see {@link HoloToolRunnerOptions} for configuration.
 * @see {@link HoloStream} for the underlying streaming interface.
 */
export class HoloToolRunner {
    private readonly options: HoloToolRunnerOptions;
    private readonly streamFn: (params: any) => Promise<HoloStream>;
    private handlers = new Map<RunnerEventType, EventHandler<any>[]>();
    private abortController = new AbortController();
    private aborted = false;

    constructor(
        streamFn: (params: any) => Promise<HoloStream>,
        options: HoloToolRunnerOptions,
    ) {
        this.streamFn = streamFn;
        this.options = options;
    }

    /** Register an event handler for runner lifecycle events. */
    on<K extends RunnerEventType>(event: K, fn: EventHandler<RunnerEventMap[K]>): this {
        const handlers = this.handlers.get(event) ?? [];
        handlers.push(fn);
        this.handlers.set(event, handlers);
        return this;
    }

    /** Abort the runner, cancelling any in-flight stream. */
    abort(): void {
        this.aborted = true;
        this.abortController.abort();
    }

    /** Execute the tool loop and return the final model response (after all tool calls are resolved). */
    async finalResponse(): Promise<HoloResponse> {
        const maxIterations = this.options.maxIterations ?? 50;
        const messages = [...this.options.messages];
        let lastResponse: HoloResponse | undefined;

        for (let i = 0; i < maxIterations; i++) {
            if (this.aborted) {
                throw new Error('Runner aborted');
            }

            const stream = await this.streamFn({
                model: this.options.model,
                messages,
                tools: this.options.tools,
                tool_choice: this.options.tool_choice,
                application: this.options.application,
                provider: this.options.provider,
                thread_id: this.options.thread_id,
                branch: this.options.branch,
                temperature: this.options.temperature,
                max_tokens: this.options.max_tokens,
            });

            stream.on('response.output_text.delta', (delta: string) => {
                this.emit('text.delta', delta);
            });

            const response = await stream.finalResponse();
            lastResponse = response;

            this.emit('iteration', {index: i, response});

            if (response.finish_reason !== 'tool_calls') {
                return response;
            }

            const toolCalls = this.extractToolCalls(response);
            if (toolCalls.length === 0) {
                return response;
            }

            this.emit('tool_calls', toolCalls);

            const assistantMessage = response.output?.[response.output.length - 1];
            if (assistantMessage) {
                messages.push(assistantMessage);
            }

            const results = await Promise.all(
                toolCalls.map(async (call) => {
                    const result = await this.options.toolHandler(call);
                    this.emit('tool_result', {id: call.id, result});
                    return result;
                }),
            );

            for (const result of results) {
                const toolMessage: HoloMessage = {
                    role: 'tool',
                    content: result.content,
                    tool_call_id: result.tool_call_id,
                };
                messages.push(toolMessage);
            }
        }

        if (lastResponse) return lastResponse;
        throw new Error('Runner did not produce a response');
    }

    private extractToolCalls(response: HoloResponse): HoloToolCallInfo[] {
        const calls: HoloToolCallInfo[] = [];

        if (response.output) {
            for (const msg of response.output) {
                if (msg.tool_calls) {
                    for (const tc of msg.tool_calls) {
                        calls.push({
                            id: tc.id ?? '',
                            name: tc.function.name,
                            arguments: tc.function.arguments,
                        });
                    }
                }

                if (Array.isArray(msg.content)) {
                    for (const block of msg.content) {
                        if ((block as HoloContentToolCall).type === 'tool_call') {
                            const tc = block as HoloContentToolCall;
                            calls.push({
                                id: tc.id ?? '',
                                name: tc.name,
                                arguments: tc.arguments,
                            });
                        }
                    }
                }
            }
        }

        return calls;
    }

    private emit<K extends RunnerEventType>(event: K, data: RunnerEventMap[K]): void {
        const handlers = this.handlers.get(event);
        if (!handlers?.length) return;
        for (const h of handlers) {
            try {
                h(data);
            } catch (e) {
                this.emit('error', e instanceof Error ? e : new Error(String(e)));
            }
        }
    }
}
