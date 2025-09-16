import {HoloResponse, OllamaResponse} from "../types";
import {Translator} from "../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// Model field mapping
export const fromHoloModelTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    if (source.model) {
        return {model: source.model};
    }
    return {};
};

// Timestamp mapping
export const fromHoloTimestampTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    if (source.created) {
        // Convert Unix timestamp to Date
        return {created_at: new Date(source.created * 1000)};
    }
    return {created_at: new Date()};
};

// Done status mapping
export const fromHoloDoneTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    // If we have a complete response, mark as done
    if (source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('finish_reason' in firstChoice && firstChoice.finish_reason) {
            return {
                done: true,
                done_reason: mapFinishReasonToDoneReason(firstChoice.finish_reason)
            };
        }
    }
    if (source.stop_reason) {
        return {
            done: true,
            done_reason: mapStopReasonToDoneReason(source.stop_reason)
        };
    }
    return {done: true, done_reason: 'stop'};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Message mapping (Holo response -> Ollama message format)
export const fromHoloMessageTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    let content = '';
    let toolCalls: unknown[] = [];
    
    // Extract content from various sources
    if (source.content) {
        content = typeof source.content === 'string' ? source.content : '';
    } else if (source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message) {
            content = firstChoice.message.content || '';
            if (firstChoice.message.tool_calls) {
                toolCalls = firstChoice.message.tool_calls;
            }
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.content) {
            content = firstChoice.delta.content;
        }
    }
    
    const message: Record<string, unknown> = {
        role: 'assistant',
        content: content
    };
    
    // Add tool calls if present
    if (toolCalls.length > 0) {
        message.tool_calls = toolCalls.map((toolCall: any) => ({
            function: {
                name: toolCall.function?.name || toolCall.name,
                arguments: typeof toolCall.function?.arguments === 'string' 
                    ? JSON.parse(toolCall.function.arguments)
                    : toolCall.function?.arguments || toolCall.arguments
            }
        }));
    }
    
    return {message};
};

// Performance metrics mapping (Holo usage -> Ollama performance metrics)
export const fromHoloPerformanceTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    const result: Record<string, unknown> = {};
    
    if (source.usage) {
        // Map token counts to Ollama evaluation counts
        if (source.usage.input_tokens !== undefined) {
            result.prompt_eval_count = source.usage.input_tokens;
            result.prompt_eval_duration = source.usage.input_tokens * 1000000; // Rough estimate in nanoseconds
        }
        if (source.usage.output_tokens !== undefined) {
            result.eval_count = source.usage.output_tokens;
            result.eval_duration = source.usage.output_tokens * 2000000; // Rough estimate in nanoseconds
        }
        
        // Rough total duration estimate
        const totalTokens = (source.usage.input_tokens || 0) + (source.usage.output_tokens || 0);
        result.total_duration = totalTokens * 1500000; // Rough estimate in nanoseconds
        result.load_duration = 100000000; // 100ms estimate
    }
    
    // Add context if available
    result.context = [];
    
    return result;
};

// Response content mapping (for generate-style responses)
export const fromHoloResponseContentTranslator: Translator<HoloResponse, OllamaResponse> = (source) => {
    if (source.content && typeof source.content === 'string') {
        return {response: source.content};
    } else if (source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.content) {
            return {response: firstChoice.message.content};
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.content) {
            return {response: firstChoice.delta.content};
        }
    }
    return {};
};

// ========== HELPER FUNCTIONS ==========

// Helper to map OpenAI finish_reason to Ollama done_reason
const mapFinishReasonToDoneReason = (finishReason: string): string => {
    switch (finishReason) {
        case 'stop':
            return 'stop';
        case 'length':
            return 'length';
        case 'tool_calls':
            return 'stop';
        default:
            return 'stop';
    }
};

// Helper to map Claude stop_reason to Ollama done_reason
const mapStopReasonToDoneReason = (stopReason: string): string => {
    switch (stopReason) {
        case 'end_turn':
            return 'stop';
        case 'max_tokens':
            return 'length';
        case 'tool_use':
            return 'stop';
        default:
            return 'stop';
    }
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const fromHoloResponseTranslators: Translator<HoloResponse, OllamaResponse>[] = [
    fromHoloModelTranslator,
    fromHoloTimestampTranslator,
    fromHoloDoneTranslator,
    fromHoloMessageTranslator,
    fromHoloPerformanceTranslator,
    fromHoloResponseContentTranslator
];