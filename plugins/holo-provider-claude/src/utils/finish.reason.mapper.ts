import type {HoloFinishReason} from "@holokai/types/holo";
import {StopReason} from "@anthropic-ai/sdk/resources/messages/messages";

export function mapClaudeFinishReason(reason?: string | null): HoloFinishReason | undefined {
    if (!reason) return undefined;

    switch (reason) {
        case 'end_turn':
            return 'stop';
        case 'max_tokens':
            return 'length';
        case 'tool_use':
            return 'tool_calls';
        case 'stop_sequence':
            return 'stop';
        case 'refusal':
            return 'content_filter';
        default:
            return null;
    }
}

export function mapHoloFinishReasonToClaude(reason?: HoloFinishReason): StopReason | null | undefined {
    if (reason === undefined) return undefined;
    if (reason === null) return null;

    switch (reason) {
        case 'stop':
            return 'end_turn';
        case 'length':
            return 'max_tokens';
        case 'tool_calls':
            return 'tool_use';
        case 'content_filter':
            return 'refusal';
        case 'function_call':
            // Claude doesn't have a separate function_call reason, use tool_use
            return 'tool_use';
        default:
            return null;
    }
}
