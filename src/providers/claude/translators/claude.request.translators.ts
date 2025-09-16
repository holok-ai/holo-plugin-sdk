import {ClaudeChatRequest, HoloRequest} from "../../types";
import {Translator} from "../../translators";
import {fromHoloMessagesTranslator} from "./claude.request.message.translators";
import {fromHoloToolChoiceTranslator, fromHoloToolsTranslator} from "./claude.tool.translators";

export const fromHoloServiceTierTranslator: Translator<HoloRequest, ClaudeChatRequest> = (source) => {
    if (!source.service_tier) return {};

    // Map all non-'auto' service tiers to 'standard_only' for Claude
    const serviceTierValue = typeof source.service_tier === 'object' ?
        (source.service_tier as any)?.service_tier : source.service_tier;

    const service_tier = serviceTierValue === 'auto' ? 'auto' : 'standard_only';
    return {service_tier};
};

export const fromHoloMetadataTranslator: Translator<HoloRequest, ClaudeChatRequest> = (source) => {
    if (!source.metadata) return {};

    // Direct metadata translation
    const claudeMetadata = {
        user_id: source.metadata.user_id || null
    };

    return {metadata: claudeMetadata};
};

export const fromHoloRequestTranslators: Translator<HoloRequest, ClaudeChatRequest>[] = [
    fromHoloServiceTierTranslator,
    fromHoloMessagesTranslator,
    fromHoloToolsTranslator,
    fromHoloToolChoiceTranslator,
    fromHoloMetadataTranslator
];
