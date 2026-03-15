import 'reflect-metadata';
import {GeminiUsageTranslator} from "./gemini.usage.translator";
import {injectable} from 'tsyringe';
import {BaseTranslator} from "@holokai/sdk/provider";
import {pickDefined} from "@holokai/sdk";
import type {HoloMessage, HoloResponse} from "@holokai/types/holo";
import {FinishReason} from "@google/genai";
import type {GenerateContentResponse} from "@google/genai";
import {GeminiResponseMessageTranslator} from "./gemini.response.message.translator";
import {toHoloFinishReason, toGeminiFinishReason} from '../utils/finish.reason.mapper.js';

@injectable()
export class GeminiResponseTranslator extends BaseTranslator<HoloResponse, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloResponse> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    constructor(
        private readonly responseMessageTranslator: GeminiResponseMessageTranslator,
        private readonly usageTranslator: GeminiUsageTranslator
    ) {
        super();
    }

    protected async fromHoloImpl(source: HoloResponse): Promise<Partial<GenerateContentResponse>> {
        const messageResult = source.output?.length
            ? await this.responseMessageTranslator.fromHolo(source.output[0])
            : {role: 'model', parts: [{text: ''}]};

        const usageResult = source.usage
            ? await this.usageTranslator.fromHolo(source.usage)
            : undefined;

        return pickDefined({
            candidates: [{
                content: messageResult as any,
                finishReason: (toGeminiFinishReason(source.finish_reason ?? undefined) || FinishReason.STOP) as FinishReason,
                index: 0
            }],
            usageMetadata: usageResult,
            modelVersion: source.model
        }) as Partial<GenerateContentResponse>;
    }

    protected async toHoloImpl(source: GenerateContentResponse): Promise<Partial<HoloResponse>> {
        const candidate = source.candidates?.[0];
        if (!candidate) return {};

        const holoMessage = candidate.content
            ? await this.responseMessageTranslator.toHolo(candidate.content)
            : undefined;
        const output = holoMessage && Object.keys(holoMessage).length ? [holoMessage as HoloMessage] : [];

        const usage = source.usageMetadata
            ? await this.usageTranslator.toHolo(source.usageMetadata)
            : undefined;

        return pickDefined({
            model: source.modelVersion,
            output,
            finish_reason: toHoloFinishReason(candidate.finishReason as string | undefined),
            usage
        }) as Partial<HoloResponse>;
    }
}
