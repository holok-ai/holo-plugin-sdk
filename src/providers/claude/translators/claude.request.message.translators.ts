// Messages mapping (Claude messages -> Holo messages)
import {Translator} from "../../translators";
import {HoloRequest} from "../../holo";
import {ClaudeChatRequest} from "../types";

export const toHoloMessagesTranslator: Translator<ClaudeChatRequest, HoloRequest> = (source) => {
    if (!source.messages || source.messages.length === 0) return {};

    const messages = source.messages.map((message: any) => {
        const holoMessage: Record<string, unknown> = {
            role: message.role
        };

        // Handle content based on type
        if (typeof message.content === 'string') {
            holoMessage.content = message.content;
        } else if (Array.isArray(message.content)) {
            // Process Claude content blocks
            const textParts: string[] = [];
            const images: string[] = [];
            const toolResults: unknown[] = [];

            message.content.forEach((block: any) => {
                if ('text' in block) {
                    textParts.push(block.text);
                } else if ('image' in block) {
                    // Extract base64 data from Claude image format
                    const image = block.image as any;
                    if (image && 'data' in image && 'media_type' in image) {
                        images.push(image.data);
                    } else if (image && 'source' in image && image.source && 'data' in image.source) {
                        images.push(image.source.data);
                    }
                } else if ('tool_result' in block) {
                    const toolResult = block as any;
                    toolResults.push({
                        tool_call_id: toolResult.tool_use_id,
                        content: toolResult.content
                    });
                } else if ('tool_use' in block) {
                    // Convert Claude tool use to Holo tool call format
                    if (!holoMessage.tool_calls) {
                        holoMessage.tool_calls = [];
                    }
                    const toolUse = block as any;
                    (holoMessage.tool_calls as unknown[]).push({
                        id: toolUse.id,
                        name: toolUse.name,
                        arguments: toolUse.input
                    });
                }
            });

            // Set content as concatenated text
            holoMessage.content = textParts.join(' ') || null;

            // Add images if present
            if (images.length > 0) {
                holoMessage.images = images;
            }

            // Add tool results if present
            if (toolResults.length > 0) {
                holoMessage.tool_results = toolResults;
            }
        }

        return holoMessage;
    });

    return {messages};
};

export const fromHoloMessagesTranslator: Translator<HoloRequest, ClaudeChatRequest> = (source) => {
    if (!source.messages) return {};

    const messages = source.messages.map(message => {
        let role: 'user' | 'assistant';
        switch (message.role) {
            case 'assistant':
                role = 'assistant';
                break;
            case 'tool':
            case 'developer':
            case 'user':
            default:
                role = 'user';
                break;
        }

        return {
            role,
            content: fromHoloMessageContent(message).content
        };
    });

    return {messages};
};
