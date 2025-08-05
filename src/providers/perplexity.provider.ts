import {AIProvider} from './ai.provider';
import logger from '../utils/logger';
import OpenAI from 'openai';
import {AIRequestStat, IProvider, ModelInfo} from './types';
import {LLMWorkerRequest, OpenAIWorkerRequest, ProviderType} from '../types';
import {ErrorMessages} from '../utils/error-messages';
import {ChatCompletionChunk} from "openai/resources/chat/completions/completions";
import {Stream} from "openai/streaming";
import {ResponseService} from "../services";
import {Provider} from "../db/types";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class PerplexityProvider extends AIProvider implements IProvider {
    private readonly client: OpenAI;

    constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(provider, responseService, workerId);
        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('Perplexity'));
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl || 'https://api.perplexity.ai',
        });
    }

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        try {
            // Initialize the client
            await this.getModels();

            logger.info('Perplexity provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize Perplexity provider: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Get available models
     */
    async getModels(): Promise<ModelInfo[]> {
        try {
            const modelList = [
                {
                    id: 'sonar',
                    name: 'sonar',
                    modified_at: new Date(1651000000000).toISOString(),
                },
                {
                    id: 'sonar-pro',
                    name: 'sonar-pro',
                    modified_at: new Date(1651000000000).toISOString(),
                }
            ]

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`Perplexity models: ${Object.keys(this.models)}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching Perplexity models: ${(error as Error).message}`);
            throw error;
        }
    }


    /**
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat> {
        logger.debug('Perplexity provider handling LLM request', {
            requestId: request.requestId,
            sourceId: request.sourceId,
            type: request.type,
            provider: request.provider
        });

        // Validate this is for OpenAI
        if (request.provider !== ProviderType.PERPLEXITY) {
            logger.error('Provider validation failed for Perplexity', {
                expected: ProviderType.OPENAI,
                received: request.provider,
                requestId: request.requestId
            });
            throw new Error(ErrorMessages.invalidProvider(request.provider, ProviderType.OPENAI));
        }

        logger.debug('Provider validation successful for Perplexity', {
            requestId: request.requestId,
            type: request.type
        });

        const {sourceId, requestId, payload, type} = request;
        const openaiPayload = payload as OpenAIWorkerRequest;

        // OpenAI uses a unified chat completions API, so both generate and chat go through the same method
        return await this.wrapWithStats(type, this._perplexityChatCompletions.bind(this), sourceId, requestId, openaiPayload);
    }

    /**
     * OpenAI chat completions using OpenAIWorkerRequest object
     */
    async _perplexityChatCompletions(
        sourceId: string,
        requestId: string,
        chatRequest: OpenAIWorkerRequest
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(chatRequest.model);

        let fullResponse = '';
        // Pass the request directly to the client since it extends ChatCompletionCreateParams
        const response = await this.client.chat.completions.create(chatRequest);

        if (chatRequest.stream) {
            logger.debug('Starting Perplexity chat completions stream', {requestId, model: chatRequest.model});

            try {
                for await (const chunk of (response as Stream<ChatCompletionChunk>)) {
                    const choice = chunk.choices?.[0];

                    if (choice?.finish_reason) {
                        logger.debug('Perplexity chat completions stream completed', {
                            requestId,
                            finishReason: choice.finish_reason,
                            fullResponseLength: fullResponse.length
                        });
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OPENAI, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk);
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
                logger.error('Perplexity chat completions stream error', {
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
            await this.onResponseChunk(responseChunk);
        }
    }
}
