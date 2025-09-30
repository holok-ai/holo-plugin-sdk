import AIProvider from "../ai.provider";
import {Ollama} from "ollama";
import {
    AIRequestStat,
    IProvider,
    ModelInfo,
    OllamaProviderConfig,
    ProviderRequest,
    ProviderType,
    RequestType
} from "../types";
import {ErrorMessages} from "../../utils";
import {ResponseService} from "../../services";
import {Provider} from "../../db/types";
import {OllamaChatRequestValidator, OllamaGenerateRequestValidator} from "./validators";
import {OllamaChatRequest, OllamaGenerateRequest} from "./types";

export class OllamaProvider extends AIProvider implements IProvider {
    private readonly client: Ollama = new Ollama();

    constructor(protected provider: Provider,
                protected responseService: ResponseService,
                protected workerId: string) {
        super(provider, responseService, workerId);

        this.client = new Ollama(this.config as OllamaProviderConfig);
    }

    async init(): Promise<void> {
        try {
            await this.getModels();

            this.log.info('Ollama provider initialized');
        } catch (error) {
            this.log.error(`Failed to initialize Ollama provider: ${(error as Error).message}`);
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

            this.log.debug(`Ollama models: ${JSON.stringify(Object.keys(this.models))}`);
            return modelList;
        } catch (error) {
            this.log.error(`Error fetching Ollama models: ${(error as Error).stack}`);
            throw error;
        }
    }


    /**
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat> {
        if (type === RequestType.GENERATE) {
            const generatePayload = OllamaGenerateRequestValidator.assert(payload);
            return await this.wrapWithStats(RequestType.GENERATE, this._ollamaGenerate.bind(this), sourceId, requestId, generatePayload);
        } else if (type === RequestType.CHAT) {
            const chatPayload = OllamaChatRequestValidator.assert(payload);
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
        chatRequest: OllamaChatRequest
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(chatRequest.model);

        let fullResponse = '';
        // Pass the request directly to the client since it extends ChatRequest
        // @ts-ignore
        const response = await this.client.chat(chatRequest);

        if (chatRequest.stream) {
            this.log.debug('Starting Ollama chat stream', {requestId, model: chatRequest.model});

            try {
                for await (const chunk of response) {
                    // TODO: Simplify stream completion logic - consider extracting to a shared method
                    // The chunk.done pattern is repeated across generate and chat methods
                    if (chunk.done) {
                        this.log.debug('Ollama chat stream completed', {
                            requestId,
                            fullResponseLength: fullResponse.length
                        });
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk, true);
                        break;
                    }

                    const token = chunk.message?.content || '';
                    fullResponse += token;

                    if (token) {
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, chunk);
                        await this.onResponseChunk(responseChunk);
                    }
                }
            } catch (error) {
                this.log.error('Ollama chat stream error', {
                    requestId,
                    error: (error as Error).message,
                    partialResponseLength: fullResponse.length
                });
                throw error;
            }
        } else {
            fullResponse = response.message?.content || '';
            const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, response, fullResponse);
            await this.onResponseChunk(responseChunk, true);
        }
    }

    /**
     * Ollama generate completion using OllamaGenerateQueueRequest object
     */
    async _ollamaGenerate(sourceId: string, requestId: string, generateRequest: OllamaGenerateRequest): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(generateRequest.model);

        let fullResponse = '';

        // @ts-ignore
        const response = await this.client.generate(generateRequest);

        if (generateRequest.stream) {
            this.log.debug('Starting Ollama generate stream', {requestId, model: generateRequest.model});

            try {
                // Use Ollama streaming API
                for await (const chunk of response) {
                    if (chunk.done) {
                        this.log.debug('Ollama generate stream completed', {
                            requestId,
                            fullResponseLength: fullResponse.length
                        });
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, chunk, fullResponse);
                        await this.onResponseChunk(responseChunk, true);
                        break;
                    }

                    const token = chunk.response;
                    fullResponse += token;

                    if (token) {
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, chunk);
                        await this.onResponseChunk(responseChunk, false);
                    }
                }
            } catch (error) {
                this.log.error('Ollama generate stream error', {
                    requestId,
                    error: (error as Error).message,
                    partialResponseLength: fullResponse.length
                });
                throw error;
            }
        } else {
            fullResponse = response.response;
            const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.OLLAMA, response, fullResponse);
            await this.onResponseChunk(responseChunk, true);
        }

        this.log.info(`Generated response with Ollama model ${generateRequest.model}, length: ${fullResponse.length}`);
    }


}
