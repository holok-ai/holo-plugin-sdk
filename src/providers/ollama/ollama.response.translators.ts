import {OllamaResponse, HoloResponse} from "../types";
import {Translator} from "../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// ID field mapping (Ollama doesn't have ID, generate one)
export const toHoloIdTranslator: Translator<OllamaResponse, HoloResponse> = (_source) => {
    // Generate a unique ID for Ollama responses since they don't have one
    const id = `ollama_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return {id};
};

// Model field mapping
export const toHoloModelTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('model' in source && source.model) {
        return {model: source.model};
    }
    return {};
};

// Object type mapping
export const toHoloObjectTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('message' in source) {
        return {object: 'chat.completion'};
    }
    // Default to chat.completion for compatibility
    return {object: 'chat.completion'};
};

// Role mapping (Ollama assistant responses)
export const toHoloRoleTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('message' in source || 'response' in source) {
        return {role: 'assistant'};
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Content mapping (Ollama message/response -> Holo content)
export const toHoloContentTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('message' in source && source.message) {
        return {content: source.message.content};
    } else if ('response' in source && source.response) {
        return {content: source.response};
    }
    return {};
};

// Message mapping (for chat responses)
export const toHoloMessageTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('message' in source && source.message) {
        const message: Record<string, unknown> = {
            role: source.message.role as 'assistant',
            content: source.message.content,
            refusal: null
        };
        
        // Add tool calls if present
        if (source.message.tool_calls && source.message.tool_calls.length > 0) {
            message.tool_calls = source.message.tool_calls.map(toolCall => ({
                id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                type: 'function',
                function: {
                    name: toolCall.function.name,
                    arguments: JSON.stringify(toolCall.function.arguments)
                }
            }));
        }
        
        return {message};
    }
    return {};
};

// Choices mapping (convert Ollama response to OpenAI-style choices)
export const toHoloChoicesTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('message' in source && source.message) {
        const message: Record<string, unknown> = {
            role: source.message.role as 'assistant',
            content: source.message.content,
            refusal: null
        };
        
        // Add tool calls if present
        if (source.message.tool_calls && source.message.tool_calls.length > 0) {
            message.tool_calls = source.message.tool_calls.map(toolCall => ({
                id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                type: 'function',
                function: {
                    name: toolCall.function.name,
                    arguments: JSON.stringify(toolCall.function.arguments)
                }
            }));
        }
        
        const choices = [{
            index: 0,
            message,
            finish_reason: mapOllamaFinishReason(source),
            logprobs: null
        }];
        
        return {choices};
    } else if ('response' in source && source.response) {
        const choices = [{
            index: 0,
            message: {
                role: 'assistant' as const,
                content: source.response,
                refusal: null
            },
            finish_reason: mapOllamaFinishReason(source),
            logprobs: null
        }];
        
        return {choices};
    }
    
    return {};
};

// Usage mapping (convert Ollama metrics to Holo usage format)
export const toHoloUsageTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    const usage: Record<string, number> = {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
    };
    
    // Map Ollama performance metrics to token counts
    if ('prompt_eval_count' in source && typeof source.prompt_eval_count === 'number') {
        usage.input_tokens = source.prompt_eval_count;
    }
    
    if ('eval_count' in source && typeof source.eval_count === 'number') {
        usage.output_tokens = source.eval_count;
    }
    
    usage.total_tokens = usage.input_tokens + usage.output_tokens;
    
    return {usage};
};

// Finish reason mapping
export const toHoloFinishReasonTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    const finishReason = mapOllamaFinishReason(source);
    if (finishReason) {
        return {finish_reason: finishReason};
    }
    return {};
};

// Stop reason mapping (for Claude compatibility)
export const toHoloStopReasonTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    const finishReason = mapOllamaFinishReason(source);
    if (finishReason) {
        return {stop_reason: finishReason};
    }
    return {};
};

// Timestamp mapping
export const toHoloTimestampTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('created_at' in source && source.created_at) {
        // Convert Date to Unix timestamp
        const created = source.created_at instanceof Date 
            ? Math.floor(source.created_at.getTime() / 1000)
            : Math.floor(Date.now() / 1000);
        return {
            created,
            created_at: source.created_at
        };
    }
    return {};
};

// Done status mapping
export const toHoloDoneTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    if ('done' in source && typeof source.done === 'boolean') {
        return {done: source.done};
    }
    return {};
};

// Performance metrics mapping
export const toHoloPerformanceTranslator: Translator<OllamaResponse, HoloResponse> = (source) => {
    const result: Record<string, unknown> = {};
    
    if ('total_duration' in source && typeof source.total_duration === 'number') {
        result.total_duration = source.total_duration;
    }
    
    if ('load_duration' in source && typeof source.load_duration === 'number') {
        result.load_duration = source.load_duration;
    }
    
    if ('prompt_eval_duration' in source && typeof source.prompt_eval_duration === 'number') {
        result.prompt_eval_duration = source.prompt_eval_duration;
    }
    
    if ('eval_duration' in source && typeof source.eval_duration === 'number') {
        result.eval_duration = source.eval_duration;
    }
    
    if ('prompt_eval_count' in source && typeof source.prompt_eval_count === 'number') {
        result.prompt_eval_count = source.prompt_eval_count;
    }
    
    if ('eval_count' in source && typeof source.eval_count === 'number') {
        result.eval_count = source.eval_count;
    }
    
    if ('context' in source && Array.isArray(source.context)) {
        result.context = source.context;
    }
    
    return result;
};

// ========== HELPER FUNCTIONS ==========

// Helper function to map Ollama completion reasons to Holo finish reasons
const mapOllamaFinishReason = (source: OllamaResponse): string | null => {
    if ('done_reason' in source && source.done_reason) {
        switch (source.done_reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            default:
                return 'stop';
        }
    }
    
    if ('done' in source && source.done === true) {
        return 'stop';
    }
    
    return null;
};

// Helper function to process Ollama tool calls
const processToolCalls = (toolCalls: unknown[]): any[] => {
    return toolCalls.map((toolCall, index) => {
        if (toolCall && typeof toolCall === 'object') {
            const tc = toolCall as Record<string, unknown>;
            if (tc.function && typeof tc.function === 'object') {
                const func = tc.function as Record<string, unknown>;
                return {
                    id: `call_${Date.now()}_${index}`,
                    type: 'function',
                    function: {
                        name: func.name || 'unknown',
                        arguments: typeof func.arguments === 'string' 
                            ? func.arguments
                            : JSON.stringify(func.arguments || {})
                    }
                };
            }
        }
        return null;
    }).filter(Boolean);
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloResponseTranslators: Translator<OllamaResponse, HoloResponse>[] = [
    toHoloIdTranslator,
    toHoloModelTranslator,
    toHoloObjectTranslator,
    toHoloRoleTranslator,
    toHoloContentTranslator,
    toHoloMessageTranslator,
    toHoloChoicesTranslator,
    toHoloUsageTranslator,
    toHoloFinishReasonTranslator,
    toHoloStopReasonTranslator,
    toHoloTimestampTranslator,
    toHoloDoneTranslator,
    toHoloPerformanceTranslator
];