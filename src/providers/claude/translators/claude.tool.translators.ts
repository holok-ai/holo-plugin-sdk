import {Translator} from "../../translators";
import {HoloRequest} from "../../holo";
import {ClaudeChatRequest} from "../types";

export const fromHoloToolsTranslator: Translator<HoloRequest, ClaudeChatRequest> = (source) => {
    if (!source.tools) return {};

    // Direct tool translation
    const claudeTools = source.tools.map(tool => ({
        name: tool.name,
        ...(tool.description && {description: tool.description}),
        input_schema: {
            type: 'object' as const,
            properties: tool.parameters || {},
            required: Object.keys(tool.parameters || {})
        }
    }));

    return {tools: claudeTools};
};
export const fromHoloToolChoiceTranslator: Translator<HoloRequest, ClaudeChatRequest> = (source) => {
    if (!source.tool_choice) return {};

    // Direct tool choice translation
    let claudeToolChoice: any;
    if (typeof source.tool_choice === 'string') {
        switch (source.tool_choice) {
            case 'auto':
                claudeToolChoice = {type: 'auto'};
                break;
            case 'none':
                claudeToolChoice = {type: 'none'};
                break;
            case 'required':
                claudeToolChoice = {type: 'any'}; // Claude's 'any' is similar to 'required'
                break;
            default:
                claudeToolChoice = {type: 'auto'};
                break;
        }
    } else if (source.tool_choice.type === 'specific') {
        claudeToolChoice = {
            type: 'tool',
            name: source.tool_choice.name
        };
    } else {
        claudeToolChoice = {type: 'auto'};
    }

    return {tool_choice: claudeToolChoice};
};
