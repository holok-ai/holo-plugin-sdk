import {HoloTool, HoloToolChoice, HoloToolChoiceValidator, HoloToolValidator} from "../../holo";
import {type} from "arktype";
import {OpenAIChatCompletionTool, OpenAIChatCompletionToolChoiceOption} from "../types";
import {FieldTranslator, TranslateFunc} from "../../types";

const ChatCompletionToolValidator = type({
    function: type({
        name: 'string',
        'description?': 'string',
        'parameters?': 'Record<string, unknown>',
        'strict?': 'boolean|null'
    }),
    type: "'function'"
});

const ChatCompletionToolChoiceOptionValidator = type("'none'|'auto'|'required'").or(type({
    function: type({
        name: 'string'
    }),
    type: "'function'"
}));

export const fromHoloToolTranslator: TranslateFunc<HoloTool, OpenAIChatCompletionTool> = async (holoTool: HoloTool): Promise<Partial<OpenAIChatCompletionTool>> => ({
    type: 'function',
    function: {
        name: holoTool.name,
        ...(holoTool.description && {description: holoTool.description}),
        ...(holoTool.parameters && {parameters: holoTool.parameters})
    }
});

export const toHoloToolTranslator: TranslateFunc<OpenAIChatCompletionTool, HoloTool> = async (openaiTool: OpenAIChatCompletionTool): Promise<Partial<HoloTool>> => ({
    name: openaiTool.function.name,
    ...(openaiTool.function.description && {description: openaiTool.function.description}),
    ...(openaiTool.function.parameters && {parameters: openaiTool.function.parameters})
});

export const OpenAIToolTranslator = new FieldTranslator<HoloTool, OpenAIChatCompletionTool>(
    HoloToolValidator,
    ChatCompletionToolValidator,
    [fromHoloToolTranslator],
    [toHoloToolTranslator]
);

export const fromHoloToolChoiceTranslator: TranslateFunc<HoloToolChoice, OpenAIChatCompletionToolChoiceOption> = async (choice: HoloToolChoice): Promise<Partial<OpenAIChatCompletionToolChoiceOption>> => {
    if (choice.type === "specific") {
        return {
            type: "function",
            function: {name: choice.name}
        };
    }
    return choice.type;
};

export const toHoloToolChoiceTranslator: TranslateFunc<OpenAIChatCompletionToolChoiceOption, HoloToolChoice> = async (choice: OpenAIChatCompletionToolChoiceOption): Promise<Partial<HoloToolChoice>> => {
    if (typeof choice === 'object' && choice.type === "function") {
        return {
            type: "specific",
            name: choice.function.name
        };
    }

    return {type: choice as 'auto' | 'none' | 'required'};
};

export const OpenAIToolChoiceTranslator = new FieldTranslator<HoloToolChoice, OpenAIChatCompletionToolChoiceOption>(
    HoloToolChoiceValidator,
    ChatCompletionToolChoiceOptionValidator,
    [fromHoloToolChoiceTranslator],
    [toHoloToolChoiceTranslator]
);
