import AIProvider from "./ai.provider";
import {Ollama} from "ollama";
import {IProvider, ModelInfo, OllamaProviderConfig} from "./types";
import {LLMWorkerRequest, OllamaGenerateQueueRequest, OllamaChatQueueRequest, Provider, RequestType} from "../types";
import {ErrorMessages} from "../utils/error-messages";
import logger from "../utils/logger";
import {ResponseService} from "../services";

export class OllamaProvider extends AIProvider implements IProvider {
    readonly name = 'ollama';
    private readonly client: Ollama = new Ollama();

    constructor(protected config: OllamaProviderConfig,
                protected responseService: ResponseService,
                protected workerId: string) {
        super(config, responseService, workerId);

        this.client = new Ollama(this.config);
    }

    async init(): Promise<void> {
        try {
            await this.getModels();

            logger.info('Ollama provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize Ollama provider: ${(error as Error).message}`);
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

            const response = await this.client.list();
            const modelList = response.models.map(model => ({
                id: model.name,
                name: model.name,
                modified_at: model.modified_at,
                size: model.size || 0
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`Ollama models: ${JSON.stringify(Object.keys(this.models))}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching Ollama models: ${(error as Error).stack}`);
            throw error;
        }
    }



    /**
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(request: LLMWorkerRequest): Promise<any> {
        logger.debug('Ollama provider handling LLM request', {
            requestId: request.requestId,
            sourceId: request.sourceId,
            type: request.type,
            provider: request.provider
        });

        // Validate this is for Ollama
        if (request.provider !== Provider.OLLAMA) {
            logger.error('Provider validation failed for Ollama', {
                expected: Provider.OLLAMA,
                received: request.provider,
                requestId: request.requestId
            });
            throw new Error(ErrorMessages.invalidProvider(request.provider, Provider.OLLAMA));
        }

        logger.debug('Provider validation successful for Ollama', {
            requestId: request.requestId,
            type: request.type
        });

        const { sourceId, requestId, payload, type } = request;
        
        if (type === RequestType.GENERATE) {
            const generatePayload = payload as OllamaGenerateQueueRequest;
            return await this.wrapWithStats(RequestType.GENERATE, this._ollamaGenerate.bind(this), sourceId, requestId, generatePayload);
        } else if (type === RequestType.CHAT) {
            const chatPayload = payload as OllamaChatQueueRequest;
            return await this.wrapWithStats(RequestType.CHAT, this._ollamaChat.bind(this), sourceId, requestId, chatPayload);
        } else {
            throw new Error(ErrorMessages.unsupportedRequestType(type));
        }
    }

    /**
     * Ollama chat completion using OllamaChatQueueRequest object
     */
    async _ollamaChat(
        sourceId: string,
        requestId: string,
        chatRequest: OllamaChatQueueRequest
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(chatRequest.model);

        let fullResponse = '';
        // Pass the request directly to the client since it extends ChatRequest
        // @ts-ignore
        const response = await this.client.chat(chatRequest);
        
        if (chatRequest.stream) {
            logger.debug('Starting Ollama chat stream', { requestId, model: chatRequest.model });
            
            try {
                for await (const chunk of response) {
                    //TODO simplify this logic
                    if (chunk.done) {
                        logger.debug('Ollama chat stream completed', { requestId, fullResponseLength: fullResponse.length });
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk);
                        break;
                    }

                    const token = chunk.message?.content || '';
                    fullResponse += token;

                    if (token) {
                         const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, chunk);
                        await this.onResponseChunk(responseChunk);
                    }
                }
            } catch (error) {
                logger.error('Ollama chat stream error', { 
                    requestId, 
                    error: (error as Error).message,
                    partialResponseLength: fullResponse.length 
                });
                throw error;
            }
        } else {
            fullResponse = response.message?.content || '';
            const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, response, fullResponse);
            await this.onResponseChunk(responseChunk);
        }
    }

    /**
     * Ollama generate completion using OllamaGenerateQueueRequest object
     */
    async _ollamaGenerate(sourceId: string, requestId: string, generateRequest: OllamaGenerateQueueRequest): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(generateRequest.model);

                let fullResponse = '';
                // @ts-ignore
                const response = await this.client.generate(generateRequest);
                if (generateRequest.stream) {
                    logger.debug('Starting Ollama generate stream', { requestId, model: generateRequest.model });
                    
                    try {
                        // Use Ollama streaming API
                        for await (const chunk of response) {
                            if (chunk.done) {
                                logger.debug('Ollama generate stream completed', { requestId, fullResponseLength: fullResponse.length });
                                const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, chunk, fullResponse);
                                await this.onResponseChunk(responseChunk);
                                break;
                            }

                            const token = chunk.response;
                            fullResponse += token;

                            if (token) {
                                const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, chunk);
                                await this.onResponseChunk(responseChunk);
                            }
                        }
                    } catch (error) {
                        logger.error('Ollama generate stream error', { 
                            requestId, 
                            error: (error as Error).message,
                            partialResponseLength: fullResponse.length 
                        });
                        throw error;
                    }
                } else {
                    fullResponse = response.response;
                    const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.OLLAMA, response, fullResponse);
                    await this.onResponseChunk(responseChunk);
                }

                logger.info(`Generated response with Ollama model ${generateRequest.model}, length: ${fullResponse.length}`);
            }
            

}
