import AIProvider from "./ai.provider";
import {AIProviderConfig, IProvider, ModelInfo, AIRequestStat} from "./types";
import {LLMWorkerRequest, ClaudeWorkerRequest, Provider} from "../types";
import {ErrorMessages} from "../utils/error-messages";
import logger from "../utils/logger";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {ResponseService} from "../services";
import { Message, MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";

export class ClaudeProvider extends AIProvider implements IProvider {
    readonly name: string = 'claude';
    private readonly client: Anthropic;

    constructor(
        protected config: AIProviderConfig,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(config, responseService, workerId);

        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('Claude'));
        }

        this.client = new Anthropic({
            apiKey: this.config.apiKey
        });
    }

    async init(): Promise<void> {
        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('Claude'));
        }

        try {
            await this.getModels();

            logger.info('Claude provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize Claude provider: ${(error as Error).message}`);
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

            const response = await this.client!.models.list();
            const modelList = response.data.map(model => ({
                id: model.id,
                name: model.display_name,
                modified_at: model.created_at
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`Claude models: ${JSON.stringify(Object.keys(this.models))}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching Claude models: ${(error as Error).message}`);
            throw error;
        }
    }


    /**
     * Handle LLMWorkerRequest - unified interface
     */
    async handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat> {
        logger.debug('Claude provider handling LLM request', {
            requestId: request.requestId,
            sourceId: request.sourceId,
            type: request.type,
            provider: request.provider
        });

        // Validate this is for Claude
        if (request.provider !== Provider.CLAUDE) {
            logger.error('Provider validation failed for Claude', {
                expected: Provider.CLAUDE,
                received: request.provider,
                requestId: request.requestId
            });
            throw new Error(ErrorMessages.invalidProvider(request.provider, Provider.CLAUDE));
        }

        logger.debug('Provider validation successful for Claude', {
            requestId: request.requestId,
            type: request.type
        });

        const { sourceId, requestId, payload, type } = request;
        const claudePayload = payload as ClaudeWorkerRequest;

        // Claude uses a unified messages API, so both generate and chat go through the same method
        return await this.wrapWithStats(type, this._claudeMessages.bind(this), sourceId, requestId, claudePayload);
    }

    /**
     * Claude messages completion using ClaudeWorkerRequest object
     */
    async _claudeMessages(
        sourceId: string,
        requestId: string,
        messageRequest: ClaudeWorkerRequest
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(messageRequest.model);
        let fullResponse = '';
        // Pass the request directly to the client since it extends MessageCreateParamsBase
        // @ts-ignore
       
        
        if (messageRequest.stream) {
            logger.debug('Starting Claude messages stream', { requestId, model: messageRequest.model });
            
            try {
                this.client.messages
                .stream(messageRequest)
                .on('streamEvent', (event: MessageStreamEvent, snapshot: Message) => {
                    logger.info(`Claude Event: ${JSON.stringify(event)}`);
                    const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.CLAUDE, event);
                    snapshot.id;
                    this.onResponseChunk(responseChunk);
                    
                    // Log completion when stream ends
                    if (event.type === 'message_stop') {
                        logger.debug('Claude messages stream completed', { requestId, messageId: snapshot.id });
                    }
                })
                .on('error', (error) => {
                    logger.error('Claude messages stream error', { 
                        requestId, 
                        error: error.message 
                    });
                    throw error;
                });
            } catch (error) {
                logger.error('Claude messages stream initialization error', { 
                    requestId, 
                    error: (error as Error).message 
                });
                throw error;
            }
        } else {
            // For non-streaming, extract the text content
            const response = await this.client.messages.create(messageRequest);
            const message = response as any;
            if (message.content && message.content.length > 0) {
                fullResponse = message.content[0].text || '';
            }
            
            const responseChunk = this.createWorkerResponse(sourceId, requestId, Provider.CLAUDE, response, fullResponse);
            await this.onResponseChunk(responseChunk);
        }
    }

}
