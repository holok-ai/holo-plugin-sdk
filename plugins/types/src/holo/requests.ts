import {HoloMessage} from "./messages";
import {HoloTool, HoloToolChoice} from "./tools";
import {HoloResponseFormat} from "./responses";

/** Optional metadata attached to a request, forwarded to audit records. */
export interface HoloRequestMetadata {
    /** External user identifier for audit attribution. */
    user_id?: string | null;
}

/**
 * The normalized request sent to all Holo providers.
 *
 * @example
 * ```ts
 * const request: HoloRequest = {
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   temperature: 0.7,
 * };
 * ```
 *
 * @see {@link HoloResponse} for the corresponding output type.
 * @see {@link HoloRequestBuilder} for a fluent API to construct requests.
 */
export interface HoloRequest {
    model: string;
    messages?: HoloMessage[];
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    tools?: HoloTool[];
    system?: string;
    max_tokens?: number;
    stop_sequences?: string[];
    response_format?: HoloResponseFormat;
    service_tier?: 'auto' | 'default' | 'standard_only';
    tool_choice?: HoloToolChoice;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    seed?: number;
    metadata?: HoloRequestMetadata | null;
    /** Route to a specific provider by name or UUID. */
    provider?: string;
    /** Conversation thread ID for multi-turn tracking. */
    thread_id?: string;
    /** Branch within a thread for A/B or parallel conversations. */
    branch?: string;
    /** Application slug — selects the system prompt, guards, and default model. */
    application?: string;
}
