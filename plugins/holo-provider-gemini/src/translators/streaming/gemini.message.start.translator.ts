import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {v4 as uuidv4} from 'uuid';
import {GeminiUsageTranslator} from '../gemini.usage.translator';
import {StreamTranslator} from "@holokai/sdk/provider";
import type {HoloStreamChunk} from "@holokai/types/holo";
import type {GenerateContentResponse} from "@google/genai";

@injectable()
export class GeminiMessageStartTranslator extends StreamTranslator<HoloStreamChunk, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    constructor(private readonly usageTranslator: GeminiUsageTranslator) {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<GenerateContentResponse>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_start') return [];

        if (!source.model) return [];

        return [{
            candidates: [{
                content: {role: 'model', parts: []},
                index: 0
            }],
            modelVersion: source.model
        }];
    }

    protected async toHoloManyImpl(source: GenerateContentResponse): Promise<Partial<HoloStreamChunk>[]> {
        const usage = source.usageMetadata
            ? await this.usageTranslator.toHolo(source.usageMetadata)
            : null;

        return [{
            id: uuidv4(),
            ...(source.modelVersion ? {model: source.modelVersion} : {}),
            delta: {
                provider: 'gemini',
                type: 'message_start' as const,
                choice: 0,
                delta: {
                    role: 'assistant' as const
                },
                usage,
                provider_delta: source
            }
        }];
    }
}
