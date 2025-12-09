/**
 * @holokai/sdk/holo - Holo universal format types
 *
 * Holo format serves as the universal translation hub in the hub-and-spoke pattern.
 * It prevents N² translations between providers by standardizing on a portable format.
 * All provider translations go through Holo format: Provider → Holo → Provider
 *
 * These types are designed to handle the full complexity of the legacy system
 * to enable plugins to eventually replace legacy providers.
 */

// ============================================================================
// Content Types (Portable)
// ============================================================================

/**
 * Text content type
 */
export interface HoloContentText {
    type: 'text';
    text: string;
}

/**
 * Image content type
 */
export interface HoloContentImage {
    type: 'image';
    url: string;          // HTTPS URL or base64 data: URI
    mime?: string;        // MIME type for base64 payloads, e.g., "image/png"
    alt_text?: string;    // Accessibility text (portable; safe to drop on emit)
}

/**
 * Union of all portable content types
 */
export type HoloContent = HoloContentText | HoloContentImage;

// ============================================================================
// Tool/Function Types
// ============================================================================

/**
 * JSON-serializable function arguments
 * Represents the arguments passed to a function/tool call
 */
export interface HoloFunctionArguments {
    [key: string]: string | number | boolean | null | HoloFunctionArguments | HoloFunctionArguments[];
}

/**
 * Function call within a tool call
 */
export interface HoloToolFunctionCall {
    name: string;
    arguments: HoloFunctionArguments;   // JSON-serializable with proper types
}

/**
 * Tool call made by the assistant
 */
export interface HoloToolCall {
    id?: string;                          // Assigned by the model/provider
    type: 'function';
    function: HoloToolFunctionCall;
}

/**
 * JSON Schema definition for tool parameters
 * Follows JSON Schema Draft 7 specification
 */
export interface HoloJsonSchema {
    type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    properties?: { [key: string]: HoloJsonSchema };
    items?: HoloJsonSchema;
    required?: string[];
    additionalProperties?: boolean | HoloJsonSchema;
    description?: string;
    enum?: unknown[];
    default?: unknown;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
}

/**
 * Tool definition
 */
export interface HoloTool {
    name: string;
    description?: string;
    parameters?: HoloJsonSchema; // Properly typed JSON Schema object
}

/**
 * Tool choice configuration
 */
export type HoloToolChoice =
    | { type: 'auto' }
    | { type: 'none' }
    | { type: 'required' }
    | { type: 'specific'; name: string }; // Specific tool to use

// ============================================================================
// Response Format Types
// ============================================================================

/**
 * JSON Schema response format
 */
export interface HoloResponseFormatJsonSchema {
    type: 'json_schema';
    schema: HoloJsonSchema;              // Properly typed JSON Schema
    strict?: boolean;                     // Schema enforcement (OpenAI-compatible)
}

/**
 * JSON Object response format
 */
export interface HoloResponseFormatJsonObject {
    type: 'json_object';
}

/**
 * Text response format
 */
export interface HoloResponseFormatText {
    type: 'text';
}

/**
 * Union of response format types
 */
export type HoloResponseFormat =
    | HoloResponseFormatText
    | HoloResponseFormatJsonObject
    | HoloResponseFormatJsonSchema;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request metadata
 */
export interface HoloRequestMetadata {
    user_id?: string | null;
}

/**
 * Request type enum
 */
export type RequestType = 'chat' | 'generate';

/**
 * HoloMessage - Universal message format
 *
 * Represents a single message in a conversation. Supports all role types
 * including tool interactions and multimodal content.
 */
export interface HoloMessage {
    /** The role of the message author */
    role: 'user' | 'assistant' | 'tool';  // No 'developer' here; use top-level system

    /** Message content - plain text or structured portable content */
    content: string | HoloContent[];

    /** Portable tool-calling fields - Present ONLY when role === 'assistant' */
    tool_calls?: HoloToolCall[];

    /** Present ONLY when role === 'tool' */
    tool_call_id?: string;

    /** Optional author/attribution (OpenAI-compatible) */
    name?: string;
}

/**
 * HoloRequest - Universal input format for LLM requests (portable chat surface)
 *
 * This interface provides a comprehensive format that covers all provider capabilities
 * while maintaining portability across different LLM providers.
 *
 * @example
 * ```typescript
 * const request: HoloRequest = {
 *   model: 'gpt-4',
 *   messages: [
 *     { role: 'user', content: 'Hello, how are you?' }
 *   ],
 *   temperature: 0.7,
 *   max_tokens: 1000
 * };
 * ```
 */
export interface HoloRequest {
    // 🟢 COMMON (All Providers)
    /** Request type (default: chat) */
    request_type?: RequestType;

    /** Model identifier (required) */
    model: string;

    /** Array of messages forming the conversation */
    messages?: HoloMessage[];

    /** Sampling temperature between 0 and 2 */
    temperature?: number;

    /** Nucleus sampling parameter */
    top_p?: number;

    /** Whether to stream the response */
    stream?: boolean;

    /** List of tools available to the model */
    tools?: HoloTool[];

    // 🟡 MAPPED (≥2 Providers)
    /** System prompt (top-level) */
    system?: string;

    /** Maximum tokens to generate */
    max_tokens?: number;

    /** Stop sequences */
    stop_sequences?: string[];

    /** Response format configuration */
    response_format?: HoloResponseFormat;

    /** Service tier selection */
    service_tier?: 'auto' | 'default' | 'standard_only';

    /** Tool choice configuration */
    tool_choice?: HoloToolChoice;

    /** Top-k sampling (Claude/Ollama) */
    top_k?: number;

    /** Frequency penalty (OpenAI/Ollama) */
    frequency_penalty?: number;

    /** Presence penalty (OpenAI/Ollama) */
    presence_penalty?: number;

    /** Seed for deterministic sampling */
    seed?: number;

    /** Request metadata */
    metadata?: HoloRequestMetadata | null;

    // Additional OpenAI-compatible fields for full compatibility
    /** Number of completions to generate */
    n?: number;

    /** Modify likelihood of specific tokens */
    logit_bias?: Record<string, number>;

    /** Unique identifier for end-user */
    user?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Usage & Performance (portable superset)
 */
export interface HoloUsage {
    /** Input tokens count */
    input_tokens?: number;

    /** Output tokens count */
    output_tokens?: number;

    /** Total tokens (input + output) */
    total_tokens?: number;

    /** Cache read tokens (Claude) */
    cache_read_tokens?: number;

    /** Cache write tokens (Claude) */
    cache_write_tokens?: number;

    /** Service tier used */
    service_tier?: 'standard' | 'priority' | 'batch' | 'auto' | 'default' | 'flex' | 'scale';

    /** Timing information (Ollama) */
    timings?: {
        total?: number;       // ns
        load?: number;        // ns
        prompt_eval?: number; // ns
        eval?: number;        // ns
    };

    // Also support OpenAI naming convention
    prompt_tokens?: number;
    completion_tokens?: number;
}

/**
 * Finish reasons (portable)
 */
export type HoloFinishReason =
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null;

/**
 * HoloResponse - Universal output format for LLM responses (portable fields only)
 *
 * Standardized response format that all providers translate their native
 * responses into. This ensures consistent handling across the system.
 *
 * @example
 * ```typescript
 * const response: HoloResponse = {
 *   id: 'chatcmpl-123',
 *   model: 'gpt-4',
 *   messages: [
 *     { role: 'assistant', content: 'Hello! I'm doing well.' }
 *   ],
 *   usage: {
 *     input_tokens: 10,
 *     output_tokens: 8,
 *     total_tokens: 18
 *   }
 * };
 * ```
 */
export interface HoloResponse {
    // 🟢 Common, cross-provider
    /** Unique identifier (present on Claude/OpenAI; Ollama may omit) */
    id?: string;

    /** Model used (required by all) */
    model: string;

    /** Messages array - normalized: first is the assistant reply */
    messages: HoloMessage[];

    // 🟡 Functional equivalents
    /** Creation timestamp (OpenAI epoch seconds; Ollama ISO8601) */
    created?: number | Date;

    /** Reason the model stopped generating */
    finish_reason?: HoloFinishReason;

    /** Service tier used */
    service_tier?: string;

    // 🟠 Usage
    /** Token usage statistics */
    usage?: HoloUsage;

    // OpenAI compatibility fields
    /** Object type (for OpenAI compatibility) */
    object?: string;

    /** Choices array (for OpenAI compatibility) */
    choices?: HoloChoice[];

    /** System fingerprint for debugging */
    system_fingerprint?: string;
}

/**
 * HoloChoice - Represents a single completion choice (OpenAI compatibility)
 */
export interface HoloChoice {
    /** Index of this choice in the array */
    index: number;

    /** The message generated by the model */
    message: HoloMessage;

    /** The reason the model stopped generating tokens */
    finish_reason?: HoloFinishReason;

    /** Log probabilities (when requested) */
    logprobs?: {
        content: Array<{
            token: string;
            logprob: number;
            bytes: number[] | null;
            top_logprobs: Array<{
                token: string;
                logprob: number;
                bytes: number[] | null;
            }>;
        }> | null;
    } | null;
}

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Provider type for streaming
 */
export type StreamingProviderType = 'claude' | 'openai' | 'ollama' | 'holo';

/**
 * Streaming delta type
 */
export type HoloStreamingDeltaType =
    | 'message_start'
    | 'content_delta'
    | 'message_delta'
    | 'message_stop';

/**
 * Provider-specific delta data for debugging
 * Each provider may have different structures
 */
export type HoloProviderDelta =
    | { provider: 'claude'; data: object }
    | { provider: 'openai'; data: object }
    | { provider: 'ollama'; data: object }
    | { provider: 'holo'; data: object };

/**
 * HoloStreamingDelta - Normalized streaming delta
 */
export interface HoloStreamingDelta {
    /** Provider that generated this delta */
    provider: StreamingProviderType;

    /** Type of delta */
    type: HoloStreamingDeltaType;

    /** Claude content block idx or OpenAI tool_calls idx */
    index?: number;

    /** OpenAI multi-choice index */
    choice?: number;

    /** Delta content */
    delta: Partial<HoloMessage>;

    /** Usage information */
    usage?: HoloUsage | null;

    /** Raw provider delta (for debugging) */
    provider_delta?: HoloProviderDelta;
}

/**
 * HoloStreamChunk - Streaming response chunk
 */
export interface HoloStreamChunk {
    /** Unique identifier */
    id?: string;

    /** Model used */
    model?: string;

    /** Creation timestamp (epoch ms) */
    created?: number;

    /** Delta information */
    delta?: HoloStreamingDelta;

    /** Whether streaming is complete */
    done?: boolean;

    /** Finish reason (when done) */
    finish_reason?: HoloFinishReason;

    /** Usage (when done) */
    usage?: HoloUsage;
}

/**
 * HoloStreamChoice - Represents a streaming choice delta (OpenAI compatibility)
 */
export interface HoloStreamChoice {
    /** Index of this choice */
    index: number;

    /** Delta message content */
    delta: Partial<HoloMessage>;

    /** Finish reason (only present on final chunk) */
    finish_reason?: HoloFinishReason;
}

/**
 * HoloStreamResponse - Streaming response chunk (OpenAI compatibility)
 */
export interface HoloStreamResponse {
    /** Unique identifier */
    id: string;

    /** Object type (always 'chat.completion.chunk' for streaming) */
    object: 'chat.completion.chunk';

    /** Unix timestamp */
    created: number;

    /** Model used */
    model: string;

    /** Array of choice deltas */
    choices: HoloStreamChoice[];

    /** Usage (only present on final chunk) */
    usage?: HoloUsage;
}

// ============================================================================
// Legacy Compatibility Aliases
// ============================================================================

// For backward compatibility with existing code expecting these names
export type Tool = HoloTool;
export type ToolCall = HoloToolCall;
export type FunctionDefinition = {
    name: string;
    description?: string;
    parameters?: HoloJsonSchema;
};
export type FunctionCall = HoloToolFunctionCall;
