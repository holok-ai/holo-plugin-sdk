import 'reflect-metadata';
import {injectable} from 'tsyringe';
import type {HoloStreamChunk} from "@holokai/types/holo";
import {StreamTranslator} from "@holokai/sdk/provider";
import {FinishReason} from "@google/genai";
import type {GenerateContentResponse} from "@google/genai";

@injectable()
export class GeminiMessageStopTranslator extends StreamTranslator<HoloStreamChunk, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<GenerateContentResponse>[]> {
        const d = source.delta;
        if (!d) return [];

        if (d.provider_delta) {
            if (d.provider === 'gemini') {
                return [d.provider_delta];
            }
        }

        if (d.type === 'message_stop') {
            return [{
                candidates: [{
                    content: {role: 'model', parts: []},
                    finishReason: FinishReason.STOP,
                    index: 0
                }]
            }];
        }

        return [];
    }

    protected async toHoloManyImpl(source: GenerateContentResponse): Promise<Partial<HoloStreamChunk>[]> {
        return [{
            delta: {
                provider: 'gemini',
                type: 'message_stop' as const,
                delta: {},
                provider_delta: source
            },
            done: true
        }];
    }
}
