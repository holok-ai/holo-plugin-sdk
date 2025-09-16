import {HoloResponse, ClaudeResponse} from "../../types";
import {Translator} from "../../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// ID field mapping
export const fromHoloIdTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.id) {
        return {id: source.id};
    }
    return {};
};

// Model field mapping
export const fromHoloModelTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.model) {
        return {model: source.model};
    }
    return {};
};

// Role field mapping
export const fromHoloRoleTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.role) {
        return {role: source.role as 'assistant'};
    }
    return {};
};

// Stop reason mapping
export const fromHoloStopReasonTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.stop_reason) {
        return {stop_reason: source.stop_reason as any};
    } else if (source.finish_reason) {
        // Map OpenAI-style finish_reason to Claude stop_reason
        const stopReason = mapFinishReasonToStopReason(source.finish_reason);
        return stopReason ? {stop_reason: stopReason} : {};
    }
    return {};
};

// Type mapping (always 'message' for Claude)
export const fromHoloTypeTranslator: Translator<HoloResponse, ClaudeResponse> = () => {
    return {type: 'message'};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Content mapping (Holo content -> Claude content blocks)
export const fromHoloContentTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.content) {
        if (typeof source.content === 'string') {
            return {
                content: [{
                    type: 'text',
                    text: source.content
                }]
            };
        }
        // If content is already in Claude format, pass through
        return {content: source.content as any};
    }

    // Extract content from choices if present
    if (source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.content) {
            return {
                content: [{
                    type: 'text',
                    text: firstChoice.message.content as string
                }]
            };
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.content) {
            return {
                content: [{
                    type: 'text',
                    text: firstChoice.delta.content
                }]
            };
        }
    }

    return {};
};

// Usage mapping (Holo usage -> Claude usage)
export const fromHoloUsageTranslator: Translator<HoloResponse, ClaudeResponse> = (source) => {
    if (source.usage) {
        const usage: Record<string, unknown> = {};

        if (source.usage.input_tokens !== undefined) {
            usage.input_tokens = source.usage.input_tokens;
        }
        if (source.usage.output_tokens !== undefined) {
            usage.output_tokens = source.usage.output_tokens;
        }

        // Add cache tokens if present
        if (source.usage.cache_read_tokens !== undefined) {
            usage.cache_read_input_tokens = source.usage.cache_read_tokens;
        }
        if (source.usage.cache_write_tokens !== undefined) {
            usage.cache_creation_input_tokens = source.usage.cache_write_tokens;
        }

        // Add service tier if present
        if (source.service_tier) {
            usage.service_tier = source.service_tier;
        }

        return {usage};
    }
    return {};
};

// ========== HELPER FUNCTIONS ==========

// Helper to map OpenAI finish_reason to Claude stop_reason
const mapFinishReasonToStopReason = (finishReason: string): string | null => {
    switch (finishReason) {
        case 'stop':
            return 'end_turn';
        case 'length':
            return 'max_tokens';
        case 'tool_calls':
            return 'tool_use';
        case 'content_filter':
            return 'stop_sequence';
        default:
            return 'end_turn';
    }
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const fromHoloResponseTranslators: Translator<HoloResponse, ClaudeResponse>[] = [
    fromHoloIdTranslator,
    fromHoloModelTranslator,
    fromHoloRoleTranslator,
    fromHoloStopReasonTranslator,
    fromHoloTypeTranslator,
    fromHoloContentTranslator,
    fromHoloUsageTranslator
];
