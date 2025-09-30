import {HoloResponse, HoloResponseValidator, HoloUsage, HoloUsageValidator} from "../../holo";
import {ClaudeResponse, ClaudeResponseMessage, ClaudeUsage} from "../types";

import {claudeMessageToHoloArray} from "./claude.message.translators";
import {createStableId} from "../util/stable-id";
import {createTranslateFunc, FieldTranslator, TranslateFunc} from "../../types";
import {ClaudeResponseMessageValidator, ClaudeResponseValidator, ClaudeUsageValidator} from "../validators";

// Usage field translator
export const fromHoloUsageTranslator: TranslateFunc<HoloUsage, ClaudeUsage> =
    async (holoUsage: HoloUsage): Promise<Partial<ClaudeUsage>> => {
        const result: Partial<ClaudeUsage> = {};

        // Direct copies
        if (holoUsage.input_tokens !== undefined) result.input_tokens = holoUsage.input_tokens;
        if (holoUsage.output_tokens !== undefined) result.output_tokens = holoUsage.output_tokens;

        // Service tier - only map compatible values, omit if not supported
        if (holoUsage.service_tier !== undefined &&
            ['standard', 'priority', 'batch'].includes(holoUsage.service_tier)) {
            result.service_tier = holoUsage.service_tier as 'standard' | 'priority' | 'batch';
        }

        // Field name mappings - only set if not null
        if (holoUsage.cache_read_tokens !== undefined && holoUsage.cache_read_tokens !== null) {
            result.cache_read_input_tokens = holoUsage.cache_read_tokens;
        }
        if (holoUsage.cache_write_tokens !== undefined && holoUsage.cache_write_tokens !== null) {
            result.cache_creation_input_tokens = holoUsage.cache_write_tokens;
        }

        return result;
    };

export const toHoloUsageTranslator: TranslateFunc<ClaudeUsage, HoloUsage> =
    async (claudeUsage: ClaudeUsage): Promise<Partial<HoloUsage>> => {
        const result: Partial<HoloUsage> = {};

        // Direct copies
        if (claudeUsage.input_tokens !== undefined) result.input_tokens = claudeUsage.input_tokens;
        if (claudeUsage.output_tokens !== undefined) result.output_tokens = claudeUsage.output_tokens;
        if (claudeUsage.service_tier !== undefined && claudeUsage.service_tier !== null) {
            result.service_tier = claudeUsage.service_tier;
        }

        // Computed fields
        if (claudeUsage.input_tokens !== undefined && claudeUsage.output_tokens !== undefined) {
            result.total_tokens = claudeUsage.input_tokens + claudeUsage.output_tokens;
        }

        // Field name mappings
        if (claudeUsage.cache_read_input_tokens !== undefined && claudeUsage.cache_read_input_tokens !== null) {
            result.cache_read_tokens = claudeUsage.cache_read_input_tokens;
        }
        if (claudeUsage.cache_creation_input_tokens !== undefined && claudeUsage.cache_creation_input_tokens !== null) {
            result.cache_write_tokens = claudeUsage.cache_creation_input_tokens;
        }

        return result;
    };

export const ClaudeUsageTranslator = new FieldTranslator<HoloUsage, ClaudeUsage>(
    HoloUsageValidator,
    ClaudeUsageValidator,
    [fromHoloUsageTranslator],
    [toHoloUsageTranslator],
    {name: 'ClaudeUsageTranslator'}
);

// Finish reason field translator - returns partial to avoid overwriting when not present
export const fromHoloFinishReasonTranslator: TranslateFunc<HoloResponse, ClaudeResponse> =
    async (holoResponse: HoloResponse): Promise<Partial<ClaudeResponseMessage>> => {
        if (!holoResponse.finish_reason) return {};

        let stop_reason = null;
        switch (holoResponse.finish_reason) {
            case 'stop':
                stop_reason = 'end_turn';
                break;
            case 'length':
                stop_reason = 'max_tokens';
                break;
            case 'tool_calls':
            case 'function_call':
                stop_reason = 'tool_use';
                break;
            case 'content_filter':
                stop_reason = 'refusal';
                break;
            default:
                return {}; // Don't force a value when Holo has no opinion
        }
        return {stop_reason} as Partial<ClaudeResponseMessage>;
    };

export const toHoloFinishReasonTranslator: TranslateFunc<ClaudeResponse, HoloResponse> =
    async (claudeResponse: ClaudeResponse): Promise<Partial<HoloResponse>> => {
        claudeResponse = claudeResponse as ClaudeResponseMessage;
        if (!claudeResponse.stop_reason) return {};

        let finish_reason = null;
        switch (claudeResponse.stop_reason) {
            case 'end_turn':
                finish_reason = 'stop';
                break;
            case 'max_tokens':
                finish_reason = 'length';
                break;
            case 'tool_use':
                finish_reason = 'tool_calls';
                break;
            case 'refusal':
                finish_reason = 'content_filter';
                break;
            default:
                return {}; // Don't invent a Holo finish reason for unknown values
        }
        return {finish_reason} as Partial<HoloResponse>;
    };

export const fromHoloResponseMessagesTranslator: TranslateFunc<HoloResponse, ClaudeResponseMessage> =
    async (holoResponse: HoloResponse): Promise<Partial<ClaudeResponseMessage>> => {
        // const message = {message: {role: 'assistant', content: []}};
        if (!holoResponse.messages?.length) {
            // return message;
        }

        // Take the first message (assistant response) and flatten to Claude format
        // Claude responses expect the first message to be the assistant reply
        const assistantMessage = holoResponse.messages[0];
        if (assistantMessage.role !== 'assistant') {
            // Option A: return empty; Option B: coerce. Keeping empty since upstream should guarantee assistant first.

            return {};
        }

        // Set role and convert content
        const result: any = {
            role: 'assistant'
        };

        // Handle content conversion
        if (typeof assistantMessage.content === 'string') {
            result.content = [{type: 'text', text: assistantMessage.content}];
        } else if (Array.isArray(assistantMessage.content)) {
            // Convert HoloContent to Claude content blocks
            const contentBlocks = await Promise.all(
                assistantMessage.content.map(async (content: any) => {
                    if (content.type === 'text') {
                        return {type: 'text', text: content.text};
                    } else if (content.type === 'image') {
                        // Convert image back to Claude format with robust data URI parsing
                        if (content.url.startsWith('data:')) {
                            const comma = content.url.indexOf(',');
                            const header = content.url.slice(0, comma);
                            const data = content.url.slice(comma + 1);
                            const mediaType = /data:([^;]+);base64/i.exec(header)?.[1] ?? 'image/png';
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: data
                                }
                            };
                        } else {
                            return {
                                type: 'image',
                                source: {
                                    type: 'url',
                                    url: content.url
                                }
                            };
                        }
                    }
                    return null; // Skip unknown content types
                })
            );
            result.content = contentBlocks.filter(Boolean);
        } else {
            result.content = [];
        }

        // Add tool_calls as tool_use blocks in content (appends after content for consistent ordering)
        if (assistantMessage.tool_calls?.length) {
            const toolUseBlocks = assistantMessage.tool_calls.map((toolCall: any, idx: number) => ({
                type: 'tool_use',
                id: toolCall.id ?? createStableId(`${toolCall.function.name}#${idx}`, toolCall.function.arguments),
                name: toolCall.function.name,
                input: toolCall.function.arguments
            }));
            result.content = result.content || [];
            result.content.push(...toolUseBlocks);
        }

        // Ensure non-empty content for Claude API compatibility
        if (!result.content || (Array.isArray(result.content) && result.content.length === 0)) {
            result.content = [{type: 'text', text: ''}];
        }

        return result;
    };

export const toHoloResponseMessagesTranslator: TranslateFunc<ClaudeResponseMessage, HoloResponse> =
    async (claudeResponse: ClaudeResponseMessage): Promise<Partial<HoloResponse>> => {
        // Claude response is always a single assistant message
        // Use the message-to-holo array translator with response message shape
        const holoMessages = await claudeMessageToHoloArray({
            role: claudeResponse.role,
            content: claudeResponse.content
        } as any); // Cast to handle request/response type compatibility

        return {messages: holoMessages};
    };

export const ClaudeResponseMessageTranslator = new FieldTranslator<HoloResponse, ClaudeResponseMessage>(
    HoloResponseValidator,
    ClaudeResponseMessageValidator,
    [
        createTranslateFunc(ClaudeUsageTranslator.fromHolo, 'usage', 'usage', 'ClaudeUsageFromHoloTranslator'),
        fromHoloResponseMessagesTranslator
    ],
    [
        createTranslateFunc(ClaudeUsageTranslator.toHolo, 'usage', 'usage', 'ClaudeUsageToHoloTranslator'),
        toHoloResponseMessagesTranslator
    ],
    {name: 'ClaudeResponseMessageTranslator'}
)

// export const fromHoloResponseMessagesTranslator: TranslateFunc<HoloResponse, ClaudeResponse> =
//     async (holoResponse: HoloResponse): Promise<Partial<ClaudeResponse>> => {
//         if (ClaudeResponseMessageValidator(holoResponse) !== ArkErrors) {
//             return ClaudeResponseMessageTranslator.fromHolo(holoResponse);
//         } else {
//             return {};
//         }
//
//     }

// Main Claude response translator using field translators
export const ClaudeResponseTranslator = new FieldTranslator<HoloResponse, ClaudeResponse>(
    HoloResponseValidator,
    ClaudeResponseValidator,
    [
        fromHoloFinishReasonTranslator
    ],
    [
        toHoloFinishReasonTranslator
    ],
    {name: 'ClaudeResponseTranslator', skipValidation: true}
);
