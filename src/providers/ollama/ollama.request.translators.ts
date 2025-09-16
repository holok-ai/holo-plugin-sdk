import {OllamaChatRequest, HoloRequest} from "../types";
import {Translator} from "../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// Keep alive mapping (Ollama-specific)
export const fromHoloKeepAliveTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    if (source.keep_alive !== undefined) {
        return {keep_alive: source.keep_alive};
    }
    return {};
};

// Format mapping (Ollama response format)
export const fromHoloFormatTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    if (source.response_format?.type === 'json_object') {
        return {format: 'json'};
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Messages mapping (HoloRequestMessage[] -> OllamaMessage[])
export const fromHoloMessagesTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    if (!source.messages) return {};
    
    const messages = source.messages.map(message => {
        // Ollama supports most role types directly
        const ollamaMessage: any = {
            role: message.role,
            content: message.content
        };
        
        // Add images if present
        if (message.images && message.images.length > 0) {
            ollamaMessage.images = message.images;
        }
        
        // Add tool calls if present (for assistant messages)
        if (message.tool_calls && message.tool_calls.length > 0) {
            ollamaMessage.tool_calls = message.tool_calls.map(toolCall => {
                if (toolCall && typeof toolCall === 'object') {
                    const tc = toolCall as Record<string, unknown>;
                    return {
                        function: {
                            name: tc.name as string,
                            arguments: typeof tc.arguments === 'string' 
                                ? JSON.parse(tc.arguments)
                                : tc.arguments
                        }
                    };
                }
                return null;
            }).filter(Boolean);
        }
        
        return ollamaMessage;
    });
    
    return {messages};
};

// Tools mapping (HoloTool[] -> OllamaTool[])
export const fromHoloToolsTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    if (!source.tools) return {};
    
    const tools = source.tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description || '',
            parameters: tool.parameters
        }
    }));
    
    return {tools};
};

// Options mapping (combine various Holo fields into Ollama options)
export const fromHoloOptionsTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    const options: Record<string, unknown> = {};
    let hasOptions = false;
    
    // Map generation parameters to Ollama options
    if (source.temperature !== undefined) {
        options.temperature = source.temperature;
        hasOptions = true;
    }
    
    if (source.top_p !== undefined) {
        options.top_p = source.top_p;
        hasOptions = true;
    }
    
    if (source.top_k !== undefined) {
        options.top_k = source.top_k;
        hasOptions = true;
    }
    
    if (source.max_tokens !== undefined) {
        options.num_predict = source.max_tokens;
        hasOptions = true;
    }
    
    if (source.seed !== undefined) {
        options.seed = source.seed;
        hasOptions = true;
    }
    
    if (source.frequency_penalty !== undefined) {
        options.frequency_penalty = source.frequency_penalty;
        hasOptions = true;
    }
    
    if (source.presence_penalty !== undefined) {
        options.presence_penalty = source.presence_penalty;
        hasOptions = true;
    }
    
    if (source.stop_sequences && source.stop_sequences.length > 0) {
        options.stop = source.stop_sequences;
        hasOptions = true;
    }
    
    return hasOptions ? {options} : {};
};

// System message handling (Ollama handles system in messages array, but we might need special handling)
export const fromHoloSystemTranslator: Translator<HoloRequest, OllamaChatRequest> = (source) => {
    if (source.system) {
        // For Ollama, system messages are typically handled as the first message with role 'system'
        // But this is already handled in the messages translator
        // We could add it to options if needed for certain models
        return {};
    }
    return {};
};

// ========== HELPER FUNCTIONS ==========

// Helper function to validate and format tool calls (currently unused)
// const validateToolCall = (toolCall: unknown): any => {
//     if (!toolCall || typeof toolCall !== 'object') {
//         return null;
//     }
//     
//     const tc = toolCall as Record<string, unknown>;
//     if (!tc.name || typeof tc.name !== 'string') {
//         return null;
//     }
//     
//     return {
//         function: {
//             name: tc.name,
//             arguments: tc.arguments || {}
//         }
//     };
// };

// Helper function to process images (handles both base64 and file paths) (currently unused)
// const processImages = (images: string[]): string[] => {
//     return images.map(image => {
//         // Ollama accepts base64 images and file paths directly
//         // No special processing needed for most cases
//         if (image.startsWith('data:image/')) {
//             // Remove data URL prefix if present, Ollama expects just base64
//             const base64Match = image.match(/^data:image\/[^;]+;base64,(.+)$/);
//             return base64Match ? base64Match[1] : image;
//         }
//         return image;
//     });
// };

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const fromHoloRequestTranslators: Translator<HoloRequest, OllamaChatRequest>[] = [
    fromHoloKeepAliveTranslator,
    fromHoloFormatTranslator,
    fromHoloMessagesTranslator,
    fromHoloToolsTranslator,
    fromHoloOptionsTranslator,
    fromHoloSystemTranslator
];