import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import type {HoloContent} from "@holokai/types/holo";
import type {Part} from "@google/genai";

@injectable()
export class GeminiResponseContentTranslator extends BaseTranslator<HoloContent, Part> {
    protected holoDefaults: Partial<HoloContent> = {};
    protected providerDefaults: Partial<Part> = {};

    constructor() {
        super();
    }

    protected async fromHoloImpl(source: HoloContent): Promise<Partial<Part>> {
        if (source.type === 'text') {
            return {text: source.text};
        }
        return {};
    }

    protected async toHoloImpl(source: Part): Promise<Partial<HoloContent>> {
        if (source.text !== undefined) {
            return {type: 'text', text: source.text};
        }

        if (source.functionCall) {
            return {};
        }

        return {};
    }
}
