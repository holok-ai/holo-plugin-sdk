import logger from "../../utils/logger";
import {HoloResponseValidator, HoloStreamChunkValidator} from "./validators";
import {pickDefined} from "../../utils";
import {HoloResponse, HoloStreamChunk} from "./types";
import {ProviderType} from "../types";

export class HoloResponseFactory {
    static log = logger.child({className: 'HoloResponseFactory'});

    static async createErrorResponse(id: string, model: string, error: string): Promise<HoloResponse> {
        return HoloResponseValidator.assert(pickDefined({
                id,
                model: model || 'unknown',
                created: Date.now(),
                messages: [{
                    role: 'assistant',
                    content: error
                }],
                finish_reason: 'stop'
            })
        )
    }

    /**
     * Creates error stream chunks in Holo format.
     * @param provider - Target provider type (CLAUDE, OPENAI, or OLLAMA from ProviderType enum)
     */
    static createErrorStreamChunks(id: string, model: string, error: string, provider: ProviderType): HoloStreamChunk[] {
        const created = Date.now();

        return [
            HoloStreamChunkValidator.assert(pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'message_start',
                    delta: { role: 'assistant' }
                }
            })),
            HoloStreamChunkValidator.assert(pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'content_delta',
                    delta: { content: error }
                }
            })),
            HoloStreamChunkValidator.assert(pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'message_stop',
                    delta: {}
                },
                finish_reason: 'stop'
            }))
        ];
    }
}
