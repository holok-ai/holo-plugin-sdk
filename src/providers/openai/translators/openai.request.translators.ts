import {createTranslateFunc, FieldTranslator, HoloRequest, OpenAIChatRequest, TranslateFunc} from "../../types";
import {OpenAIChatRequestValidator} from "../validators";
import {HoloRequestValidator} from "../../holo";
import {fromHoloMessagesWithSystemTranslator, toHoloMessagesWithSystemTranslator} from "./openai.message.translators";
import {OpenAIToolChoiceTranslator, OpenAIToolTranslator} from "./openai.tool.translators";

export const fromHoloServiceTierTranslator: TranslateFunc<HoloRequest, OpenAIChatRequest> = async (source: HoloRequest) => {
    if (!source.service_tier) return {};

    const serviceTierMap: Record<string, 'auto' | 'default'> = {
        'auto': 'auto',
        'default': 'default'
    };

    const mapped = serviceTierMap[source.service_tier];
    return mapped ? {service_tier: mapped} : {};
};

export const fromHoloMetadataTranslator: TranslateFunc<HoloRequest, OpenAIChatRequest> = async (source: HoloRequest) => {
    if (!source.metadata?.user_id) return {};

    return {user: source.metadata.user_id};
};

export const fromHoloStopSequencesTranslator: TranslateFunc<HoloRequest, OpenAIChatRequest> = async (source: HoloRequest) => {
    if (!source.stop_sequences) return {};

    return {stop: source.stop_sequences};
};

export const fromHoloResponseFormatTranslator: TranslateFunc<HoloRequest, OpenAIChatRequest> = async (source: HoloRequest) => {
    if (!source.response_format) return {};

    const format = source.response_format;

    if (format.type === 'text') {
        return {};
    }

    if (format.type === 'json_object') {
        return {response_format: {type: 'json_object'}};
    }

    if (format.type === 'json_schema') {
        return {
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'holo',
                    schema: format.schema,
                    ...(format.strict !== undefined && {strict: format.strict})
                }
            }
        };
    }

    return {};
};

export const toHoloStopSequencesTranslator: TranslateFunc<OpenAIChatRequest, HoloRequest> = async (source: OpenAIChatRequest) => {
    if (!source.stop) return {};

    const stop = Array.isArray(source.stop) ? source.stop : [source.stop];
    return {stop_sequences: stop};
};

export const toHoloMetadataTranslator: TranslateFunc<OpenAIChatRequest, HoloRequest> = async (source: OpenAIChatRequest) => {
    if (!source.user) return {};

    return {
        metadata: {
            user_id: source.user
        }
    };
};

export const toHoloResponseFormatTranslator: TranslateFunc<OpenAIChatRequest, HoloRequest> = async (source: OpenAIChatRequest) => {
    if (!source.response_format) return {};

    const format = source.response_format as any;

    if (format.type === 'json_object') {
        return {response_format: {type: 'json_object'}};
    }

    if (format.type === 'json_schema') {
        return {
            response_format: {
                type: 'json_schema',
                schema: format.json_schema.schema,
                ...(format.json_schema.strict !== undefined && {strict: format.json_schema.strict})
            }
        };
    }

    return {};
};

export const OpenAIRequestTranslator = new FieldTranslator<HoloRequest, OpenAIChatRequest>(
    HoloRequestValidator,
    OpenAIChatRequestValidator,
    [
        fromHoloServiceTierTranslator,
        fromHoloMetadataTranslator,
        fromHoloStopSequencesTranslator,
        fromHoloResponseFormatTranslator,
        fromHoloMessagesWithSystemTranslator,
        createTranslateFunc(OpenAIToolChoiceTranslator.fromHolo, 'tool_choice', 'tool_choice', 'OpenAIToolChoiceTranslator.fromHolo'),
        createTranslateFunc(OpenAIToolTranslator.fromHoloArray, 'tools', 'tools', 'OpenAIToolTranslator.fromHoloArray')
    ],
    [
        toHoloStopSequencesTranslator,
        toHoloMetadataTranslator,
        toHoloResponseFormatTranslator,
        toHoloMessagesWithSystemTranslator,
        createTranslateFunc(OpenAIToolChoiceTranslator.toHolo, 'tool_choice', 'tool_choice', 'OpenAIToolChoiceTranslator.toHolo'),
        createTranslateFunc(OpenAIToolTranslator.toHoloArray, 'tools', 'tools', 'OpenAIToolTranslator.toHoloArray')
    ],
    {
        name: 'OpenAIRequestTranslator'
    }
);
