import {Translator} from "../../translators";

// Use flexible typing for complex reverse translations
type OpenAIChatRequestType = any; // Complex OpenAI SDK types with nested structures
type HoloRequestType = any; // Target Holo format

// ========== SIMPLE FIELD TRANSLATORS ==========

// Simple direct field mappings that don't require complex transformation
export const toHoloSimpleFieldsTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    const result: Record<string, unknown> = {};

    // Direct field mappings (same property name)
    if (source.model) result.model = source.model;
    if (source.max_tokens !== undefined) result.max_tokens = source.max_tokens;
    if (source.temperature !== undefined) result.temperature = source.temperature;
    if (source.top_p !== undefined) result.top_p = source.top_p;
    if (source.frequency_penalty !== undefined) result.frequency_penalty = source.frequency_penalty;
    if (source.presence_penalty !== undefined) result.presence_penalty = source.presence_penalty;
    if (source.seed !== undefined) result.seed = source.seed;
    if (source.stream !== undefined) result.stream = source.stream;
    if (source.service_tier) result.service_tier = source.service_tier;
    if (source.logit_bias) result.logit_bias = source.logit_bias;
    if (source.logprobs !== undefined) result.logprobs = source.logprobs;
    if (source.top_logprobs !== undefined) result.top_logprobs = source.top_logprobs;

    // Simple transformations
    if (source.stop) {
        result.stop_sequences = Array.isArray(source.stop) ? source.stop : [source.stop];
    }

    // User field to metadata
    if (source.user) {
        result.metadata = { user_id: source.user };
    }

    return result;
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Messages mapping (OpenAI messages -> Holo messages)
export const toHoloMessagesTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    if (!source.messages || source.messages.length === 0) return {};

    const messages = source.messages.map((message: any) => {
        const holoMessage: Record<string, unknown> = {
            role: message.role,
            content: message.content
        };

        if (message.name) holoMessage.name = message.name;
        if (message.tool_call_id) holoMessage.tool_call_id = message.tool_call_id;

        // Handle tool calls
        if (message.tool_calls) {
            holoMessage.tool_calls = message.tool_calls.map((tc: any) => ({
                id: tc.id,
                name: tc.function.name,
                arguments: tc.function.arguments
            }));
        }

        // Handle images (if content is array with image_url parts)
        if (Array.isArray(message.content)) {
            const textParts: string[] = [];
            const images: string[] = [];

            message.content.forEach((part: any) => {
                if (part.type === 'text') {
                    textParts.push(part.text);
                } else if (part.type === 'image_url') {
                    images.push(part.image_url.url);
                }
            });

            holoMessage.content = textParts.join(' ');
            if (images.length > 0) holoMessage.images = images;
        }

        return holoMessage;
    });

    return {messages};
};

// Tools mapping (OpenAI tools -> Holo tools)
export const toHoloToolsTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    if (!source.tools || source.tools.length === 0) return {};

    const tools = source.tools.map((tool: any) => ({
        name: tool.function.name,
        description: tool.function.description || '',
        parameters: tool.function.parameters || {}
    }));

    return {tools};
};

// Tool choice mapping (OpenAI tool_choice -> Holo tool_choice)
export const toHoloToolChoiceTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    if (source.tool_choice) {
        if (typeof source.tool_choice === 'string') {
            return {tool_choice: source.tool_choice};
        } else if (typeof source.tool_choice === 'object' && source.tool_choice.type === 'function') {
            return {
                tool_choice: {
                    type: 'specific',
                    name: source.tool_choice.function.name
                }
            };
        }
    }
    return {};
};

// Response format mapping
export const toHoloResponseFormatTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    if (source.response_format) {
        return {response_format: source.response_format};
    }
    return {};
};

// Legacy function handling (convert to tools)
export const toHoloLegacyFunctionsTranslator: Translator<OpenAIChatRequestType, HoloRequestType> = (source) => {
    if (source.functions && source.functions.length > 0) {
        // Convert legacy functions to tools format
        const tools = source.functions.map((func: any) => ({
            name: func.name,
            description: func.description || '',
            parameters: func.parameters || {}
        }));
        return {tools};
    }

    if (source.function_call) {
        if (typeof source.function_call === 'string') {
            return {tool_choice: source.function_call};
        } else if (source.function_call.name) {
            return {
                tool_choice: {
                    type: 'specific',
                    name: source.function_call.name
                }
            };
        }
    }

    return {};
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloRequestTranslators: Translator<OpenAIChatRequestType, HoloRequestType>[] = [
    toHoloSimpleFieldsTranslator,
    toHoloMessagesTranslator,
    toHoloToolsTranslator,
    toHoloToolChoiceTranslator,
    toHoloResponseFormatTranslator,
    toHoloLegacyFunctionsTranslator
];
