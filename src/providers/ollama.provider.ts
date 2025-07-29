import AIProvider from "./ai.provider";
import {ChatResponse, GenerateResponse, Ollama} from "ollama";
import {IProvider, ModelInfo, OllamaProviderConfig} from "./types";
import {LLMWorkerRequest, OllamaGenerateQueueRequest, OllamaChatQueueRequest, Provider, LLMWorkerResponse} from "../types";
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


    generateOptionalData(fullResponse: string, chunk: GenerateResponse | ChatResponse) {
        return {
            fullResponse,
            total_duration: chunk.total_duration,
            prompt_eval_count: chunk.prompt_eval_count,
            eval_count: chunk.eval_count,
            eval_duration: chunk.eval_duration
        }
    }


    /**
     * DKs new method.
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(request: LLMWorkerRequest): Promise<any> {
        // Validate this is for Ollama
        if (request.provider !== Provider.OLLAMA) {
            throw new Error(`Invalid provider for OllamaProvider: ${request.provider}`);
        }
        if (request.type === 'generate') {
            const generatePayload = request.payload as OllamaGenerateQueueRequest;
            return await this.newGenerate(request.sourceId, request.requestId, generatePayload);
        } else if (request.type === 'chat') {
            const chatPayload = request.payload as OllamaChatQueueRequest;
            return await this._chatFromRequest(request.sourceId, request.requestId, chatPayload);
        } else {
            throw new Error(`Unsupported request type: ${request.type}`);
        }
    }

    /**
     * DKS new method
     * Chat completion using OllamaChatQueueRequest object
     */
    async _chatFromRequest(
        sourceId: string,
        requestId: string,
        chatRequest: OllamaChatQueueRequest
    ): Promise<void> {
        if (!this.models![chatRequest.model]) {
            throw new Error(`Model ${chatRequest.model} not found`);
        }
        if (!this.client) {
            await this.init();
        }

        let fullResponse = '';
        // Pass the request directly to the client since it extends ChatRequest
        // @ts-ignore
        const response = await this.client.chat(chatRequest);
        
        if (chatRequest.stream) {
            for await (const chunk of response) {
                //TODO simplify this logic
                if (chunk.done) {
                     const responseChunk: LLMWorkerResponse = {
                        sourceId: sourceId,
                        requestId: requestId,
                        provider: Provider.OLLAMA,
                        payload: chunk,
                        fullResponse: fullResponse
                    }
                    await this.onResponseChunk(responseChunk);
                    break;
                }

                const token = chunk.message?.content || '';
                fullResponse += token;

                if (token) {
                     const responseChunk: LLMWorkerResponse = {
                        sourceId: sourceId,
                        requestId: requestId,
                        provider: Provider.OLLAMA,
                        payload: chunk
                    }
                    await this.onResponseChunk(responseChunk);
                }
            }
        } else {
            fullResponse = response.message?.content || '';
            await this.onGenerateComplete(sourceId, requestId, response, 'done', this.generateOptionalData(fullResponse, response));
        }
    }

    async newGenerate(sourceId: string, requestId: string, generateRequest: OllamaGenerateQueueRequest){
        if (!this.models![generateRequest.model]) {
                    throw new Error(`Model ${generateRequest.model} not found`);
                }
                if (!this.client) {
                    await this.init();
                }

                let fullResponse = '';
                // @ts-ignore
                const response = await this.client.generate(generateRequest);
                if (generateRequest.stream) {
                    // Use Ollama streaming API
                    for await (const chunk of response) {
                        if (chunk.done) {
                             const responseChunk: LLMWorkerResponse = {
                                sourceId: sourceId,
                                requestId: requestId,
                                provider: Provider.OLLAMA,
                                payload: chunk,
                                fullResponse: fullResponse
                            }
                            await this.onResponseChunk(responseChunk);
                            break;
                        }

                        const token = chunk.response;
                        fullResponse += token;

                        if (token) {
                            const responseChunk: LLMWorkerResponse = {
                            sourceId: sourceId,
                            requestId: requestId,
                            provider: Provider.OLLAMA,
                            payload: chunk
                        }
                            await this.onResponseChunk(responseChunk);
                        }
                    }
                } else {
                    fullResponse = response.response;
                    await this.onGenerateComplete(sourceId, requestId, response, 'done', this.generateOptionalData(fullResponse, response));
                }

                logger.info(`Generated response with Ollama model ${generateRequest.model}, length: ${fullResponse.length}`);
            }
            

}
