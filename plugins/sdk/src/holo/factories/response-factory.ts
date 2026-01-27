import {pickDefined} from "@holokai/sdk";
import {HoloResponse, HoloStreamChunk} from "../responses";

export class HoloResponseFactory {

    static async createErrorResponse(id: string, model: string, error: string): Promise<Partial<HoloResponse>> {
        return pickDefined({
            id,
            model: model || 'unknown',
            created: Date.now(),
            messages: [{
                role: 'assistant',
                content: error
            }],
            finish_reason: 'stop'
        });
    }

    static createErrorStreamChunks(id: string, model: string, error: string, provider: string): HoloStreamChunk[] {
        const created = Date.now();

        return [
            pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'message_start',
                    delta: {role: 'assistant'}
                }
            }),
            pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'content_delta',
                    delta: {content: error}
                }
            }),
            pickDefined({
                id,
                model,
                created,
                delta: {
                    provider,
                    type: 'message_stop',
                    delta: {}
                },
                finish_reason: 'stop'
            })
        ];
    }

    static createStatusChunk(id: string, model: string, message: string, provider: string): HoloStreamChunk {
        return pickDefined({
            id,
            model,
            created: Date.now(),
            delta: {
                provider,
                type: 'content_delta',
                delta: {content: `[${message}]\n`}
            }
        });
    }
}
