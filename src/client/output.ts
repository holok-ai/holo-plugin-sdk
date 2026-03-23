import type {HoloInvalidToolCall, HoloMessage, HoloResponse, HoloToolCall,} from '@holokai/holo-types/holo';
import {isReasoningContent, isTextContent, isToolCallContent} from '../holo';

/** Extract concatenated text from a single message. Returns `''` if content is not text-based. */
export function getMessageText(message: HoloMessage): string {
    if (typeof message.content === 'string') return message.content;
    return message.content
        .filter(isTextContent)
        .map(b => b.text)
        .join('');
}

/** Extract concatenated reasoning text from a single message. Returns `''` if no reasoning blocks. */
export function getMessageReasoning(message: HoloMessage): string {
    if (typeof message.content === 'string') return '';
    return message.content
        .filter(isReasoningContent)
        .map(b => b.text ?? '')
        .join('');
}

/**
 * Extract tool calls from a single message.
 * Prefers `message.tool_calls` projection if present and non-empty; otherwise falls back to content blocks.
 */
export function getMessageToolCalls(message: HoloMessage): HoloToolCall[] {
    if (message.tool_calls && message.tool_calls.length > 0) {
        return message.tool_calls;
    }
    if (!Array.isArray(message.content)) return [];
    return message.content
        .filter(isToolCallContent)
        .map(block => {
            const call: HoloToolCall = {
                type: 'function',
                function: {name: block.name, arguments: block.arguments},
            };
            if (block.id) call.id = block.id;
            return call;
        });
}

/** Extract invalid tool calls from a single message. */
export function getMessageInvalidToolCalls(message: HoloMessage): HoloInvalidToolCall[] {
    return message.invalid_tool_calls ?? [];
}

/** Aggregation helpers for extracting structured data from a {@link HoloResponse}. */
export const HoloOutput = {
    /** Concatenate all assistant text across output messages. */
    text(response: HoloResponse): string {
        return response.output
            .filter(m => m.role === 'assistant')
            .map(getMessageText)
            .join('');
    },

    /** Concatenate all reasoning text across output messages. */
    reasoning(response: HoloResponse): string {
        return response.output
            .filter(m => m.role === 'assistant')
            .map(getMessageReasoning)
            .join('');
    },

    /** Collect all tool calls across output messages in order. */
    toolCalls(response: HoloResponse): HoloToolCall[] {
        return response.output.flatMap(getMessageToolCalls);
    },

    /** Collect all invalid tool calls across output messages in order. */
    invalidToolCalls(response: HoloResponse): HoloInvalidToolCall[] {
        return response.output.flatMap(getMessageInvalidToolCalls);
    },

    /** Return the last message in the output array, or `undefined` if empty. */
    lastMessage(response: HoloResponse): HoloMessage | undefined {
        return response.output[response.output.length - 1];
    },
};
