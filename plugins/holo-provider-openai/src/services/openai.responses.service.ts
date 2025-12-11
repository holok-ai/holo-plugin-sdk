import OpenAI from 'openai';
import {OpenAIResponseCreateParams, OpenAIResponseStreamEvent} from '../types';
import {HoloWorkerResponse} from "@holokai/sdk";

export class OpenAIResponsesService {
    constructor(
        private readonly client: OpenAI,
        private readonly createWorkerResponse: (
            sourceId: string,
            requestId: string,
            providerType: 'openai',
            payload: OpenAIResponseStreamEvent | OpenAI.Responses.Response | Error,
            fullResponse?: string
        ) => HoloWorkerResponse,
        private readonly onResponseChunk: (responseChunk: HoloWorkerResponse, auditEnabled?: boolean) => Promise<void>,
        private readonly validateModel: (model: string) => void
    ) {
    }

    async execute(
        sourceId: string,
        requestId: string,
        responseRequest: OpenAIResponseCreateParams
    ): Promise<void> {
        if (responseRequest.model) {
            this.validateModel(responseRequest.model);
        }

        let fullResponse = '';

        // @ts-ignore - OpenAI SDK types may need adjustment for responses API
        const response = await this.client.responses.create(responseRequest);
        const startTime = Date.now();
        let timeToFirst: number = 0;

        // Check if response is async iterable (streaming)
        const isStreaming = responseRequest.stream === true && Symbol.asyncIterator in Object(response);

        if (isStreaming) {
            try {
                // @ts-ignore
                for await (const event of response) {
                    const streamEvent = event as OpenAIResponseStreamEvent;

                    // Handle different event types
                    switch (streamEvent.type) {
                        case 'response.created':
                        case 'response.queued':
                        case 'response.in_progress':
                            // Lifecycle events - forward them
                            const lifecycleChunk = this.createWorkerResponse(sourceId, requestId, 'openai', event);
                            await this.onResponseChunk(lifecycleChunk);
                            break;

                        case 'response.output_text.delta':
                            // Text content delta
                            if (timeToFirst === 0) timeToFirst = Date.now() - startTime;
                            fullResponse += streamEvent.delta;
                            const textChunk = this.createWorkerResponse(sourceId, requestId, 'openai', event);
                            await this.onResponseChunk(textChunk);
                            break;

                        case 'response.output_text.done':
                            // Text content complete
                            break;

                        case 'response.completed':
                            const finalChunk = this.createWorkerResponse(sourceId, requestId, 'openai', event, fullResponse);
                            await this.onResponseChunk(finalChunk, true);
                            break;

                        case 'response.failed':
                        case 'response.incomplete':
                            // Error states
                            const errorChunk = this.createWorkerResponse(sourceId, requestId, 'openai', event);
                            await this.onResponseChunk(errorChunk, true);
                            break;

                        case 'error':
                            // Error event
                            const errorResponse = this.createWorkerResponse(sourceId, requestId, 'openai', event);
                            await this.onResponseChunk(errorResponse, false);
                            break;

                        default:
                            // Other events (tool calls, reasoning, etc.) - forward for now
                            const otherChunk = this.createWorkerResponse(sourceId, requestId, 'openai', event);
                            await this.onResponseChunk(otherChunk);
                            break;
                    }
                }
            } catch (error) {
                const errorResponse = this.createWorkerResponse(sourceId, requestId, 'openai', error as Error);
                await this.onResponseChunk(errorResponse, false);
            }
        } else {
            try {
                const message = response as OpenAI.Responses.Response;

                // Extract text from output items
                if (message.output && Array.isArray(message.output)) {
                    for (const item of message.output) {
                        if (item.type === 'message' && item.content) {
                            for (const content of item.content) {
                                if (content.type === 'output_text') {
                                    fullResponse += content.text;
                                }
                            }
                        }
                    }
                }

                const responseChunk = this.createWorkerResponse(sourceId, requestId, 'openai', message, fullResponse);
                await this.onResponseChunk(responseChunk, true);
            } catch (error) {
                const errorResponse = this.createWorkerResponse(sourceId, requestId, 'openai', error as Error);
                await this.onResponseChunk(errorResponse, false);
            }
        }
    }
}
