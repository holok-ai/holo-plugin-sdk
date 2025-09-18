import {HoloTool, HoloToolChoice, HoloToolChoiceValidator, HoloToolValidator} from "../../holo";
import {ClaudeTool, ClaudeToolChoice, ClaudeToolUnion} from "../types";
import {ClaudeToolChoiceValidator, ClaudeToolUnionValidator, ClaudeToolValidator} from "../validators";
import {ArkErrors} from "arktype";
import {FieldTranslator, Guard, TranslateFunc} from "../../types";

const defaultToolInputSchema: ClaudeTool["input_schema"] = {
    type: "object",
    properties: {},
    required: [] as string[],
};

export const fromToolParametersTranslator: TranslateFunc<HoloTool, ClaudeToolUnion> = async (holoTool: HoloTool): Promise<Partial<ClaudeToolUnion>> => ({
    type: 'custom',
    input_schema: {
        type: 'object',
        ...(holoTool.parameters ?? defaultToolInputSchema)
    }
});

export const customToolOnlyGuard = new Guard<ClaudeToolUnion>(
    "allowOnlyCustomTool",
    (tool) => !(ClaudeToolValidator(tool) instanceof ArkErrors) // pass if it IS a custom tool
);


export const toToolParameterTranslator = async (tool: ClaudeToolUnion): Promise<Partial<HoloTool>> => ({
    parameters: (tool as ClaudeTool).input_schema
});

export const ClaudeToolTranslator = new FieldTranslator<HoloTool, ClaudeToolUnion>(
    HoloToolValidator,
    ClaudeToolUnionValidator,
    [fromToolParametersTranslator],
    [toToolParameterTranslator],
    [],
    [customToolOnlyGuard]
)


export const fromHoloToolChoiceTranslator = async (choice: HoloToolChoice): Promise<Partial<ClaudeToolChoice>> => {
    if (choice.type === "specific") {
        return {type: "tool", name: choice.name};
    }
    return {type: choice.type === "required" ? "any" : choice.type};
};

// ClaudeToolChoice → HoloToolChoice
export const toHoloToolChoiceTranslator = async (tc: ClaudeToolChoice): Promise<HoloToolChoice> => {
    if (tc.type === "tool") {
        return {type: "specific", name: tc.name};
    }

    return {type: tc.type === "any" ? "required" : tc.type};
};

export const ClaudeToolChoiceTranslator = new FieldTranslator<HoloToolChoice, ClaudeToolChoice>(
    HoloToolChoiceValidator,
    ClaudeToolChoiceValidator,
    [fromHoloToolChoiceTranslator],
    [toHoloToolChoiceTranslator]
);
