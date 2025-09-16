import {OpenAIResponse, HoloResponse} from "../../types";
import {Translator} from "../../translators";

// ========== SHARED FIELD TRANSLATORS ==========

// ID field mapping (direct mapping from OpenAI)
export const toHoloIdTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('id' in source && source.id) {
        return {id: source.id};
    }
    return {};
};

// Model field mapping
export const toHoloModelTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('model' in source && source.model) {
        return {model: source.model};
    }
    return {};
};

// Object type mapping
export const toHoloObjectTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('object' in source && source.object) {
        return {object: source.object};
    }
    return {};
};

// Role mapping (OpenAI assistant responses)
export const toHoloRoleTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.role) {
            return {role: firstChoice.message.role};
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.role) {
            return {role: firstChoice.delta.role};
        }
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========

// Content mapping (OpenAI message content -> Holo content)
export const toHoloContentTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.content) {
            return {content: firstChoice.message.content};
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.content) {
            return {content: firstChoice.delta.content};
        }
    }
    return {};
};

// Message mapping (for chat completions)
export const toHoloMessageTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message) {
            const message: Record<string, unknown> = {
                role: firstChoice.message.role,
                content: firstChoice.message.content,
                refusal: firstChoice.message.refusal || null
            };

            // Add tool calls if present
            if (firstChoice.message.tool_calls && firstChoice.message.tool_calls.length > 0) {
                message.tool_calls = firstChoice.message.tool_calls;
            }

            // Add function call if present
            if (firstChoice.message.function_call) {
                message.function_call = firstChoice.message.function_call;
            }

            // Add audio if present
            if (firstChoice.message.audio) {
                message.audio = firstChoice.message.audio;
            }

            // Add annotations if present
            if (firstChoice.message.annotations && firstChoice.message.annotations.length > 0) {
                message.annotations = firstChoice.message.annotations;
            }

            return {message};
        }
    }
    return {};
};

// Choices mapping (direct mapping for OpenAI)
export const toHoloChoicesTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices) {
        return {choices: source.choices};
    }
    return {};
};

// Usage mapping (direct mapping for OpenAI)
export const toHoloUsageTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('usage' in source && source.usage) {
        const usage: Record<string, number> = {
            input_tokens: source.usage.prompt_tokens || 0,
            output_tokens: source.usage.completion_tokens || 0,
            total_tokens: source.usage.total_tokens || 0
        };

        // Add completion token details if present
        if (source.usage.completion_tokens_details) {
            if (source.usage.completion_tokens_details.accepted_prediction_tokens) {
                usage.accepted_prediction_tokens = source.usage.completion_tokens_details.accepted_prediction_tokens;
            }
            if (source.usage.completion_tokens_details.audio_tokens) {
                usage.audio_tokens = source.usage.completion_tokens_details.audio_tokens;
            }
            if (source.usage.completion_tokens_details.reasoning_tokens) {
                usage.reasoning_tokens = source.usage.completion_tokens_details.reasoning_tokens;
            }
            if (source.usage.completion_tokens_details.rejected_prediction_tokens) {
                usage.rejected_prediction_tokens = source.usage.completion_tokens_details.rejected_prediction_tokens;
            }
        }

        // Add prompt token details if present
        if (source.usage.prompt_tokens_details) {
            if (source.usage.prompt_tokens_details.audio_tokens) {
                usage.prompt_audio_tokens = source.usage.prompt_tokens_details.audio_tokens;
            }
            if (source.usage.prompt_tokens_details.cached_tokens) {
                usage.cached_tokens = source.usage.prompt_tokens_details.cached_tokens;
            }
        }

        return {usage};
    }
    return {};
};

// Finish reason mapping
export const toHoloFinishReasonTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('finish_reason' in firstChoice && firstChoice.finish_reason) {
            return {finish_reason: firstChoice.finish_reason};
        }
    }
    return {};
};

// Stop reason mapping (for Claude compatibility)
export const toHoloStopReasonTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('finish_reason' in firstChoice && firstChoice.finish_reason) {
            return {stop_reason: firstChoice.finish_reason};
        }
    }
    return {};
};

// Timestamp mapping
export const toHoloTimestampTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('created' in source && source.created) {
        return {created: source.created};
    }
    return {};
};

// System fingerprint mapping
export const toHoloSystemFingerprintTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('system_fingerprint' in source && source.system_fingerprint) {
        return {system_fingerprint: source.system_fingerprint};
    }
    return {};
};

// Service tier mapping
export const toHoloServiceTierTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('service_tier' in source && source.service_tier) {
        return {service_tier: source.service_tier};
    }
    return {};
};

// Logprobs mapping
export const toHoloLogprobsTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('logprobs' in firstChoice && firstChoice.logprobs) {
            return {logprobs: firstChoice.logprobs};
        }
    }
    return {};
};

// Refusal mapping
export const toHoloRefusalTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.refusal) {
            return {refusal: firstChoice.message.refusal};
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.refusal) {
            return {refusal: firstChoice.delta.refusal};
        }
    }
    return {};
};

// Function call mapping
export const toHoloFunctionCallTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.function_call) {
            return {function_call: firstChoice.message.function_call};
        }
        if ('delta' in firstChoice && firstChoice.delta && firstChoice.delta.function_call) {
            return {function_call: firstChoice.delta.function_call};
        }
    }
    return {};
};

// Audio mapping
export const toHoloAudioTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.audio) {
            return {audio: firstChoice.message.audio};
        }
    }
    return {};
};

// Annotations mapping
export const toHoloAnnotationsTranslator: Translator<OpenAIResponse, HoloResponse> = (source) => {
    if ('choices' in source && source.choices && source.choices.length > 0) {
        const firstChoice = source.choices[0];
        if ('message' in firstChoice && firstChoice.message && firstChoice.message.annotations && firstChoice.message.annotations.length > 0) {
            return {annotations: firstChoice.message.annotations};
        }
    }
    return {};
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloResponseTranslators: Translator<OpenAIResponse, HoloResponse>[] = [
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
    toHoloSystemFingerprintTranslator,
    toHoloServiceTierTranslator,
    toHoloLogprobsTranslator,
    toHoloRefusalTranslator,
    toHoloFunctionCallTranslator,
    toHoloAudioTranslator,
    toHoloAnnotationsTranslator
];
