import {Translator} from "../../translators";

type HoloResponseType = any;
type OpenAIResponseType = any;

export const fromHoloChoicesTranslator: Translator<HoloResponseType, OpenAIResponseType> = (source) => {
    if (source.choices) {
        return {choices: source.choices};
    }

    const choice: Record<string, unknown> = {
        index: 0,
        logprobs: source.logprobs || null
    };

    if (source.content || source.role) {
        const message: Record<string, unknown> = {
            role: source.role || 'assistant',
            content: source.content || null,
            refusal: source.refusal || null
        };

        if (source.function_call) {
            message.function_call = source.function_call;
        }

        if (source.tool_calls) {
            message.tool_calls = source.tool_calls;
        }

        if (source.audio) {
            message.audio = source.audio;
        }

        if (source.annotations) {
            message.annotations = source.annotations;
        }

        choice.message = message;
        choice.finish_reason = mapStopReasonToFinishReason(source.stop_reason || source.finish_reason);
    }
    else if (source.delta) {
        choice.delta = source.delta;
        choice.finish_reason = mapStopReasonToFinishReason(source.stop_reason || source.finish_reason) || null;
    }

    return {choices: [choice]};
};

export const fromHoloUsageTranslator: Translator<HoloResponseType, OpenAIResponseType> = (source) => {
    if (source.usage) {
        const usage: Record<string, unknown> = {
            prompt_tokens: source.usage.input_tokens || 0,
            completion_tokens: source.usage.output_tokens || 0,
            total_tokens: source.usage.total_tokens ||
                ((source.usage.input_tokens || 0) + (source.usage.output_tokens || 0))
        };

        if (source.usage.accepted_prediction_tokens ||
            source.usage.audio_tokens ||
            source.usage.reasoning_tokens ||
            source.usage.rejected_prediction_tokens) {

            usage.completion_tokens_details = {};
            if (source.usage.accepted_prediction_tokens) {
                (usage.completion_tokens_details as any).accepted_prediction_tokens = source.usage.accepted_prediction_tokens;
            }
            if (source.usage.audio_tokens) {
                (usage.completion_tokens_details as any).audio_tokens = source.usage.audio_tokens;
            }
            if (source.usage.reasoning_tokens) {
                (usage.completion_tokens_details as any).reasoning_tokens = source.usage.reasoning_tokens;
            }
            if (source.usage.rejected_prediction_tokens) {
                (usage.completion_tokens_details as any).rejected_prediction_tokens = source.usage.rejected_prediction_tokens;
            }
        }

        if (source.usage.prompt_audio_tokens || source.usage.cached_tokens) {
            usage.prompt_tokens_details = {};
            if (source.usage.prompt_audio_tokens) {
                (usage.prompt_tokens_details as any).audio_tokens = source.usage.prompt_audio_tokens;
            }
            if (source.usage.cached_tokens) {
                (usage.prompt_tokens_details as any).cached_tokens = source.usage.cached_tokens;
            }
        }

        return {usage};
    }
    return {};
};

const mapStopReasonToFinishReason = (stopReason?: string): string | null => {
    if (!stopReason) return null;

    switch (stopReason) {
        case 'end_turn':
        case 'stop':
            return 'stop';
        case 'max_tokens':
        case 'length':
            return 'length';
        case 'tool_use':
        case 'tool_calls':
            return 'tool_calls';
        case 'stop_sequence':
        case 'content_filter':
            return 'content_filter';
        case 'function_call':
            return 'function_call';
        default:
            return 'stop';
    }
};

export const fromHoloResponseTranslators: Translator<HoloResponseType, OpenAIResponseType>[] = [
    fromHoloChoicesTranslator,
    fromHoloUsageTranslator
];
