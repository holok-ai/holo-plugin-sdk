import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloTool, HoloToolChoice} from "@holokai/types/holo";
import {Tool, ToolChoice, ToolUnion} from "@anthropic-ai/sdk/resources/messages/messages";

@injectable()
export class ClaudeToolTranslator extends BaseTranslator<HoloTool, ToolUnion> {
    protected holoDefaults: Partial<HoloTool> = {};
    protected providerDefaults: Partial<ToolUnion> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloTool): Promise<Partial<ToolUnion>> {
        return pickDefined({
            type: "custom" as const,
            name: source.name,
            description: source.description,
            input_schema: source.parameters ?? {type: "object", properties: {}, required: []}
        }) as Partial<ToolUnion>;
    }

    protected async toHoloImpl(source: ToolUnion): Promise<Partial<HoloTool>> {
        if (source.type !== "custom") return {};

        const tool = source as Tool;
        return pickDefined({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema
        }) as Partial<HoloTool>;
    }
}

@injectable()
export class ClaudeToolChoiceTranslator extends BaseTranslator<HoloToolChoice, ToolChoice> {
    protected holoDefaults: Partial<HoloToolChoice> = {};
    protected providerDefaults: Partial<ToolChoice> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloToolChoice): Promise<Partial<ToolChoice>> {
        if (source.type === "specific") {
            return pickDefined({type: "tool" as const, name: source.name});
        }
        return {type: source.type === "required" ? "any" : source.type};
    }

    protected async toHoloImpl(source: ToolChoice): Promise<Partial<HoloToolChoice>> {
        if (source.type === "tool") {
            return pickDefined({type: "specific" as const, name: (source as any).name});
        }
        return {type: source.type === "any" ? "required" : source.type};
    }
}
