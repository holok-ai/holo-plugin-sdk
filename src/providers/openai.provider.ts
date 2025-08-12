import {AIProvider} from './ai.provider';
import logger from '../utils/logger';
import OpenAI from 'openai';
import {AIRequestStat, IProvider, ModelInfo} from './types';
import {LLMWorkerRequest, OpenAIWorkerRequest, ProviderType} from '../types';
import {ErrorMessages} from '../utils/error-messages';
import {ResponseService} from "../services";
import {Provider} from "../db/types";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends AIProvider implements IProvider {
    private readonly client: OpenAI;

    constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(provider, responseService, workerId);
        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('OpenAI'));
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            logger: logger,
            logLevel: 'debug',
        });
    }

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        try {
            // Initialize the client
            await this.getModels();

            logger.info('OpenAI provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize OpenAI provider: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Get available models
     */
    async getModels(): Promise<ModelInfo[]> {
        try {
            if (!this.client) {
                await this.init();
            }

            const response = await this.client.models.list();
            const modelList = response.data.map(model => ({
                id: model.id,
                name: model.id,
                modified_at: new Date(model.created * 1000).toISOString()
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`OpenAI models: ${Object.keys(this.models)}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching OpenAI models: ${(error as Error).message}`);
            throw error;
        }
    }


    /**
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat> {
        logger.debug('OpenAI provider handling LLM request', {
            requestId: request.requestId,
            sourceId: request.sourceId,
            type: request.type,
            provider: request.providerType
        });

        // Validate this is for OpenAI
        if (request.providerType !== ProviderType.OPENAI) {
            logger.error('Provider validation failed for OpenAI', {
                expected: ProviderType.OPENAI,
                received: request.providerType,
                requestId: request.requestId
            });
            throw new Error(ErrorMessages.invalidProvider(request.providerType, ProviderType.OPENAI));
        }

        logger.debug('Provider validation successful for OpenAI', {
            requestId: request.requestId,
            type: request.type
        });

        const {sourceId, requestId, payload, type} = request;
        const openaiPayload = payload as OpenAIWorkerRequest;

        // OpenAI uses a unified chat completions API, so both generate and chat go through the same method
        return await this.wrapWithStats(type, this._openaiChatCompletions.bind(this), sourceId, requestId, openaiPayload);
    }

    /**
     * OpenAI chat completions using OpenAIWorkerRequest object
     */
    async _openaiChatCompletions(
        sourceId: string,
        requestId: string,
        chatRequest: OpenAIWorkerRequest
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(chatRequest.model);
        chatRequest.stream_options = {include_usage: true};
        let fullResponse = '';
        // Pass the request directly to the client since it extends ChatCompletionCreateParams
        // @ts-ignore
        const response = await this.client.chat.completions.create(chatRequest);

        if (chatRequest.stream) {
            logger.debug('Starting OpenAI chat completions stream', {requestId, model: chatRequest.model});

            try {
                // @ts-ignore
                for await (const chunk of response) {
                    logger.debug(`chunk payload: ${JSON.stringify(chunk)}`);
                    const choice = chunk.choices?.[0];
                    if (choice?.finish_reason) {
                        logger.debug('OpenAI chat completions stream completed', {
                            requestId,
                            finishReason: choice.finish_reason,
                            fullResponseLength: fullResponse.length
                        });
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk, true);
                        break;
                    }

                    if (choice?.delta?.content) {
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
                throw error;
            }
        } else {
            // For non-streaming, extract the text content
            const message = response as any;
            if (message.choices && message.choices.length > 0) {
                fullResponse = message.choices[0].message?.content || '';
            }

            const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, response, fullResponse);
            await this.onResponseChunk(responseChunk, true);
        }
    }
}
