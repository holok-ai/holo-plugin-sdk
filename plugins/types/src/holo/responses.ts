import {HoloMessage} from "./messages";

/** Constrains the model to output JSON conforming to a provided JSON Schema. */
export interface HoloResponseFormatJsonSchema {
    type: 'json_schema';
    schema: Record<string, unknown>;
    strict?: boolean;
}

/** Constrains the model to output valid JSON (no schema enforcement). */
export interface HoloResponseFormatJsonObject {
    type: 'json_object';
}

/** Default response format — unconstrained text. */
export interface HoloResponseFormatText {
    type: 'text';
}

/**
 * Discriminated union controlling the model's output format.
 *
 * - `text` — unconstrained text (default)
 * - `json_object` — valid JSON, no schema
 * - `json_schema` — JSON conforming to the supplied schema
 */
export type HoloResponseFormat =
    | HoloResponseFormatText
    | HoloResponseFormatJsonObject
    | HoloResponseFormatJsonSchema;

/** Token usage and timing information for a request. */
export interface HoloUsage {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    /** Tokens read from the provider's prompt cache (reduces input cost). */
    cache_read_tokens?: number;
    /** Tokens written to the provider's prompt cache (one-time write cost). */
    cache_write_tokens?: number;
    service_tier?: 'standard' | 'priority' | 'batch' | 'auto' | 'default' | 'flex' | 'scale';
    /** Provider-reported timing breakdown (primarily used by Ollama). */
    timings?: {
        total?: number;
        load?: number;
        prompt_eval?: number;
        eval?: number;
    };
}

/**
 * Reason the model stopped generating.
 *
 * - `'stop'` — natural end of response
 * - `'length'` — hit `max_tokens` limit
 * - `'tool_calls'` — model invoked one or more tools
 * - `'content_filter'` — blocked by provider safety filter
 * - `'function_call'` — legacy function-call stop (OpenAI)
 * - `'error'` — generation failed
 * - `null` — reason not reported
 */
export type HoloFinishReason =
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | 'error'
    | null;

/**
 * The normalized response returned by all Holo providers.
 * @see {@link HoloRequest} for the corresponding input type.
 */
export interface HoloResponse {
    id?: string;
    model: string;
    /** One or more output messages. Most responses contain a single assistant message. */
    output: HoloMessage[];
    created?: number | Date;
    finish_reason?: HoloFinishReason;
    service_tier?: string;
    usage?: HoloUsage;
    metadata?: Record<string, unknown>;
    /** Opaque provider-specific metadata passed through without transformation. */
    provider_metadata?: Record<string, unknown>;
}

/** @internal Legacy streaming type — use HoloStreamEvent for new code. */
export type HoloStreamingDeltaType =
    | 'message_start'
    | 'content_delta'
    | 'message_delta'
    | 'message_stop';

/** @internal Legacy streaming type — use HoloStreamEvent for new code. */
export interface HoloStreamingDelta {
    provider: string;
    type: HoloStreamingDeltaType;
    index?: number;
    choice?: number;
    delta: Partial<HoloMessage>;
    usage?: HoloUsage | null;
    provider_delta?: any;
}

/** @internal Legacy streaming type — use HoloStreamEvent for new code. */
export interface HoloStreamChunk {
    id?: string;
    model?: string;
    created?: number;
    delta?: HoloStreamingDelta;
    done?: boolean;
    finish_reason?: HoloFinishReason;
    usage?: HoloUsage;
}

/**
 * Discriminated event types emitted during streaming.
 *
 * Lifecycle: `response.created` → `response.message.start` → content deltas → `response.message.stop` → `response.completed` (or `response.failed`).
 */
export type HoloStreamEventType =
    | 'response.created'
    | 'response.message.start'
    | 'response.content_block.start'
    | 'response.output_text.delta'
    | 'response.reasoning.delta'
    | 'response.tool_call.delta'
    | 'response.content_block.delta'
    | 'response.content_block.stop'
    | 'response.message.stop'
    | 'response.usage'
    | 'response.completed'
    | 'response.failed';

/**
 * A single event in a streaming response.
 * @see {@link HoloStreamEventType} for the event lifecycle.
 * @see {@link HoloStream} for the streaming interface that yields these events.
 */
export interface HoloStreamEvent {
    type: HoloStreamEventType;
    index?: number;
    /** Text or reasoning delta payload (for `output_text.delta` and `reasoning.delta` events). */
    delta?: string;
    /** Incremental tool call data (for `tool_call.delta` events). */
    tool_call_delta?: { id?: string; name?: string; arguments_delta?: string };
    /** The complete response, present on `response.created` and `response.completed`. */
    response?: HoloResponse;
    usage?: HoloUsage;
    finish_reason?: HoloFinishReason;
    error?: { message: string; code?: string };
}

/** Model metadata returned by the models API. */
export interface HoloModelInfo {
    id: string;
    name: string;
    provider_family: string;
    context_length?: number;
    capabilities: string[];
}

/** Application metadata returned by the applications API. */
export interface HoloApplicationInfo {
    slug: string;
    name: string;
    provider_family: string;
    default_model?: string;
    has_system_prompt: boolean;
    has_guards: boolean;
}
