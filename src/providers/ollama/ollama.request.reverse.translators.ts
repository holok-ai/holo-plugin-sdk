import {Translator} from "../translators";

// Use flexible typing for complex reverse translations
type OllamaChatRequestType = any; // Complex Ollama SDK types with nested structures  
type HoloRequestType = any; // Target Holo format

// ========== SHARED FIELD TRANSLATORS ==========

// Model mapping (Ollama model -> Holo model)
export const toHoloModelTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (source.model) {
        return {model: source.model};
    }
    return {};
};

// Stream mapping
export const toHoloStreamTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (source.stream !== undefined) {
        return {stream: source.stream};
    }
    return {};
};

// Keep alive mapping (Ollama-specific)
export const toHoloKeepAliveTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (source.keep_alive !== undefined) {
        return {keep_alive: source.keep_alive};
    }
    return {};
};

// Format mapping (Ollama format -> Holo response_format)
export const toHoloFormatTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (source.format === 'json') {
        return {
            response_format: {
                type: 'json_object'
            }
        };
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Messages mapping (Ollama messages -> Holo messages)
export const toHoloMessagesTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (!source.messages || source.messages.length === 0) return {};
    
    const messages = source.messages.map(message => {
        const holoMessage: Record<string, unknown> = {
            role: message.role,
            content: message.content
        };
        
        // Add images if present
        if (message.images && message.images.length > 0) {
            holoMessage.images = message.images;
        }
        
        // Add tool calls if present
        if (message.tool_calls && message.tool_calls.length > 0) {
            holoMessage.tool_calls = message.tool_calls.map(toolCall => ({
                id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                name: toolCall.function.name,
                arguments: typeof toolCall.function.arguments === 'string' 
                    ? toolCall.function.arguments
                    : JSON.stringify(toolCall.function.arguments)
            }));
        }
        
        return holoMessage;
    });
    
    return {messages};
};

// Tools mapping (Ollama tools -> Holo tools)
export const toHoloToolsTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (!source.tools || source.tools.length === 0) return {};
    
    const tools = source.tools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
    }));
    
    return {tools};
};

// Options mapping (Ollama options -> Holo parameters)
export const toHoloOptionsTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (!source.options) return {};
    
    const result: Record<string, unknown> = {};
    
    if (source.options.temperature !== undefined) {
        result.temperature = source.options.temperature;
    }
    if (source.options.top_p !== undefined) {
        result.top_p = source.options.top_p;
    }
    if (source.options.top_k !== undefined) {
        result.top_k = source.options.top_k;
    }
    if (source.options.repeat_penalty !== undefined) {
        result.frequency_penalty = source.options.repeat_penalty;
    }
    if (source.options.seed !== undefined) {
        result.seed = source.options.seed;
    }
    if (source.options.num_predict !== undefined) {
        result.max_tokens = source.options.num_predict;
    }
    if (source.options.stop && Array.isArray(source.options.stop)) {
        result.stop = source.options.stop;
    }
    
    return result;
};

// System mapping (Ollama system -> Holo system)
export const toHoloSystemTranslator: Translator<OllamaChatRequestType, HoloRequestType> = (source) => {
    if (source.system) {
        return {system: source.system};
    }
    return {};
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloRequestTranslators: Translator<OllamaChatRequestType, HoloRequestType>[] = [
    toHoloModelTranslator,
    toHoloStreamTranslator,
    toHoloKeepAliveTranslator,
    toHoloFormatTranslator,
    toHoloMessagesTranslator,
    toHoloToolsTranslator,
    toHoloOptionsTranslator,
    toHoloSystemTranslator
];