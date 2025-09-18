// ---------- HoloContent (portable response content) ----------
import {HoloMessage} from "./requests";

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

// ---------- Streaming (normalized) ----------
export interface HoloStreamingDelta {
    provider: 'claude' | 'openai' | 'ollama';
    type: 'message_start' | 'content_delta' | 'message_delta' | 'message_stop';
    index?: number;                 // when applicable (e.g., content block index)
    delta: Partial<HoloMessage>;    // role/content/tool_calls/etc.
    usage?: HoloUsage | null;       // often present on the final event
}

export interface HoloStreamChunk {
    id?: string;
    model: string;

    // Streaming payload
    delta?: HoloStreamingDelta;

    // Final markers (streaming only)
    done?: boolean;
    finish_reason?: HoloFinishReason;

    // Usage (often only on the last chunk)
    usage?: HoloUsage;
}
