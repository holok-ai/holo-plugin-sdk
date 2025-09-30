import {createTranslateFunc, FieldTranslator, TranslateFunc} from "../../types";
import {HoloRequest, HoloRequestValidator} from "../../holo";
import {ClaudeChatRequestValidator, defaultClaudeChatRequestValues} from "../validators";
import {fromHoloMessagesTranslator, toHoloMessagesTranslator} from "./claude.message.translators";
import {ClaudeToolChoiceTranslator, ClaudeToolTranslator} from "./claude.tool.translators";
import {ClaudeChatRequest} from "../types";

export const fromHoloSimpleFields: TranslateFunc<HoloRequest, ClaudeChatRequest> = async (source: HoloRequest) => {
    const {service_tier, metadata, response_format} = source;
    let {system} = source;

    if (response_format) {
        system = system || '';
        if (response_format?.type === 'json_schema') {
            system += `You must respond with valid JSON that matches this exact schema: ${JSON.stringify(response_format.schema)}`;
            if (response_format.strict) {
                system += ' You must strictly adhere to this schema with no additional properties.';
            }
        } else if (response_format?.type === 'json_object') {
            system += 'You must respond with a valid JSON object.';
        }
    }

    return {
        ...(service_tier && {service_tier: service_tier === 'auto' ? 'auto' : 'standard_only'}),
        ...(metadata && metadata.user_id && {metadata: {user_id: metadata.user_id}}),
        ...(system && {system})
    }
}

// Note: Reverse translators for service_tier and metadata are not needed
// because they get copied automatically in the spread operation

export const ClaudeRequestTranslator = new FieldTranslator<HoloRequest, ClaudeChatRequest>(
    HoloRequestValidator,
    ClaudeChatRequestValidator,
    [
        fromHoloSimpleFields,
        fromHoloMessagesTranslator,
        createTranslateFunc(ClaudeToolChoiceTranslator.fromHolo, 'tool_choice', 'tool_choice', 'ClaudeToolChoiceTranslator.fromHolo'),
        createTranslateFunc(ClaudeToolTranslator.fromHoloArray, 'tools', 'tools', 'ClaudeToolTranslator.fromHoloArray')
    ],
    [
        //service_tier and metadata are copied over in the spread operation
        toHoloMessagesTranslator,
        createTranslateFunc(ClaudeToolChoiceTranslator.toHolo, 'tool_choice', 'tool_choice', 'ClaudeToolChoiceTranslator.toHolo'),
        createTranslateFunc(ClaudeToolTranslator.toHoloArray, 'tools', 'tools', 'ClaudeToolTranslator.toHoloArray')
    ],
    {
        skipValidation: false,
        name: 'ClaudeRequestTranslator',
        defaultFromHoloValues: defaultClaudeChatRequestValues
    }
);
