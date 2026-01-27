// ---------- Response format ----------
import {HoloMessage} from "./messages";

export interface HoloResponseFormatJsonSchema {
    type: 'json_schema';
    schema: Record<string, unknown>;      // Required for json_schema
    strict?: boolean;                     // Schema enforcement (OpenAI-compatible)
}

export interface HoloResponseFormatJsonObject {
    type: 'json_object';
}

export interface HoloResponseFormatText {
    type: 'text';
}

export type HoloResponseFormat =
    | HoloResponseFormatText
    | HoloResponseFormatJsonObject
    | HoloResponseFormatJsonSchema;

// ---------- Usage & Performance (portable superset) ----------
export interface HoloUsage {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    service_tier?: 'standard' | 'priority' | 'batch' | 'auto' | 'default' | 'flex' | 'scale';
    timings?: {
        total?: number;       // ns (Ollama)
        load?: number;        // ns
        prompt_eval?: number; // ns
        eval?: number;        // ns
    };
}

// ---------- Finish reasons (portable only) ----------
export type HoloFinishReason =
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null;

// ---------- Main Holo Response (portable fields only) ----------
export interface HoloResponse {
    // 🟢 Common, cross-provider
    id?: string;              // present on Claude/OpenAI; Ollama may omit
    model: string;            // required by all
    messages: HoloMessage[];  // normalized: first is the assistant reply

    // 🟡 Functional equivalents
    created?: number | Date;  // OpenAI epoch seconds; Ollama ISO8601 → normalize upstream if desired
    finish_reason?: HoloFinishReason;
    service_tier?: string;

    // 🟠 Usage
    usage?: HoloUsage;
}

// ---------- StreamingDeltaType (TS) ----------
export type HoloStreamingDeltaType =
    | 'message_start'
    | 'content_delta'
    | 'message_delta'
    | 'message_stop';

export interface HoloStreamingDelta {
    provider: string;
    type: HoloStreamingDeltaType;
    index?: number;    // Claude content block idx or OpenAI tool_calls idx
    choice?: number;   // OpenAI multi-choice
    delta: Partial<HoloMessage>;
    usage?: HoloUsage | null;
    provider_delta?: any;
}

export interface HoloStreamChunk {
    id?: string;
    model?: string;
    created?: number;     // epoch ms
    delta?: HoloStreamingDelta;
    done?: boolean;
    finish_reason?: HoloFinishReason;
    usage?: HoloUsage;
}
