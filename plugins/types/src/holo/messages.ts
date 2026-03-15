import {HoloContent} from "./content";
import {HoloToolCall} from "./tools";

/** A tool call that the model attempted but could not parse correctly. */
export interface HoloInvalidToolCall {
    id?: string;
    name?: string;
    /** The raw JSON string that failed to parse. */
    raw_arguments?: string;
    error: string;
}

/**
 * A single message in a conversation.
 * @see {@link HoloContent} for the typed content blocks that can appear in `content`.
 */
export interface HoloMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | HoloContent[];
    /** Convenience projection extracted from assistant content blocks. Content blocks (`HoloContent[]`) are the canonical ordered representation. */
    tool_calls?: HoloToolCall[];
    invalid_tool_calls?: HoloInvalidToolCall[];
    /** The ID of the tool call this message is responding to (when `role` is `'tool'`). */
    tool_call_id?: string;
    name?: string;
    metadata?: Record<string, unknown>;
    /** Opaque provider-specific metadata passed through without transformation. */
    provider_metadata?: Record<string, unknown>;
}
