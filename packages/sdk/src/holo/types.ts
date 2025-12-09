import {RequestType} from "@holokai/sdk/provider";

export interface HoloContentText {
    type: 'text';
    text: string;
}

export interface HoloContentImage {
    type: 'image';
    url: string;          // HTTPS URL or base64 data: URI
    mime?: string;        // MIME type for base64 payloads, e.g., "image/png"
    alt_text?: string;    // Accessibility text (portable; safe to drop on emit)
}

// Union of all portable content types
export type HoloContent = HoloContentText | HoloContentImage;

// ---------- Tool calling (portable) ----------
export interface HoloToolFunctionCall {
    name: string;
    arguments: Record<string, unknown>;   // JSON-serializable
}

export interface HoloToolCall {
    id?: string;                          // Assigned by the model/provider
    type: 'function';
    function: HoloToolFunctionCall;
}

// ---------- Messages ----------
export interface HoloMessage {
    role: 'user' | 'assistant' | 'tool';  // No 'developer' here; use top-level system
    content: string | HoloContent[];      // Plain text or structured portable content

    // Portable tool-calling fields:
    // - Present ONLY when role === 'assistant'
    tool_calls?: HoloToolCall[];

    // - Present ONLY when role === 'tool'
    tool_call_id?: string;
    name?: string;                        // Optional author/attribution (OpenAI-compatible)
}

// ---------- Tool definitions ----------
export interface HoloTool {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>; // JSON Schema object (optional)
}

export type HoloToolChoice =
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'specific'; name: string }; // Specific tool to use

// ---------- Response format ----------
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

// ---------- Metadata ----------
export interface HoloRequestMetadata {
    user_id?: string | null;
}

// ---------- Holo Request (portable chat surface) ----------
export interface HoloRequest {
    // 🟢 COMMON (All Providers)
    request_type?: RequestType;           // CAN be set, but default is chat, so set to generate if using ollama
    model: string;                        // Required
    messages?: HoloMessage[];
    temperature?: number;                 // 0.0–2.0 (provider-dependent caps)
    top_p?: number;                       // 0.0–1.0
    stream?: boolean;
    tools?: HoloTool[];

    // 🟡 MAPPED (≥2 Providers)
    system?: string;                      // System prompt (top-level)
    max_tokens?: number;                  // Claude/OpenAI
    stop_sequences?: string[];            // Normalize to array
    response_format?: HoloResponseFormat;
    service_tier?: 'auto' | 'default' | 'standard_only';  // OpenAI / Claude
    tool_choice?: HoloToolChoice;
    top_k?: number;                       // Claude/Ollama
    frequency_penalty?: number;           // OpenAI/Ollama
    presence_penalty?: number;            // OpenAI/Ollama
    seed?: number;                        // OpenAI/Ollama
    metadata?: HoloRequestMetadata | null;
}

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
