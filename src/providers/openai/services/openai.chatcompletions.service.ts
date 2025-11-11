import OpenAI from 'openai';
import {ProviderType} from '../../types';
import {LLMWorkerResponse} from '../../../types';
import {ClassLogger} from '../../../types/class.logger';
import {OpenAIChatRequest} from '../types';

export class OpenAIChatCompletionsService extends ClassLogger {
    constructor(
        private readonly client: OpenAI,
        private readonly createWorkerResponse: (
            sourceId: string,
            requestId: string,
            providerType: any,
            payload: any,
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
        chatRequest: OpenAIChatRequest
    ): Promise<void> {
        const logger = this.mlog(this.execute);
        this.validateModel(chatRequest.model);

        let fullResponse = '';

        if (chatRequest.stream) {
            logger.debug("Streaming request setting stream_options flag");
            chatRequest.stream_options = {include_usage: true};
        }

        const response = await this.client.chat.completions.create(chatRequest);
        const startTime = Date.now();
        let timeToFirst: number = 0;

        if (chatRequest.stream) {
            logger.debug('Starting OpenAI chat completions stream', {requestId, model: chatRequest.model});
            try {
                // @ts-ignore
                for await (const chunk of response) {
                    logger.debug(`chunk payload: ${JSON.stringify(chunk)}`);

                    if (chunk?.usage) {
                        chunk.usage.timeToFirstToken = timeToFirst;
                        chunk.usage.totalProcessingTime = Date.now() - startTime;
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk, true);
                        break;
                    }

                    const choice = chunk.choices?.[0];
                    if (choice?.finish_reason) {
                        logger.debug('OpenAI chat completions stream completed', {
                            requestId,
                            finishReason: choice.finish_reason,
                            fullResponseLength: fullResponse.length
                        });
                    }

                    if (choice?.delta?.content) {
                        if (timeToFirst == 0) timeToFirst = Date.now() - startTime;
                        const token = choice.delta.content;
                        fullResponse += token;

                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk);
                        await this.onResponseChunk(responseChunk);
                    }
                }
            } catch (error) {
                logger.error('OpenAI chat completions stream error', {
                    requestId,
                    error: (error as Error).message,
                    partialResponseLength: fullResponse.length
                });

                const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, error);
                await this.onResponseChunk(errorResponse, false);
            }
        } else {
            logger.debug('Starting OpenAI chat completions non-streaming', {requestId, model: chatRequest.model});
            try {
                const message = response as any;
                if (message.choices && message.choices.length > 0) {
                    fullResponse = message.choices[0].message?.content || '';
                }

                const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, response, fullResponse);
                await this.onResponseChunk(responseChunk, true);
            } catch (error) {
                logger.error('OpenAI chat completions error', {
                    requestId,
                    error: (error as Error).message
                });

                const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, error);
                await this.onResponseChunk(errorResponse, false);
            }
        }
    }
}
