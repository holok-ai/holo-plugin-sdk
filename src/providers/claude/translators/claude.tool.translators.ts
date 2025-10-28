import 'reflect-metadata';
import {HoloTool, HoloToolChoice, HoloToolChoiceValidator, HoloToolValidator} from "../../holo";
import {ClaudeTool, ClaudeToolChoice, ClaudeToolUnion} from "../types";
import {ClaudeToolChoiceValidator, ClaudeToolUnionValidator} from "../validators";
import {BaseTranslator} from "../../base.translator";
import {injectable} from 'tsyringe';
import {pickDefined} from "../../../utils";

@injectable()
export class ClaudeToolTranslator extends BaseTranslator<HoloTool, ClaudeToolUnion> {
    protected holoValidator = HoloToolValidator;
    protected providerValidator = ClaudeToolUnionValidator;
    protected holoDefaults: Partial<HoloTool> = {};
    protected providerDefaults: Partial<ClaudeToolUnion> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloTool): Promise<Partial<ClaudeToolUnion>> {
        return pickDefined({
            type: "custom" as const,
            name: source.name,
            description: source.description,
            input_schema: source.parameters ?? {type: "object", properties: {}, required: []}
        }) as Partial<ClaudeToolUnion>;
    }

    protected async toHoloImpl(source: ClaudeToolUnion): Promise<Partial<HoloTool>> {
        if (source.type !== "custom") return {};

        const tool = source as ClaudeTool;
        return pickDefined({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema
        }) as Partial<HoloTool>;
    }
}

@injectable()
export class ClaudeToolChoiceTranslator extends BaseTranslator<HoloToolChoice, ClaudeToolChoice> {
    protected holoValidator = HoloToolChoiceValidator;
    protected providerValidator = ClaudeToolChoiceValidator;
    protected holoDefaults: Partial<HoloToolChoice> = {};
    protected providerDefaults: Partial<ClaudeToolChoice> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloToolChoice): Promise<Partial<ClaudeToolChoice>> {
        if (source.type === "specific") {
            return pickDefined({type: "tool" as const, name: source.name});
        }
        return {type: source.type === "required" ? "any" : source.type};
    }

    protected async toHoloImpl(source: ClaudeToolChoice): Promise<Partial<HoloToolChoice>> {
        if (source.type === "tool") {
            return pickDefined({type: "specific" as const, name: (source as any).name});
        }
        return {type: source.type === "any" ? "required" : source.type};
    }
}
