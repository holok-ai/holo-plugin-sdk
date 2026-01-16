import {AIProvider} from "../ai.provider";
import {AIRequestStat, ModelInfo, ProviderRequest, ProviderType, RequestType} from "../types";
import {ErrorMessages} from "../../utils";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {ResponseService} from "../../services";
import {Message, MessageCreateParamsBase, MessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";
import {Provider} from "../../db/types";

export class ClaudeProvider extends AIProvider {
    protected readonly client: Anthropic;

    constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(provider, responseService, workerId);

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

        const logger = this.mlog(this.init);

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
        const logger = this.mlog(this.getModels);
        try {
            if (!this.client) {
                await this.init();
            }

            const response = await this.client!.models.list();
            logger.debug(`Claude models: ${JSON.stringify(response.data)}`);
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
    async handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat> {
        const logger = this.mlog(this.handleLLMRequest);
        logger.debug('Provider validation successful for Claude', {
            requestId,
            type
        });

        const claudePayload = payload as MessageCreateParamsBase;

        // Claude uses a unified messages API, so both generate and chat go through the same method
        return await this.wrapWithStats(type, this._claudeMessages.bind(this), sourceId, requestId, claudePayload);
    }

    /**
     * Claude messages completion using ClaudeWorkerRequest object
     */
    async _claudeMessages(
        sourceId: string,
        requestId: string,
        messageRequest: MessageCreateParamsBase
    ): Promise<void> {
        await this.ensureInitialized();
        this.validateModel(messageRequest.model);
        const logger = this.mlog(this._claudeMessages);
        let fullResponse = '';
        // Pass the request directly to the client since it extends MessageCreateParamsBase
        // @ts-ignore
        const startTime = Date.now();
        const metrics = {
            inputTokens: 0,
            outputTokens: 0,
            timeToFirstToken: 0,
            totalProcessingTime: 9
        };
        if (messageRequest.stream) {
            logger.debug('Starting Claude messages stream', {requestId, model: messageRequest.model});

            const stream = this.client.messages.stream(messageRequest);

            // Handle stream errors properly by sending native error response to client
            await new Promise<void>((resolve, _reject) => {
                stream
                    .on('streamEvent', (event: MessageStreamEvent, snapshot: Message) => {
                        logger.info(`Claude Event: ${JSON.stringify(event)}`);
                        if (event.type === 'message_start') {
                            metrics.timeToFirstToken = Date.now() - startTime;
                        }
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, event);
                        this.onResponseChunk(responseChunk);

                        // Log completion when stream ends
                        if (event.type === 'message_stop') {
                            logger.debug('Claude messages stream completed', {requestId, messageId: snapshot.id});
                        }
                    })
                    .on('text', (textDelta: string) => {
                        fullResponse += textDelta;
                    })
                    .on('error', async (error) => {
                        logger.error(`Claude messages stream error: ${JSON.stringify(error)}`, {
                            requestId,
                            error: error.message
                        });

                        const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, error);
                        await this.onResponseChunk(errorResponse, false);
                        resolve();
                    })
                    .on('finalMessage', (message: Message) => {
                        logger.info(`claude final message: ${JSON.stringify(message)}`);
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, message, fullResponse);
                        metrics.inputTokens = message.usage.input_tokens;
                        metrics.outputTokens = message.usage.output_tokens;
                        metrics.totalProcessingTime = Date.now() - startTime;
                        responseChunk.metrics = metrics;
                        this.responseService.sendToAuditOnly(this.workerId, responseChunk.sourceId, responseChunk);
                        resolve();
                    });
            });
        } else {
            // For non-streaming, extract the text content
            try {
                const response = await this.client.messages.create(messageRequest);
                const message = response as any;
                if (message.content && message.content.length > 0) {
                    fullResponse = message.content[0].text || '';
                }

                const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, response, fullResponse);
                await this.onResponseChunk(responseChunk, true);
            } catch (error) {
                logger.error('Claude messages create error', {
                    requestId,
                    error: (error as Error).message
                });

                const errorResponse = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, error);
                await this.onResponseChunk(errorResponse, false);
            }
        }
    }

}
