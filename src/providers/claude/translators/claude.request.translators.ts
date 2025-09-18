import {ClaudeChatRequest, HoloRequest, HoloRequestValidator} from "../../types";
import {createTranslateFunc, FieldTranslator, TranslateFunc} from "../../translators";
import {fromHoloMessagesTranslator, toHoloMessagesTranslator} from "./claude.message.translators";
import {ClaudeToolChoiceTranslator, ClaudeToolTranslator} from "./claude.tool.translators";
import {ClaudeChatRequestValidator} from "../claude.request.validators";

export const fromHoloServiceTierTranslator: TranslateFunc<HoloRequest, ClaudeChatRequest> = async (source: HoloRequest) => {
    if (!source.service_tier) return {};

    // Map all non-'auto' service tiers to 'standard_only' for Claude
    const serviceTierValue = typeof source.service_tier === 'object' ?
        (source.service_tier as any)?.service_tier : source.service_tier;

    const service_tier = serviceTierValue === 'auto' ? 'auto' : 'standard_only';
    return {service_tier};
};

export const fromHoloMetadataTranslator: TranslateFunc<HoloRequest, ClaudeChatRequest> = async (source: HoloRequest) => {
    if (!source.metadata) return {};

    // Direct metadata translation
    const claudeMetadata = {
        user_id: source.metadata.user_id || null
    };

    return {metadata: claudeMetadata};
};

// Note: Reverse translators for service_tier and metadata are not needed
// because they get copied automatically in the spread operation

export const ClaudeRequestTranslator = new FieldTranslator<HoloRequest, ClaudeChatRequest>(
    HoloRequestValidator,
    ClaudeChatRequestValidator,
    [
        fromHoloServiceTierTranslator,
        fromHoloMetadataTranslator,
        fromHoloMessagesTranslator,
        createTranslateFunc(ClaudeToolChoiceTranslator.fromHolo, 'tool_choice'),
        createTranslateFunc(ClaudeToolTranslator.fromHoloArray, 'tools')
    ],
    [
        //service_tier and metadata are copied over in the spread operation
        toHoloMessagesTranslator,
        createTranslateFunc(ClaudeToolChoiceTranslator.toHolo, 'tool_choice'),
        createTranslateFunc(ClaudeToolTranslator.toHoloArray, 'tools')
    ]
);
