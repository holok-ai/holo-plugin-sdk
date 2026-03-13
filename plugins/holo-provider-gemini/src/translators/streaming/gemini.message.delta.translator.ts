import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {pickDefined} from '@holokai/sdk';
import type {HoloStreamChunk} from '@holokai/types/holo';
import {FinishReason} from '@google/genai';
import {toHoloFinishReason, toGeminiFinishReason} from '../../utils/finish.reason.mapper.js';
import {StreamTranslator} from "@holokai/sdk/provider";
import type {GenerateContentResponse} from "@google/genai";
import {GeminiUsageTranslator} from '../gemini.usage.translator';

@injectable()
export class GeminiMessageDeltaTranslator extends StreamTranslator<HoloStreamChunk, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    constructor(private readonly usageTranslator: GeminiUsageTranslator) {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<GenerateContentResponse>[]> {
        const d = source.delta;
        if (!d || d.type !== 'message_delta') return [];

        const finishReason = toGeminiFinishReason(source.finish_reason ?? undefined);

        const usage = d.usage
            ? pickDefined({
                promptTokenCount: d.usage.input_tokens,
                candidatesTokenCount: d.usage.output_tokens,
                totalTokenCount: d.usage.total_tokens
            })
            : undefined;

        if (!finishReason && !usage) return [];

        return [{
            candidates: [{
                content: {role: 'model', parts: []},
                ...(finishReason ? {finishReason: finishReason as FinishReason} : {}),
                index: 0
            }],
            ...(usage ? {usageMetadata: usage as any} : {})
        }];
    }

    protected async toHoloManyImpl(source: GenerateContentResponse): Promise<Partial<HoloStreamChunk>[]> {
        const candidate = source.candidates?.[0];
        if (!candidate) return [];

        const usage = source.usageMetadata
            ? await this.usageTranslator.toHolo(source.usageMetadata)
            : undefined;

        const chunk: Partial<HoloStreamChunk> = pickDefined({
            delta: {
                provider: 'gemini',
                type: 'message_delta' as const,
                choice: 0,
                delta: {},
                usage: usage ?? undefined,
                provider_delta: source
            },
            finish_reason: toHoloFinishReason(candidate.finishReason as string | undefined)
        }) as Partial<HoloStreamChunk>;

        return [chunk];
    }
}
