import OpenAI from 'openai';
import {ProviderType} from '../../types';
import {LLMWorkerResponse} from '../../../types';
import {ClassLogger} from '../../../types/class.logger';
import {OpenAIResponseCreateParams, OpenAIResponseStreamEvent} from '../types';

export class OpenAIResponsesService extends ClassLogger {
    constructor(
        private readonly client: OpenAI,
        private readonly createWorkerResponse: (
            sourceId: string,
            requestId: string,
            providerType: ProviderType,
            payload: OpenAIResponseStreamEvent | OpenAI.Responses.Response | Error,
            fullResponse?: string
        ) => LLMWorkerResponse,
        private readonly onResponseChunk: (responseChunk: LLMWorkerResponse, auditEnabled?: boolean) => Promise<void>,
        private readonly validateModel: (model: string) => void
    ) {
        super();
    }

    async execute(
        sourceId: string,
        requestId: string,
        responseRequest: OpenAIResponseCreateParams
    ): Promise<void> {
        const logger = this.mlog(this.execute);
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
            logger.debug('Starting OpenAI responses stream', {requestId, model: responseRequest.model});
            try {
                // @ts-ignore
                for await (const event of response) {
                    logger.debug(`Response event: ${JSON.stringify(event)}`);

                    const streamEvent = event as OpenAIResponseStreamEvent;

                    // Handle different event types
                    switch (streamEvent.type) {
                        case 'response.created':
                        case 'response.queued':
                        case 'response.in_progress':
                            // Lifecycle events - forward them
                            logger.debug(`Response lifecycle: ${streamEvent.type}`);
                            const lifecycleChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event);
                            await this.onResponseChunk(lifecycleChunk);
                            break;

                        case 'response.output_text.delta':
                            // Text content delta
                            if (timeToFirst === 0) timeToFirst = Date.now() - startTime;
                            fullResponse += streamEvent.delta;
                            const textChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event);
                            await this.onResponseChunk(textChunk);
                            break;

                        case 'response.output_text.done':
                            // Text content complete
                            logger.debug('Response text output done', {
                                fullResponseLength: fullResponse.length
                            });
                            break;

                        case 'response.completed':
                            // Response completed - send final chunk with usage
                            logger.debug('Response completed', {
                                fullResponseLength: fullResponse.length,
                                timeToFirst,
                                totalTime: Date.now() - startTime
                            });
                            const finalChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event, fullResponse);
                            await this.onResponseChunk(finalChunk, true);
                            break;

                        case 'response.failed':
                        case 'response.incomplete':
                            // Error states
                            logger.error(`Response ended with status: ${streamEvent.type}`);
                            const errorChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event);
                            await this.onResponseChunk(errorChunk, true);
                            break;

                        case 'error':
                            // Error event
                            logger.error('Response error event', {
                                message: streamEvent.message
                            });
                            const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event);
                            await this.onResponseChunk(errorResponse, false);
                            break;

                        default:
                            // Other events (tool calls, reasoning, etc.) - forward for now
                            const otherChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, event);
                            await this.onResponseChunk(otherChunk);
                            break;
                    }
                }
            } catch (error) {
                logger.error('OpenAI responses stream error', {
                    requestId,
                    error: (error as Error).message,
                    partialResponseLength: fullResponse.length
                });

                const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, error as Error);
                await this.onResponseChunk(errorResponse, false);
            }
        } else {
            // Non-streaming response
            logger.debug('Starting OpenAI responses non-streaming', {requestId, model: responseRequest.model});
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

                const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, message, fullResponse);
                await this.onResponseChunk(responseChunk, true);
            } catch (error) {
                logger.error('OpenAI responses error', {
                    requestId,
                    error: (error as Error).message
                });

                const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, error as Error);
                await this.onResponseChunk(errorResponse, false);
            }
        }
    }
}
