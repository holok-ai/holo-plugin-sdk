import type {
    HoloContent,
    HoloCountTokensParams,
    HoloCountTokensResponse,
    HoloEmbedParams,
    HoloEmbedResponse,
    HoloGenerateParams,
    HoloMessage,
    HoloModelListParams,
    HoloPagedResponse,
    HoloRequest,
    HoloResponse,
    HoloThread,
    HoloThreadCreateParams,
    HoloThreadListParams,
    HoloThreadMessage,
    HoloThreadMessageListParams,
    HoloThreadUpdateParams
} from '@holokai/holo-types/holo';
import type {HoloApplicationInfo, HoloChatParams, HoloClientOptions, HoloModelInfo} from './types';
import {HoloStream} from './stream';
import {HoloRequestBuilder} from './builder';
import type {HoloToolRunnerOptions} from './runner';
import {HoloToolRunner} from './runner';
import {parseSSEStream} from './sse';
import {FetchTransport} from './transport';

/**
 * Main entry point for the Holo SDK. Provides namespaced access to chat, models, and applications APIs.
 *
 * @example
 * ```ts
 * import { HoloClient } from '@holokai/holo-sdk';
 *
 * const client = new HoloClient({
 *   baseUrl: 'https://holo.example.com',
 *   token: 'my-token',
 *   defaultModel: 'gpt-4o',
 * });
 *
 * // Simple request
 * const response = await client.chat.create({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 *
 * // Streaming
 * const stream = await client.chat.stream({
 *   messages: [{ role: 'user', content: 'Tell me a story' }],
 * });
 * for await (const event of stream) { ... }
 *
 * // Fluent builder
 * const res = await client.chat.builder()
 *   .user('Summarize this')
 *   .temperature(0.3)
 *   .send();
 * ```
 *
 * @see {@link HoloClientOptions} for configuration.
 * @see {@link ChatNamespace} for chat completions, streaming, tool runners, and builders.
 */
export class HoloClient {
    readonly chat: ChatNamespace;
    readonly generate: GenerateNamespace;
    readonly embed: EmbedNamespace;
    readonly metrics: MetricsNamespace;
    readonly models: ModelsNamespace;
    readonly applications: ApplicationsNamespace;
    readonly threads: ThreadsNamespace;
    private readonly transport: FetchTransport;
    private readonly defaultModel?: string;
    private readonly defaultApplication?: string;

    constructor(options: HoloClientOptions) {
        this.transport = new FetchTransport({
            baseUrl: options.baseUrl,
            token: options.token,
            fetch: options.fetch,
            timeout: options.timeout,
        });
        if (options.defaultModel) this.defaultModel = options.defaultModel;
        if (options.defaultApplication) this.defaultApplication = options.defaultApplication;

        this.chat = new ChatNamespace(this);
        this.generate = new GenerateNamespace(this);
        this.embed = new EmbedNamespace(this);
        this.metrics = new MetricsNamespace(this);
        this.models = new ModelsNamespace(this);
        this.applications = new ApplicationsNamespace(this);
        this.threads = new ThreadsNamespace(this);
    }

    async request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
        return this.transport.request<T>({method, path, body, signal});
    }

    async streamRequest(path: string, body: unknown, signal?: AbortSignal): Promise<{
        body: ReadableStream<Uint8Array>;
        response: Response;
    }> {
        return this.transport.streamRequest({path, body, signal});
    }

    getDefaults(): { model?: string; application?: string } {
        const result: { model?: string; application?: string } = {};
        if (this.defaultModel) result.model = this.defaultModel;
        if (this.defaultApplication) result.application = this.defaultApplication;
        return result;
    }
}

/**
 * Chat completions namespace — send messages, stream responses, and run tool loops.
 *
 * @see {@link HoloClient.chat}
 */
class ChatNamespace {
    constructor(private readonly client: HoloClient) {
    }

    /** Send a chat completion request and return the full response. */
    async create(params: HoloChatParams): Promise<HoloResponse> {
        const request = this.paramsToRequest(params, false);
        return this.client.request<HoloResponse>('POST', '/chat', request);
    }

    /**
     * Send a streaming chat completion request.
     * @see {@link HoloStream} for how to consume the returned stream.
     */
    async stream(params: HoloChatParams): Promise<HoloStream> {
        const abortController = new AbortController();
        const request = this.paramsToRequest(params, true);

        const {body} = await this.client.streamRequest('/chat', request, abortController.signal);
        const events = parseSSEStream(body, abortController.signal);
        return new HoloStream(events, abortController);
    }

    /** Cancel an in-flight chat request by ID. */
    async cancel(id: string): Promise<void> {
        await this.client.request('POST', `/chat/${id}/cancel`);
    }

    /**
     * Create a {@link HoloToolRunner} for agentic tool-use loops.
     * @see {@link HoloToolRunnerOptions} for configuration.
     */
    runner(options: HoloToolRunnerOptions): HoloToolRunner {
        return new HoloToolRunner(
            (params) => this.stream(params),
            options,
        );
    }

    /**
     * Create a {@link HoloRequestBuilder} for fluent request construction.
     * Inherits `defaultModel` and `defaultApplication` from the client.
     */
    builder(): HoloRequestBuilder {
        return new HoloRequestBuilder(
            (request) => this.client.request<HoloResponse>('POST', '/chat', request),
            async (request) => {
                const abortController = new AbortController();
                const {body} = await this.client.streamRequest('/chat', request, abortController.signal);
                const events = parseSSEStream(body, abortController.signal);
                return new HoloStream(events, abortController);
            },
            this.client.getDefaults(),
        );
    }

    /** Shortcut: create a builder pre-seeded with a user message. */
    user(content: string | HoloContent[]): HoloRequestBuilder {
        return this.builder().user(content);
    }

    /** Shortcut: create a builder pre-seeded with a system message. */
    system(content: string): HoloRequestBuilder {
        return this.builder().system(content);
    }

    /** Shortcut: create a builder pre-seeded with an assistant message. */
    assistant(content: string | HoloContent[]): HoloRequestBuilder {
        return this.builder().assistant(content);
    }

    /** Shortcut: create a builder with the model already set. */
    model(name: string): HoloRequestBuilder {
        return this.builder().model(name);
    }

    /** Shortcut: create a builder pre-seeded with the given messages. */
    messages(msgs: HoloMessage[]): HoloRequestBuilder {
        return this.builder().messages(msgs);
    }

    private paramsToRequest(params: HoloChatParams, stream: boolean): HoloRequest {
        const defaults = this.client.getDefaults();
        const model = params.model ?? defaults.model;
        if (!model) {
            throw new Error('No model specified. Set a model in params or provide a defaultModel in HoloClientOptions.');
        }

        const request: HoloRequest = {
            model,
            messages: params.messages,
            stream,
        };
        if (params.temperature !== undefined) request.temperature = params.temperature;
        if (params.max_tokens !== undefined) request.max_tokens = params.max_tokens;
        if (params.top_p !== undefined) request.top_p = params.top_p;
        if (params.top_k !== undefined) request.top_k = params.top_k;
        if (params.frequency_penalty !== undefined) request.frequency_penalty = params.frequency_penalty;
        if (params.presence_penalty !== undefined) request.presence_penalty = params.presence_penalty;
        if (params.seed !== undefined) request.seed = params.seed;
        if (params.stop_sequences) request.stop_sequences = params.stop_sequences;
        if (params.tools) request.tools = params.tools;
        if (params.tool_choice) request.tool_choice = params.tool_choice;
        if (params.response_format) request.response_format = params.response_format;
        if (params.metadata !== undefined) request.metadata = params.metadata;
        if (params.service_tier) request.service_tier = params.service_tier;
        if (params.provider) request.provider = params.provider;
        const app = params.application ?? defaults.application;
        if (app) request.application = app;
        if (params.thread_id) request.thread_id = params.thread_id;
        if (params.branch) request.branch = params.branch;
        if (params.protocol) request.protocol = params.protocol;
        return request;
    }
}

interface ApiListResponse<T> {
    success: boolean;
    data: T[];
}

interface ApiItemResponse<T> {
    success: boolean;
    data: T;
}

/** Namespace for prompt-in, text-out generation (e.g. ollama.generate). */
class GenerateNamespace {
    constructor(private readonly client: HoloClient) {
    }

    async create(params: HoloGenerateParams): Promise<HoloResponse> {
        return this.client.request<HoloResponse>('POST', '/generate', {...params, stream: false});
    }

    async stream(params: HoloGenerateParams): Promise<HoloStream> {
        const abortController = new AbortController();
        const body = {...params, stream: true};
        const {body: responseBody} = await this.client.streamRequest('/generate', body, abortController.signal);
        const events = parseSSEStream(responseBody, abortController.signal);
        return new HoloStream(events, abortController);
    }
}

/** Namespace for embedding requests. */
class EmbedNamespace {
    constructor(private readonly client: HoloClient) {
    }

    async create(params: HoloEmbedParams): Promise<HoloEmbedResponse> {
        return this.client.request<HoloEmbedResponse>('POST', '/embed', params);
    }
}

/** Namespace for metrics operations (e.g. token counting). */
class MetricsNamespace {
    constructor(private readonly client: HoloClient) {
    }

    async countTokens(params: HoloCountTokensParams): Promise<HoloCountTokensResponse> {
        return this.client.request<HoloCountTokensResponse>('POST', '/metrics/count-tokens', params);
    }
}

/** Namespace for listing available models. */
class ModelsNamespace {
    constructor(private readonly client: HoloClient) {
    }

    async list(params?: HoloModelListParams): Promise<HoloModelInfo[]> {
        const qs = toQueryString(params);
        const result = await this.client.request<ApiListResponse<HoloModelInfo>>('GET', `/models${qs}`);
        return result.data;
    }
}

/** Namespace for listing and inspecting applications. */
class ApplicationsNamespace {
    constructor(private readonly client: HoloClient) {
    }

    /** List all applications available to the authenticated user. */
    async list(): Promise<HoloApplicationInfo[]> {
        const result = await this.client.request<ApiListResponse<HoloApplicationInfo>>('GET', '/applications');
        return result.data;
    }

    /** Get a single application by slug. */
    async get(slug: string): Promise<HoloApplicationInfo> {
        const result = await this.client.request<ApiItemResponse<HoloApplicationInfo>>('GET', `/applications/${encodeURIComponent(slug)}`);
        return result.data;
    }
}

/** Namespace for thread management. */
class ThreadsNamespace {
    constructor(private readonly client: HoloClient) {
    }

    async list(params?: HoloThreadListParams): Promise<HoloPagedResponse<HoloThread>> {
        const qs = toQueryString(params);
        return this.client.request<HoloPagedResponse<HoloThread>>('GET', `/threads${qs}`);
    }

    async get(id: string): Promise<HoloThread> {
        const result = await this.client.request<ApiItemResponse<HoloThread>>('GET', `/threads/${encodeURIComponent(id)}`);
        return result.data;
    }

    async create(params: HoloThreadCreateParams): Promise<HoloThread> {
        const result = await this.client.request<ApiItemResponse<HoloThread>>('POST', '/threads', params);
        return result.data;
    }

    async update(id: string, params: HoloThreadUpdateParams): Promise<HoloThread> {
        const result = await this.client.request<ApiItemResponse<HoloThread>>('PATCH', `/threads/${encodeURIComponent(id)}`, params);
        return result.data;
    }

    async delete(id: string): Promise<void> {
        await this.client.request('DELETE', `/threads/${encodeURIComponent(id)}`);
    }

    async messages(id: string, params?: HoloThreadMessageListParams): Promise<HoloPagedResponse<HoloThreadMessage>> {
        const qs = toQueryString(params);
        return this.client.request<HoloPagedResponse<HoloThreadMessage>>('GET', `/threads/${encodeURIComponent(id)}/messages${qs}`);
    }
}

function toQueryString(params?: Record<string, unknown> | object): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '';
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}
