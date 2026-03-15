/** Plain text content block. */
export interface HoloContentText {
    type: 'text';
    text: string;
}

/**
 * Image content block, provided as a URL or inline base64 data.
 * @see {@link HoloContentFile} for non-image file attachments.
 */
export interface HoloContentImage {
    type: 'image';
    url?: string;
    data?: string;
    /** Whether the image is referenced by `'url'` or embedded as `'base64'`. */
    source_type?: 'url' | 'base64';
    mime?: string;
    alt_text?: string;
}

/**
 * Model reasoning / chain-of-thought content block.
 * @remarks Some providers return an opaque {@link signature} that must be echoed back in multi-turn conversations to maintain reasoning continuity.
 */
export interface HoloContentReasoning {
    type: 'reasoning';
    text?: string;
    summary?: string;
    /** Opaque token from the provider — echo it back in follow-up requests to maintain reasoning context. */
    signature?: string;
}

/**
 * Tool invocation emitted by the model.
 * @see {@link HoloContentToolResult} for the corresponding result block.
 */
export interface HoloContentToolCall {
    type: 'tool_call';
    id?: string;
    name: string;
    arguments: Record<string, unknown>;
    /** The raw JSON string before parsing, useful when the model emits malformed JSON. */
    raw_arguments?: string;
}

/**
 * Result of a tool invocation, sent back to the model.
 * @see {@link HoloContentToolCall} for the originating call.
 */
export interface HoloContentToolResult {
    type: 'tool_result';
    tool_call_id: string;
    content: string | HoloContent[];
    is_error?: boolean;
}

/** Structured JSON content block, optionally associated with a named schema. */
export interface HoloContentJson {
    type: 'json';
    data: unknown;
    schema_name?: string;
}

/**
 * File attachment content block (non-image).
 * @see {@link HoloContentImage} for image-specific content.
 */
export interface HoloContentFile {
    type: 'file';
    url?: string;
    data?: string;
    mime?: string;
    filename?: string;
}

/**
 * Discriminated union of all content block types.
 *
 * - `text` — plain text
 * - `image` — image URL or base64
 * - `reasoning` — model chain-of-thought
 * - `tool_call` — tool invocation from the model
 * - `tool_result` — tool execution result sent back to the model
 * - `json` — structured JSON data
 * - `file` — non-image file attachment
 */
export type HoloContent =
    | HoloContentText
    | HoloContentImage
    | HoloContentReasoning
    | HoloContentToolCall
    | HoloContentToolResult
    | HoloContentJson
    | HoloContentFile;
