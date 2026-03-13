import 'reflect-metadata';

import {injectable} from 'tsyringe';
import {GeminiMessageStartTranslator} from './gemini.message.start.translator';
import {GeminiMessageDeltaTranslator} from './gemini.message.delta.translator';
import {GeminiMessageStopTranslator} from './gemini.message.stop.translator';
import {GeminiContentDeltaTranslator} from './gemini.content.delta.translator';
import {toGeminiFinishReason} from '../../utils/finish.reason.mapper.js';
import {StreamTranslator} from "@holokai/sdk/provider";
import type {HoloStreamChunk} from "@holokai/types/holo";
import type {GenerateContentResponse} from "@google/genai";

@injectable()
export class GeminiStreamTranslator extends StreamTranslator<HoloStreamChunk, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    private isFirstChunk = true;
    private hasEmittedStop = false;

    constructor(
        private readonly messageStartTranslator: GeminiMessageStartTranslator,
        private readonly messageDeltaTranslator: GeminiMessageDeltaTranslator,
        private readonly messageStopTranslator: GeminiMessageStopTranslator,
        private readonly contentDeltaTranslator: GeminiContentDeltaTranslator,
    ) {
        super();
    }

    protected async toHoloManyImpl(source: GenerateContentResponse): Promise<Partial<HoloStreamChunk>[]> {
        const results: Partial<HoloStreamChunk>[] = [];
        const candidate = source.candidates?.[0];

        if (this.isFirstChunk) {
            this.isFirstChunk = false;
            results.push(...await this.messageStartTranslator.toHoloMany(source));
        }

        if (candidate?.content?.parts?.length) {
            results.push(...await this.contentDeltaTranslator.toHoloMany(source));
        }

        if (candidate?.finishReason) {
            results.push(...await this.messageDeltaTranslator.toHoloMany(source));

            if (!this.hasEmittedStop) {
                this.hasEmittedStop = true;
                results.push(...await this.messageStopTranslator.toHoloMany(source));
            }
        }

        return results;
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<GenerateContentResponse>[]> {
        const d = source.delta;
        if (!d) return [];

        const hasGeminiProviderDelta = d.provider === 'gemini' && d.provider_delta;
        if (hasGeminiProviderDelta) {
            return [d.provider_delta];
        }

        switch (d.type) {
            case 'message_start':
                return this.messageStartTranslator.fromHoloMany(source);

            case 'message_delta': {
                const results: Partial<GenerateContentResponse>[] = [];
                results.push(...await this.messageDeltaTranslator.fromHoloMany(source));

                const geminiFinishReason = toGeminiFinishReason(source.finish_reason ?? undefined);
                if (geminiFinishReason) {
                    results.push(...await this.messageStopTranslator.fromHoloMany(source));
                }

                return results;
            }

            case 'content_delta':
                return this.contentDeltaTranslator.fromHoloMany(source);

            case 'message_stop':
                return this.messageStopTranslator.fromHoloMany(source);

            default:
                return [];
        }
    }
}
