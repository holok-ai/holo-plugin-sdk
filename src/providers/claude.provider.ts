import AIProvider from "./ai.provider";
import {AIProviderConfig, IProvider, ModelInfo} from "./types";
import {LLMWorkerRequest, ClaudeWorkerRequest, Provider, LLMWorkerResponse} from "../types";
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
            throw new Error('Claude API key is required');
        }

        this.client = new Anthropic({
            apiKey: this.config.apiKey
        });
    }

    async init(): Promise<void> {
        if (!this.config.apiKey) {
            throw new Error('Claude API key is required');
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
    async handleLLMRequest(request: LLMWorkerRequest): Promise<any> {
        // Validate this is for Claude
        if (request.provider !== Provider.CLAUDE) {
            throw new Error(`Invalid provider for ClaudeProvider: ${request.provider}`);
        }

        const { sourceId, requestId, payload, type } = request;
        const claudePayload = payload as ClaudeWorkerRequest;

        // Claude uses a unified messages API, so both generate and chat go through the same method
        return await this.wrapWithStats(type as 'generate' | 'chat', this._claudeMessages, sourceId, requestId, claudePayload);
    }

    /**
     * Claude messages completion using ClaudeWorkerRequest object
     */
    async _claudeMessages(
        sourceId: string,
        requestId: string,
        messageRequest: ClaudeWorkerRequest
    ): Promise<void> {
        if (!this.models![messageRequest.model]) {
            throw new Error(`Model ${messageRequest.model} not found`);
        }
        if (!this.client) {
            await this.init();
        }

        let fullResponse = '';
        // Pass the request directly to the client since it extends MessageCreateParamsBase
        // @ts-ignore
       
        
        if (messageRequest.stream) {
            this.client.messages
            .stream(messageRequest)
            .on('streamEvent', (event: MessageStreamEvent, snapshot: Message) => {
                logger.info(`Claude Event: ${JSON.stringify(event)}`);
                const responseChunk: LLMWorkerResponse = {
                    sourceId: sourceId,
                    requestId: requestId,
                    provider: Provider.CLAUDE,
                    payload: event,
                }
                snapshot.id;
                this.onResponseChunk(responseChunk);
            });
        } else {
            // For non-streaming, extract the text content
            const response = await this.client.messages.create(messageRequest);
            const message = response as any;
            if (message.content && message.content.length > 0) {
                fullResponse = message.content[0].text || '';
            }
            
            const responseChunk: LLMWorkerResponse = {
                sourceId: sourceId,
                requestId: requestId,
                provider: Provider.CLAUDE,
                payload: response,
                fullResponse: fullResponse
            }
            await this.onResponseChunk(responseChunk);
        }
    }

}
