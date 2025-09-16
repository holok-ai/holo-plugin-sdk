// Helper function to detect image media type from base64 or file extension
import {HoloRequestMessage} from "../../types";

const detectImageMediaType = (imageData: string): string => {
    // Check for base64 data URL prefix
    if (imageData.startsWith('data:image/')) {
        const match = imageData.match(/^data:image\/([^;]+)/);
        if (match) {
            const type = match[1].toLowerCase();
            if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(type)) {
                return type === 'jpg' ? 'image/jpeg' : `image/${type}`;
            }
        }
    }

    // Check for file extension or assume from base64 header
    const lowerData = imageData.toLowerCase();
    if (lowerData.includes('png') || imageData.startsWith('iVBOR')) return 'image/png';
    if (lowerData.includes('gif') || imageData.startsWith('R0lGOD')) return 'image/gif';
    if (lowerData.includes('webp') || imageData.includes('WEBP')) return 'image/webp';

    // Default to JPEG for unknown types
    return 'image/jpeg';
};
// Helper function to determine if image data is base64 or file ID
const isBase64Image = (imageData: string): boolean => {
    return imageData.startsWith('data:image/') ||
        imageData.startsWith('/9j/') || // JPEG base64 start
        imageData.startsWith('iVBOR') || // PNG base64 start
        imageData.startsWith('R0lGOD') || // GIF base64 start
        Boolean(imageData.match(/^[A-Za-z0-9+/]+=*$/)); // Generic base64 pattern
};

// Content blocks translation (HoloRequestMessage content -> ClaudeContentBlockParam[])
export const fromHoloMessageContent = (message: HoloRequestMessage) => {
    const contentBlocks: any[] = [];

    // Handle tool result messages (tool_call_id indicates this is a tool response)
    if (message.tool_call_id) {
        contentBlocks.push({
            type: 'tool_result',
            tool_use_id: message.tool_call_id,
            content: message.content,
            is_error: false // Could be enhanced to detect error responses
        });
        return {content: contentBlocks};
    }

    // Basic text content
    if (message.content) {
        contentBlocks.push({
            type: 'text',
            text: message.content
        });
    }

    // Image content
    if (message.images && message.images.length > 0) {
        message.images.forEach(image => {
            if (isBase64Image(image)) {
                // Base64 image
                const cleanBase64 = image.startsWith('data:') ?
                    image.split(',')[1] : image;

                contentBlocks.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        data: cleanBase64,
                        media_type: detectImageMediaType(image)
                    }
                });
            } else {
                // File ID
                contentBlocks.push({
                    type: 'image',
                    source: {
                        type: 'file',
                        file_id: image
                    }
                });
            }
        });
    }

    // Tool calls (for assistant messages)
    if (message.tool_calls && message.tool_calls.length > 0) {
        message.tool_calls.forEach((toolCall: any) => {
            const toolUseBlock: any = {
                type: 'tool_use',
                id: toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                name: toolCall.name || toolCall.function?.name,
                input: {}
            };

            // Handle different tool call argument formats
            if (toolCall.arguments) {
                if (typeof toolCall.arguments === 'string') {
                    try {
                        toolUseBlock.input = JSON.parse(toolCall.arguments);
                    } catch {
                        toolUseBlock.input = {arguments: toolCall.arguments};
                    }
                } else {
                    toolUseBlock.input = toolCall.arguments;
                }
            } else if (toolCall.function?.arguments) {
                if (typeof toolCall.function.arguments === 'string') {
                    try {
                        toolUseBlock.input = JSON.parse(toolCall.function.arguments);
                    } catch {
                        toolUseBlock.input = {arguments: toolCall.function.arguments};
                    }
                } else {
                    toolUseBlock.input = toolCall.function.arguments;
                }
            }

            contentBlocks.push(toolUseBlock);
        });
    }

    // Audio content (if present) - Claude doesn't directly support audio in content blocks
    // This would need to be handled at a higher level or converted to text
    if (message.audio) {
        // For now, add a placeholder text block indicating audio content
        contentBlocks.push({
            type: 'text',
            text: '[Audio content - processing not implemented]'
        });
    }

    return {content: contentBlocks.length > 0 ? contentBlocks : message.content};
};
