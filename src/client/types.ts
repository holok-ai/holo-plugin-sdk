import type {
    HoloApplicationInfo,
    HoloCountTokensParams,
    HoloCountTokensResponse,
    HoloEmbedParams,
    HoloEmbedResponse,
    HoloGenerateParams,
    HoloMessage,
    HoloModelInfo,
    HoloModelListParams,
    HoloRequest,
    HoloRequestMetadata,
} from '@holokai/holo-types/holo';

/** Parameters accepted by {@link ChatNamespace.create} and {@link ChatNamespace.stream}. */
export interface HoloChatParams {
    model?: string;
    messages: HoloMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    seed?: number;
    stop_sequences?: string[];
    tools?: HoloRequest['tools'];
    tool_choice?: HoloRequest['tool_choice'];
    response_format?: HoloRequest['response_format'];
    metadata?: HoloRequestMetadata | null;
    service_tier?: HoloRequest['service_tier'];
    provider?: string;
    application?: string;
    thread_id?: string;
    branch?: string;
    protocol?: string;
}

/** Configuration options for {@link HoloClient}. */
export interface HoloClientOptions {
    /** Base URL of the Holo API (e.g. `'https://holo.example.com'`). Trailing slashes are stripped. */
    baseUrl: string;
    /** Bearer token for authentication (JWT or HoloToken). */
    token: string;
    /** Model identifier used when no model is specified per-request. */
    defaultModel?: string;
    /** Application slug used when no application is specified per-request. */
    defaultApplication?: string;
    /** Custom `fetch` implementation (defaults to `globalThis.fetch`). Useful for testing or custom transports. */
    fetch?: typeof globalThis.fetch;
    /** Request timeout in milliseconds. */
    timeout?: number;
}

export type {
    HoloModelInfo, HoloApplicationInfo, HoloRequest,
    HoloGenerateParams, HoloEmbedParams, HoloEmbedResponse,
    HoloCountTokensParams, HoloCountTokensResponse, HoloModelListParams,
};
