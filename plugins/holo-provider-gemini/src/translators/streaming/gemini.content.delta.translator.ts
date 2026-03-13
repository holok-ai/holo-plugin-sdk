import 'reflect-metadata';
import {injectable} from 'tsyringe';
import type {HoloStreamChunk} from "@holokai/types/holo";
import {StreamTranslator} from "@holokai/sdk/provider";
import type {GenerateContentResponse} from "@google/genai";

@injectable()
export class GeminiContentDeltaTranslator extends StreamTranslator<HoloStreamChunk, GenerateContentResponse> {
    protected holoDefaults: Partial<HoloStreamChunk> = {};
    protected providerDefaults: Partial<GenerateContentResponse> = {};

    constructor() {
        super();
    }

    protected async fromHoloManyImpl(source: HoloStreamChunk): Promise<Partial<GenerateContentResponse>[]> {
        const d = source.delta;
        if (!d) return [];

        if (d.type === 'content_delta' && typeof d.delta?.content === 'string') {
            return [{
                candidates: [{
                    content: {
                        role: 'model',
                        parts: [{text: d.delta.content}]
                    },
                    index: 0
                }]
            }];
        }

        return [];
    }

    protected async toHoloManyImpl(source: GenerateContentResponse): Promise<Partial<HoloStreamChunk>[]> {
        const out: Partial<HoloStreamChunk>[] = [];
        const candidate = source.candidates?.[0];
        if (!candidate?.content?.parts) return out;

        for (const part of candidate.content.parts) {
            if (part.text !== undefined) {
                out.push({
                    delta: {
                        provider: 'gemini',
                        type: 'content_delta' as const,
                        index: candidate.index ?? 0,
                        delta: {
                            content: part.text
                        },
                        provider_delta: source
                    }
                });
            }

            if (part.functionCall) {
                out.push({
                    delta: {
                        provider: 'gemini',
                        type: 'message_delta' as const,
                        index: candidate.index ?? 0,
                        delta: {
                            role: 'assistant' as const,
                            tool_calls: [{
                                id: part.functionCall.name || '',
                                type: 'function' as const,
                                function: {
                                    name: part.functionCall.name || '',
                                    arguments: part.functionCall.args as Record<string, unknown> || {}
                                }
                            }]
                        },
                        provider_delta: source
                    }
                });
            }
        }

        return out;
    }
}
