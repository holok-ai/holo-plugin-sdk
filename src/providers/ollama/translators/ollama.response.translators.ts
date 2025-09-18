import {HoloFinishReason, HoloResponse, HoloResponseValidator, HoloUsage} from "../../holo";
import {OllamaChatResponseValidator} from "../validators";
import {OllamaChatResponse} from "../types";
import {createTranslateFunc, FieldTranslator, TranslateFunc} from "../../types";

export const fromHoloUsageTranslator: TranslateFunc<HoloUsage, Partial<OllamaChatResponse>> =
    async (holoUsage: HoloUsage): Promise<Partial<Partial<OllamaChatResponse>>> => {
        const result: Partial<OllamaChatResponse> = {};

        if (holoUsage.input_tokens !== undefined) {
            result.prompt_eval_count = holoUsage.input_tokens;
        }

        if (holoUsage.output_tokens !== undefined) {
            result.eval_count = holoUsage.output_tokens;
        }

        if (holoUsage.timings?.total !== undefined) {
            result.total_duration = holoUsage.timings.total;
        }

        if (holoUsage.timings?.load !== undefined) {
            result.load_duration = holoUsage.timings.load;
        }

        if (holoUsage.timings?.prompt_eval !== undefined) {
            result.prompt_eval_duration = holoUsage.timings.prompt_eval;
        }

        if (holoUsage.timings?.eval !== undefined) {
            result.eval_duration = holoUsage.timings.eval;
        }

        return result;
    };

export const toHoloUsageTranslator: TranslateFunc<OllamaChatResponse, HoloUsage> =
    async (ollamaResponse: OllamaChatResponse): Promise<Partial<HoloUsage>> => {
        const result: Partial<HoloUsage> = {};

        if (ollamaResponse.prompt_eval_count !== undefined) {
            result.input_tokens = ollamaResponse.prompt_eval_count;
        }

        if (ollamaResponse.eval_count !== undefined) {
            result.output_tokens = ollamaResponse.eval_count;
        }

        if (result.input_tokens !== undefined && result.output_tokens !== undefined) {
            result.total_tokens = result.input_tokens + result.output_tokens;
        }

        const timings: any = {};
        if (ollamaResponse.total_duration !== undefined) {
            timings.total = ollamaResponse.total_duration;
        }
        if (ollamaResponse.load_duration !== undefined) {
            timings.load = ollamaResponse.load_duration;
        }
        if (ollamaResponse.prompt_eval_duration !== undefined) {
            timings.prompt_eval = ollamaResponse.prompt_eval_duration;
        }
        if (ollamaResponse.eval_duration !== undefined) {
            timings.eval = ollamaResponse.eval_duration;
        }

        if (Object.keys(timings).length > 0) {
            result.timings = timings;
        }

        return result;
    };

// Note: No need for OllamaUsageTranslator since usage fields map directly to OllamaChatResponse top-level fields

export const fromHoloFinishReasonTranslator: TranslateFunc<HoloFinishReason, string> =
    async (holoFinishReason: HoloFinishReason): Promise<string> => {
        switch (holoFinishReason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
            case 'function_call':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            case null:
            default:
                return 'stop';
        }
    };

export const toHoloFinishReasonTranslator: TranslateFunc<string, HoloFinishReason> =
    async (ollamaStopReason: string): Promise<HoloFinishReason | null> => {
        if (!ollamaStopReason) {
            return null;
        }

        switch (ollamaStopReason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'tool_calls':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop';
        }
    };

export const fromHoloMessagesTranslator: TranslateFunc<HoloResponse, OllamaChatResponse> =
    async (holoResponse: HoloResponse): Promise<Partial<OllamaChatResponse>> => {
        let message: any = {
            role: 'assistant',
            content: ''
        };

        if (!holoResponse.messages?.length) {
            return {message}
        }

        const assistantMessage = holoResponse.messages[0];
        if (assistantMessage.role !== 'assistant') {
            return {message};
        }


        if (typeof assistantMessage.content === 'string') {
            message.content = assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
            const textParts = assistantMessage.content
                .filter(c => c.type === 'text')
                .map(c => (c as any).text);
            message.content = textParts.join('\n');

            const imageParts = assistantMessage.content
                .filter(c => c.type === 'image')
                .map(c => (c as any).url);

            if (imageParts.length > 0) {
                message.images = imageParts;
            }
        } else {
            message.content = '';
        }

        if (assistantMessage.tool_calls?.length) {
            message.tool_calls = assistantMessage.tool_calls.map(tc => ({
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }));
        }

        return message;
    };

export const toHoloMessagesTranslator: TranslateFunc<OllamaChatResponse, HoloResponse> =
    async (ollamaResponse: OllamaChatResponse): Promise<Partial<HoloResponse>> => {
        const message = ollamaResponse.message;
        const holoMessage: any = {
            role: message.role,
            content: message.content
        };

        if (message.tool_calls?.length) {
            holoMessage.tool_calls = message.tool_calls.map(tc => ({
                type: 'function' as const,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }));
        }

        return {messages: [holoMessage]};
    };

export const OllamaResponseTranslator = new FieldTranslator<HoloResponse, OllamaChatResponse>(
    HoloResponseValidator,
    OllamaChatResponseValidator,
    [
        async (holoResponse: HoloResponse): Promise<Partial<OllamaChatResponse>> => {
            if (!holoResponse.usage) return {};
            return await fromHoloUsageTranslator(holoResponse.usage);
        },
        createTranslateFunc(fromHoloFinishReasonTranslator, 'finish_reason', 'done_reason'),
        fromHoloMessagesTranslator
    ],
    [
        async (ollamaResponse: OllamaChatResponse): Promise<Partial<HoloResponse>> => {
            const usage = await toHoloUsageTranslator(ollamaResponse);
            return Object.keys(usage).length > 0 ? {usage} : {};
        },
        createTranslateFunc(toHoloFinishReasonTranslator, 'done_reason', 'finish_reason'),
        toHoloMessagesTranslator
    ]
);
