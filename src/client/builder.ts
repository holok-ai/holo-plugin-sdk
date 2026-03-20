import type {
    HoloContent,
    HoloContentToolResult,
    HoloMessage,
    HoloRequest,
    HoloRequestMetadata,
    HoloResponse,
    HoloResponseFormat,
    HoloTool,
    HoloToolChoice,
} from '@holokai/holo-types/holo';
import type {HoloStream} from './stream';

export type SendFn = (request: HoloRequest) => Promise<HoloResponse>;
export type StreamFn = (request: HoloRequest) => Promise<HoloStream>;

/**
 * Fluent builder for constructing and sending {@link HoloRequest} objects.
 *
 * @remarks Create via {@link ChatNamespace.builder} rather than constructing directly.
 *
 * @example
 * ```ts
 * const response = await client.chat.builder()
 *   .model('gpt-4o')
 *   .user('Summarize this article')
 *   .temperature(0.3)
 *   .send();
 * ```
 *
 * @see {@link HoloRequest} for the underlying request shape.
 */
export class HoloRequestBuilder {
    private _model?: string;
    private _application?: string;
    private _messages: HoloMessage[] = [];
    private _temperature?: number;
    private _maxTokens?: number;
    private _topP?: number;
    private _topK?: number;
    private _frequencyPenalty?: number;
    private _presencePenalty?: number;
    private _seed?: number;
    private _stopSequences?: string[];
    private _tools?: HoloTool[];
    private _toolChoice?: HoloToolChoice;
    private _responseFormat?: HoloResponseFormat;
    private _metadata?: HoloRequestMetadata | null;
    private _serviceTier?: 'auto' | 'default' | 'standard_only';
    private _provider?: string;
    private _threadId?: string;
    private _branch?: string;

    constructor(
        private readonly sendFn: SendFn,
        private readonly streamFn: StreamFn,
        defaults?: { model?: string; application?: string },
    ) {
        if (defaults?.model) this._model = defaults.model;
        if (defaults?.application) this._application = defaults.application;
    }

    model(name: string): this {
        this._model = name;
        return this;
    }

    application(slug: string): this {
        this._application = slug;
        return this;
    }

    system(content: string): this {
        this._messages.push({role: 'system', content});
        return this;
    }

    user(content: string | HoloContent[]): this {
        this._messages.push({role: 'user', content});
        return this;
    }

    assistant(content: string | HoloContent[]): this {
        this._messages.push({role: 'assistant', content});
        return this;
    }

    /** Append a tool result message. Use this to feed tool outputs back into the conversation. */
    tool(result: HoloContentToolResult): this {
        this._messages.push({role: 'tool', content: result.content, tool_call_id: result.tool_call_id});
        return this;
    }

    messages(msgs: HoloMessage[]): this {
        this._messages.push(...msgs);
        return this;
    }

    temperature(v: number): this {
        this._temperature = v;
        return this;
    }

    maxTokens(v: number): this {
        this._maxTokens = v;
        return this;
    }

    topP(v: number): this {
        this._topP = v;
        return this;
    }

    topK(v: number): this {
        this._topK = v;
        return this;
    }

    frequencyPenalty(v: number): this {
        this._frequencyPenalty = v;
        return this;
    }

    presencePenalty(v: number): this {
        this._presencePenalty = v;
        return this;
    }

    seed(v: number): this {
        this._seed = v;
        return this;
    }

    stopSequences(s: string[]): this {
        this._stopSequences = s;
        return this;
    }

    tools(t: HoloTool[]): this {
        this._tools = t;
        return this;
    }

    toolChoice(c: HoloToolChoice): this {
        this._toolChoice = c;
        return this;
    }

    responseFormat(f: HoloResponseFormat): this {
        this._responseFormat = f;
        return this;
    }

    /** Shorthand to set `response_format` to `json_object` (valid JSON, no schema). */
    json(): this {
        this._responseFormat = {type: 'json_object'};
        return this;
    }

    /** Shorthand to set `response_format` to `json_schema` with strict validation. */
    jsonSchema(schema: Record<string, unknown>): this {
        this._responseFormat = {type: 'json_schema', schema, strict: true};
        return this;
    }

    metadata(m: HoloRequestMetadata | null): this {
        this._metadata = m;
        return this;
    }

    serviceTier(tier: 'auto' | 'default' | 'standard_only'): this {
        this._serviceTier = tier;
        return this;
    }

    provider(nameOrId: string): this {
        this._provider = nameOrId;
        return this;
    }

    threadId(id: string): this {
        this._threadId = id;
        return this;
    }

    branch(id: string): this {
        this._branch = id;
        return this;
    }

    /** Assemble the current builder state into a {@link HoloRequest} without sending it. */
    build(): HoloRequest {
        const model = this._model;
        if (!model) {
            throw new Error('No model specified. Set a model via .model() or provide a defaultModel in HoloClientOptions.');
        }

        const request: HoloRequest = {
            model,
            messages: this._messages,
        };

        if (this._application) request.application = this._application;
        if (this._provider) request.provider = this._provider;
        if (this._temperature !== undefined) request.temperature = this._temperature;
        if (this._maxTokens !== undefined) request.max_tokens = this._maxTokens;
        if (this._topP !== undefined) request.top_p = this._topP;
        if (this._topK !== undefined) request.top_k = this._topK;
        if (this._frequencyPenalty !== undefined) request.frequency_penalty = this._frequencyPenalty;
        if (this._presencePenalty !== undefined) request.presence_penalty = this._presencePenalty;
        if (this._seed !== undefined) request.seed = this._seed;
        if (this._stopSequences) request.stop_sequences = this._stopSequences;
        if (this._tools) request.tools = this._tools;
        if (this._toolChoice) request.tool_choice = this._toolChoice;
        if (this._responseFormat) request.response_format = this._responseFormat;
        if (this._metadata !== undefined) request.metadata = this._metadata;
        if (this._serviceTier) request.service_tier = this._serviceTier;
        if (this._threadId) request.thread_id = this._threadId;
        if (this._branch) request.branch = this._branch;

        return request;
    }

    /** Build and send the request, returning the complete {@link HoloResponse}. */
    async send(): Promise<HoloResponse> {
        return this.sendFn(this.build());
    }

    /** Build and send the request as a streaming call, returning a {@link HoloStream}. */
    async stream(): Promise<HoloStream> {
        const request = this.build();
        request.stream = true;
        return this.streamFn(request);
    }
}
