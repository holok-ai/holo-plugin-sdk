import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloTool, HoloToolChoice} from "@holokai/types/holo";
import {FunctionCallingConfigMode} from "@google/genai";
import type {FunctionDeclaration, FunctionCallingConfig} from "@google/genai";

@injectable()
export class GeminiToolTranslator extends BaseTranslator<HoloTool, FunctionDeclaration> {
    protected holoDefaults: Partial<HoloTool> = {};
    protected providerDefaults: Partial<FunctionDeclaration> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloTool): Promise<Partial<FunctionDeclaration>> {
        return pickDefined({
            name: source.name,
            description: source.description,
            parameters: source.parameters ?? {type: "OBJECT", properties: {}}
        }) as Partial<FunctionDeclaration>;
    }

    protected async toHoloImpl(source: FunctionDeclaration): Promise<Partial<HoloTool>> {
        return pickDefined({
            name: source.name,
            description: source.description,
            parameters: source.parameters
        }) as Partial<HoloTool>;
    }
}

@injectable()
export class GeminiToolChoiceTranslator extends BaseTranslator<HoloToolChoice, FunctionCallingConfig> {
    protected holoDefaults: Partial<HoloToolChoice> = {};
    protected providerDefaults: Partial<FunctionCallingConfig> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloToolChoice): Promise<Partial<FunctionCallingConfig>> {
        switch (source.type) {
            case 'auto':
                return {mode: FunctionCallingConfigMode.AUTO};
            case 'none':
                return {mode: FunctionCallingConfigMode.NONE};
            case 'required':
                return {mode: FunctionCallingConfigMode.ANY};
            case 'specific':
                return pickDefined({
                    mode: FunctionCallingConfigMode.ANY,
                    allowedFunctionNames: source.name ? [source.name] : undefined
                }) as Partial<FunctionCallingConfig>;
            default:
                return {mode: FunctionCallingConfigMode.AUTO};
        }
    }

    protected async toHoloImpl(source: FunctionCallingConfig): Promise<Partial<HoloToolChoice>> {
        switch (source.mode) {
            case 'NONE':
                return {type: 'none'};
            case 'ANY':
                if (source.allowedFunctionNames?.length) {
                    return {type: 'specific', name: source.allowedFunctionNames[0]};
                }
                return {type: 'required'};
            case 'AUTO':
            default:
                return {type: 'auto'};
        }
    }
}
