import {HoloRequest, HoloRequestValidator} from "../../holo";
import {createTranslateFunc, FieldTranslator, TranslateFunc} from "../../translators";
import {fromHoloMessagesTranslator, toHoloMessagesTranslator} from "./ollama.message.translators";
import {OllamaChatRequest, OllamaChatRequestValidator} from "../types";
import {OllamaToolTranslator} from "./ollama.tool.translators";
import {OllamaOptionsTranslator} from "./ollama.options.translators";

// Response format translator
export const fromHoloResponseFormatTranslator: TranslateFunc<HoloRequest, OllamaChatRequest> =
    async (holoRequest: HoloRequest): Promise<Partial<OllamaChatRequest>> => {
        if (!holoRequest.response_format) return {};

        switch (holoRequest.response_format.type) {
            case 'text':
                // Default behavior - omit format
                return {};
            case 'json_object':
                return {format: 'json'};
            case 'json_schema':
                // Pass schema object directly, ignore strict flag
                return {format: holoRequest.response_format.schema};
            default:
                return {};
        }
    };


// Reverse: format -> response_format
export const toHoloResponseFormatTranslator: TranslateFunc<OllamaChatRequest, HoloRequest> =
    async (ollamaRequest: OllamaChatRequest): Promise<Partial<HoloRequest>> => {
        const fmt = (ollamaRequest as any).format;
        if (!fmt) return {};

        if (fmt === 'json') {
            return {response_format: {type: 'json_object'}};
        }
        if (typeof fmt === 'object') {
            // assume schema object
            return {response_format: {type: 'json_schema', schema: fmt as Record<string, unknown>}};
        }
        // Unknown / unsupported formats -> drop
        return {};
    };

// Reverse: extract system from leading system message
export const toHoloSystemTranslator: TranslateFunc<OllamaChatRequest, HoloRequest> =
    async (ollamaRequest: OllamaChatRequest): Promise<Partial<HoloRequest>> => {
        if (!ollamaRequest.messages?.length) return {};

        const firstMessage = ollamaRequest.messages[0];
        if (firstMessage.role === 'system') {
            return {system: firstMessage.content};
        }

        return {};
    };


// Main Ollama request translator
export const OllamaRequestTranslator = new FieldTranslator<HoloRequest, OllamaChatRequest>(
    HoloRequestValidator,
    OllamaChatRequestValidator,
    [
        fromHoloResponseFormatTranslator,
        fromHoloMessagesTranslator,
        createTranslateFunc(OllamaOptionsTranslator.fromHolo, null, 'options'),
        createTranslateFunc(OllamaToolTranslator.fromHoloArray, 'tools')
    ],
    [
        // Reverse translators (Ollama -> Holo) - filter out system message since we extract it separately
        async (ollamaRequest: OllamaChatRequest): Promise<Partial<HoloRequest>> => {
            if (!ollamaRequest.messages?.length) return {};

            // Filter out leading system message since we extract it to top-level system
            const nonSystemMessages = ollamaRequest.messages.filter((msg, index) =>
                !(index === 0 && msg.role === 'system')
            );

            if (nonSystemMessages.length === 0) return {};

            return await toHoloMessagesTranslator({...ollamaRequest, messages: nonSystemMessages});
        },
        createTranslateFunc(OllamaOptionsTranslator.toHolo, 'options', null),
        createTranslateFunc(OllamaToolTranslator.toHoloArray, 'tools'),
        toHoloResponseFormatTranslator,
        toHoloSystemTranslator,
    ]
);
