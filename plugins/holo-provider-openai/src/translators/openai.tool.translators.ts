import 'reflect-metadata';
import {HoloTool, HoloToolChoice, pickDefined} from "@holokai/sdk";
import {OpenAIChatCompletionTool, OpenAIChatCompletionToolChoiceOption} from "../types";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";

@injectable()
export class OpenAIToolTranslator extends BaseTranslator<HoloTool, OpenAIChatCompletionTool> {
    protected holoDefaults: Partial<HoloTool> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionTool> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloTool): Promise<Partial<OpenAIChatCompletionTool>> {
        return {
            type: 'function' as const,
            function: {
                name: source.name, // Required field
                ...pickDefined({
                    description: source.description,
                    parameters: source.parameters,
                })
            }
        };
    }

    protected async toHoloImpl(source: OpenAIChatCompletionTool): Promise<Partial<HoloTool>> {
        // Handle union type: only process function tools
        if (source.type === 'function') {
            return pickDefined({
                name: source.function.name,
                description: source.function.description,
                parameters: source.function.parameters,
            });
        }
        // Custom tools not supported in Holo - return empty object
        return {};
    }
}

@injectable()
export class OpenAIToolChoiceTranslator extends BaseTranslator<HoloToolChoice, OpenAIChatCompletionToolChoiceOption> {
    protected holoDefaults: Partial<HoloToolChoice> = {};
    protected providerDefaults: Partial<OpenAIChatCompletionToolChoiceOption> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloToolChoice): Promise<Partial<OpenAIChatCompletionToolChoiceOption>> {
        if (source.type === "specific") {
            return {
                type: "function",
                function: {name: source.name}
            };
        }
        return source.type as any; // 'auto' | 'none' | 'required'
    }

    protected async toHoloImpl(source: OpenAIChatCompletionToolChoiceOption): Promise<Partial<HoloToolChoice>> {
        if (typeof source === 'object' && source.type === "function") {
            return {
                type: "specific",
                name: source.function.name
            };
        }
        return {type: source as 'auto' | 'none' | 'required'};
    }
}
