import {Translator} from "../../translators";
import {HoloRequest} from "../../types";
import {toHoloMessagesTranslator} from "./claude.request.message.translators";
import {ClaudeChatRequest} from "../types";

// System mapping (Claude system messages -> Holo system)
export const toHoloSystemTranslator: Translator<ClaudeChatRequest, HoloRequest> = (source) => {
    if (source.system) {
        const system = source.system;
        if (typeof system === 'string') {
            return {system};
        } else if (Array.isArray(system)) {
            // Convert Claude system blocks to simple string for Holo
            const systemContent = system
                .map((block: any) => {
                    if ('text' in block) return block.text;
                    if ('cache_control' in block) return '';
                    return '';
                })
                .filter(Boolean)
                .join(' ');
            return systemContent ? {system: systemContent} : {};
        }
    }
    return {};
};

// ========== COMPLEX OBJECT TRANSLATORS ==========


// Tools mapping (Claude tools -> Holo tools)
export const toHoloToolsTranslator: Translator<ClaudeChatRequest, HoloRequest> = (source: ClaudeChatRequest) => {
    if (!source.tools || source.tools.length === 0) return {};

    const tools = source.tools.map(tool => {
        const claudeTool = tool as any;
        return {
            name: claudeTool.name,
            description: claudeTool.description || '',
            parameters: claudeTool.input_schema || {}
        };
    });

    return {tools};
};

// Tool choice mapping
export const toHoloToolChoiceTranslator: Translator<ClaudeChatRequest, HoloRequest> = (source) => {
    if (source.tool_choice) {
        if (typeof source.tool_choice === 'string') {
            return {tool_choice: source.tool_choice};
        } else if (typeof source.tool_choice === 'object' && 'type' in source.tool_choice) {
            if (source.tool_choice.type === 'tool' && 'name' in source.tool_choice) {
                const toolChoice = source.tool_choice as any;
                return {
                    tool_choice: {
                        type: 'specific',
                        name: toolChoice.name
                    }
                };
            }
            return {tool_choice: source.tool_choice.type};
        }
    }
    return {};
};

// ========== TRANSLATOR COLLECTION ==========

// Array of translators that will run in parallel via Promise.all
export const toHoloRequestTranslators: Translator<ClaudeChatRequest, HoloRequest>[] = [
    toHoloSystemTranslator,
    toHoloMessagesTranslator,
    toHoloToolsTranslator,
    toHoloToolChoiceTranslator
];
