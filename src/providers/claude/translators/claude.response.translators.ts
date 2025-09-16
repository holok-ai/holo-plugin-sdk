import {ClaudeResponse, HoloResponse} from "../../types";
import {Translator} from "../../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// Service tier mapping (enum normalization - runs in parallel)
export const toHoloServiceTierTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    // Claude responses contain service_tier in usage.service_tier
    if ('usage' in source && source.usage && 'service_tier' in source.usage && source.usage.service_tier) {
        const service_tier = source.usage.service_tier;
        return {service_tier};
    }
    return {};
};

// ID field mapping
export const toHoloIdTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('id' in source && source.id) {
        return {id: source.id};
    }
    return {};
};

// Model field mapping
export const toHoloModelTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('model' in source && source.model) {
        return {model: source.model};
    }
    return {};
};

// Role field mapping
export const toHoloRoleTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('role' in source && source.role) {
        return {role: source.role};
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Content blocks mapping (ClaudeContentBlock[] -> HoloResponseContent)
export const toHoloContentTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('content' in source && source.content) {
        const content = fromClaudeContentBlocksToHoloContent(source.content);
        return {content};
    }
    return {};
};

// Usage mapping
export const toHoloUsageTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('usage' in source && source.usage) {
        const inputTokens = source.usage.input_tokens || 0;
        const outputTokens = source.usage.output_tokens || 0;
        const usage: {
            input_tokens: number;
            output_tokens: number;
            total_tokens: number;
            cache_read_tokens?: number;
            cache_write_tokens?: number;
        } = {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens
        };

        // Only include cache tokens if they exist
        if (source.usage.cache_read_input_tokens) {
            usage.cache_read_tokens = source.usage.cache_read_input_tokens;
        }
        if (source.usage.cache_creation_input_tokens) {
            usage.cache_write_tokens = source.usage.cache_creation_input_tokens;
        }

        return {usage};
    }
    return {};
};

// Stop reason mapping
export const toHoloStopReasonTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('stop_reason' in source && source.stop_reason) {
        // Map Claude stop reasons to Holo equivalents
        let stop_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | 'max_tokens' | 'end_turn' | 'tool_use' | 'pause_turn' | 'refusal';
        switch (source.stop_reason) {
            case 'end_turn':
                stop_reason = 'stop';
                break;
            case 'max_tokens':
                stop_reason = 'length';
                break;
            case 'tool_use':
                stop_reason = 'tool_calls';
                break;
            case 'stop_sequence':
                stop_reason = 'stop';
                break;
            case 'pause_turn':
                stop_reason = 'pause_turn';
                break;
            case 'refusal':
                stop_reason = 'refusal';
                break;
            default:
                stop_reason = 'stop';
                break;
        }
        return {stop_reason};
    }
    return {};
};

// ========== HELPER FUNCTIONS ==========

// Helper function to convert Claude content blocks to Holo content format
const fromClaudeContentBlocksToHoloContent = (contentBlocks: unknown[]): string => {
    const textParts: string[] = [];

    contentBlocks.forEach(block => {
        if (!block || typeof block !== 'object') return;

        const contentBlock = block as Record<string, unknown>;
        const blockType = contentBlock.type;

        switch (blockType) {
            case 'text':
                if (typeof contentBlock.text === 'string') {
                    textParts.push(contentBlock.text);
                }
                break;
            case 'thinking':
                // Include thinking content with delimiter
                if (typeof contentBlock.thinking === 'string') {
                    textParts.push(`<thinking>${contentBlock.thinking}</thinking>`);
                }
                break;
            case 'tool_use':
                // Convert tool use to structured format
                const name = typeof contentBlock.name === 'string' ? contentBlock.name : 'unknown';
                const input = contentBlock.input || {};
                const toolUseText = `Tool: ${name}\nArguments: ${JSON.stringify(input, null, 2)}`;
                textParts.push(toolUseText);
                break;
            case 'web_search_tool_result':
            case 'code_execution_tool_result':
            case 'mcp_tool_result':
                // Handle tool results
                const resultContent = contentBlock.content;
                if (typeof resultContent === 'string') {
                    textParts.push(resultContent);
                } else if (Array.isArray(resultContent)) {
                    resultContent.forEach((contentItem: unknown) => {
                        if (contentItem && typeof contentItem === 'object') {
                            const item = contentItem as Record<string, unknown>;
                            if (item.type === 'text' && typeof item.text === 'string') {
                                textParts.push(item.text);
                            }
                        }
                    });
                }
                break;
            default:
                // Handle other block types generically
                if (typeof contentBlock.text === 'string') {
                    textParts.push(contentBlock.text);
                } else if (contentBlock.content && typeof contentBlock.content === 'string') {
                    textParts.push(contentBlock.content);
                }
                break;
        }
    });

    return textParts.join('\n\n');
};

// ========== STREAMING EVENT TRANSLATORS ==========

// Stream event type mapping
export const toHoloStreamEventTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('type' in source) {
        let event_type: string;
        switch (source.type) {
            case 'message_start':
                event_type = 'message_start';
                break;
            case 'message_delta':
                event_type = 'message_delta';
                break;
            case 'message_stop':
                event_type = 'message_stop';
                break;
            case 'content_block_start':
                event_type = 'content_start';
                break;
            case 'content_block_delta':
                event_type = 'content_delta';
                break;
            case 'content_block_stop':
                event_type = 'content_stop';
                break;
            default:
                event_type = source.type;
                break;
        }
        return {type: event_type};
    }
    return {};
};

// Stream delta mapping
export const toHoloStreamDeltaTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('delta' in source && source.delta && typeof source.delta === 'object') {
        const sourceDelta = source.delta as unknown as Record<string, unknown>;
        const delta: Record<string, unknown> = {};

        // Handle different delta types
        if (sourceDelta.type === 'text_delta' && typeof sourceDelta.text === 'string') {
            delta.content = sourceDelta.text;
        } else if (sourceDelta.type === 'thinking_delta' && typeof sourceDelta.thinking === 'string') {
            delta.content = `<thinking>${sourceDelta.thinking}</thinking>`;
        } else if (sourceDelta.type === 'input_json_delta' && typeof sourceDelta.partial_json === 'string') {
            delta.tool_calls = [{
                function: {
                    arguments: sourceDelta.partial_json
                }
            }];
        }

        // Handle message-level deltas
        if (typeof sourceDelta.stop_reason === 'string') {
            delta.stop_reason = sourceDelta.stop_reason === 'end_turn' ? 'stop' : sourceDelta.stop_reason;
        }

        return {delta};
    }
    return {};
};

// Stream index mapping
export const toHoloStreamIndexTranslator: Translator<ClaudeResponse, HoloResponse> = (source) => {
    if ('index' in source && source.index !== undefined) {
        return {index: source.index};
    }
    return {};
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloResponseTranslators: Translator<ClaudeResponse, HoloResponse>[] = [
    toHoloServiceTierTranslator,
    toHoloIdTranslator,
    toHoloModelTranslator,
    toHoloRoleTranslator,
    toHoloContentTranslator,
    toHoloUsageTranslator,
    toHoloStopReasonTranslator,
    toHoloStreamEventTranslator,
    toHoloStreamDeltaTranslator,
    toHoloStreamIndexTranslator
];
