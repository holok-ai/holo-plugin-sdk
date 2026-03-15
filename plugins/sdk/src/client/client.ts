import type {HoloContent, HoloMessage, HoloRequest, HoloResponse} from '@holokai/types/holo';
import type {HoloApplicationInfo, HoloChatParams, HoloClientOptions, HoloModelInfo} from './types';
import {HoloApiError} from './errors';
import {HoloStream} from './stream';
import {HoloRequestBuilder} from './builder';
import type {HoloToolRunnerOptions} from './runner';
import {HoloToolRunner} from './runner';
import {parseSSEStream} from './sse';

/**
 * Main entry point for the Holo SDK. Provides namespaced access to chat, models, and applications APIs.
 *
 * @example
 * ```ts
 * import { HoloClient } from '@holokai/sdk';
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
    readonly models: ModelsNamespace;
    readonly applications: ApplicationsNamespace;
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly defaultModel?: string;
    private readonly defaultApplication?: string;
    private readonly _fetch: typeof globalThis.fetch;

    constructor(options: HoloClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.token = options.token;
        if (options.defaultModel) this.defaultModel = options.defaultModel;
        if (options.defaultApplication) this.defaultApplication = options.defaultApplication;
        this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);

        this.chat = new ChatNamespace(this);
        this.models = new ModelsNamespace(this);
        this.applications = new ApplicationsNamespace(this);
    }

    async request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
        const url = `${this.baseUrl}/holo/api/v1${path}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };

        const init: RequestInit = {method, headers};
        if (body) init.body = JSON.stringify(body);
        if (signal) init.signal = signal;

        const response = await this._fetch(url, init);

        if (!response.ok) {
            let errorBody: unknown;
            try {
                errorBody = await response.json();
            } catch {
                errorBody = await response.text();
            }
            throw new HoloApiError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                undefined,
                errorBody,
            );
        }

        return response.json() as Promise<T>;
    }

    async streamRequest(path: string, body: unknown, signal?: AbortSignal): Promise<{
        body: ReadableStream<Uint8Array>;
        response: Response;
    }> {
        const url = `${this.baseUrl}/holo/api/v1${path}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };

        const init: RequestInit = {method: 'POST', headers, body: JSON.stringify(body)};
        if (signal) init.signal = signal;

        const response = await this._fetch(url, init);

        if (!response.ok) {
            let errorBody: unknown;
            try {
                errorBody = await response.json();
            } catch {
                errorBody = await response.text();
            }
            throw new HoloApiError(
                `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                undefined,
                errorBody,
            );
        }

        if (!response.body) {
            throw new HoloApiError('No response body for stream', 500);
        }

        return {body: response.body, response};
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
        const request: HoloRequest = {
            model: params.model ?? defaults.model ?? '',
            messages: params.messages,
            stream,
        };
        if (params.temperature !== undefined) request.temperature = params.temperature;
        if (params.max_tokens !== undefined) request.max_tokens = params.max_tokens;
        if (params.tools) request.tools = params.tools;
        if (params.tool_choice) request.tool_choice = params.tool_choice;
        if (params.response_format) request.response_format = params.response_format;
        if (params.provider) request.provider = params.provider;
        const app = params.application ?? defaults.application;
        if (app) request.application = app;
        if (params.thread_id) request.thread_id = params.thread_id;
        if (params.branch) request.branch = params.branch;
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

/** Namespace for listing available models. */
class ModelsNamespace {
    constructor(private readonly client: HoloClient) {
    }

    /** List all models available to the authenticated user. */
    async list(): Promise<HoloModelInfo[]> {
        const result = await this.client.request<ApiListResponse<HoloModelInfo>>('GET', '/models');
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
