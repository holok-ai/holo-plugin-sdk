// ---------- HoloContent (portable response content) ----------
import {HoloMessage} from "./requests";
import {
    ClaudeRawContentBlockDeltaEvent,
    ClaudeRawContentBlockStartEvent,
    ClaudeRawContentBlockStopEvent,
    ClaudeRawMessageDeltaEvent,
    ClaudeRawMessageStartEvent,
    ClaudeRawMessageStopEvent
} from "../../claude/types";
import {OpenAIChatCompletionChunk} from "../../openai/types";

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

// Union (TS)
export type HoloProviderDelta =
    | ClaudeRawMessageStartEvent
    | ClaudeRawMessageDeltaEvent
    | ClaudeRawMessageStopEvent
    | ClaudeRawContentBlockStartEvent
    | ClaudeRawContentBlockDeltaEvent
    | ClaudeRawContentBlockStopEvent
    | OpenAIChatCompletionChunk;

// ---------- StreamingDeltaType (TS) ----------
export type HoloStreamingDeltaType =
    | 'message_start'
    | 'content_delta'
    | 'message_delta'
    | 'message_stop';

export interface HoloStreamingDelta {
    provider: 'claude' | 'openai' | 'ollama';
    type: HoloStreamingDeltaType;
    index?: number;    // Claude content block idx or OpenAI tool_calls idx
    choice?: number;   // OpenAI multi-choice
    delta: Partial<HoloMessage>;
    usage?: HoloUsage | null;
    provider_delta?: HoloProviderDelta | undefined;
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
