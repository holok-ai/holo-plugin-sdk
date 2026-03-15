import type {HoloApplicationInfo, HoloModelInfo,} from '@holokai/types/holo';

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

export type {HoloModelInfo, HoloApplicationInfo};
