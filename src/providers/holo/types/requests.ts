// ---------- HoloContent (portable only) ----------
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

export interface HoloContentToolResult {
    type: 'tool_result';
    tool_call_id: string;                 // Must match the originating tool call
    content?: string | HoloContent[];     // If structured, will down-convert to text for non-structured providers
    is_error?: boolean;                   // hint; not all providers expose it
}

// Union of all portable content types
export type HoloContent = HoloContentText | HoloContentImage | HoloContentToolResult;

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
export interface HoloRequestMessage {
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
    | 'auto'
    | 'none'
    | 'required'
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
    model: string;                        // Required
    messages?: HoloRequestMessage[];
    temperature?: number;                 // 0.0–2.0 (provider-dependent caps)
    top_p?: number;                       // 0.0–1.0
    stream?: boolean;
    tools?: HoloTool[];

    // 🟡 MAPPED (≥2 Providers)
    system?: string;                      // System prompt (top-level)
    max_tokens?: number;                  // Claude/OpenAI
    max_completion_tokens?: number;       // OpenAI
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
