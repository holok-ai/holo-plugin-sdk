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
                    delta: { role: 'assistant', content: error }
                }
            })),
            HoloStreamChunkValidator.assert(pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'message_stop',
                    delta: {role: 'assistant', content: ""}
                },
                finish_reason: 'stop'
            }))
        ];
    }

    static createStatusChunk(id: string, model: string, message: string, provider: ProviderType): HoloStreamChunk {
        return HoloStreamChunkValidator.assert(pickDefined({
            id,
            model,
            created: Date.now(),
            delta: {
                provider,
                type: 'content_delta',
                delta: {role: 'assistant', content: `[${message}]\n` }
            }
        }));
    }
}
