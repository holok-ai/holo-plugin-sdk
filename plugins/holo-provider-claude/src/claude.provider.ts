import {Anthropic} from "@anthropic-ai/sdk/client";
import {Message, MessageCreateParamsBase, MessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";
import {IProvider, ModelInfo, ProviderConfig} from "@holokai/sdk";
import {BaseProvider} from "@holokai/sdk/provider";
import {PluginContext} from "@holokai/sdk/plugin";

export class ClaudeProvider extends BaseProvider implements IProvider {
    protected readonly client: Anthropic;

    constructor(
        context: PluginContext,
        config: ProviderConfig
    ) {
        super(context, config);
        if (!this._config.api_key) {
            throw new Error('API Key Required');
        }

        this.client = new Anthropic({
            apiKey: this._config.api_key
        });

        this.init().then(() => this.logger.info('Provider has been initialized'));
    }

    async init() {
        try {
            await this.getModels();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get available models
     */
    async getModels(): Promise<ModelInfo[]> {
        try {

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

            return modelList;
        } catch (error) {
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

            try {
                this.client.messages
                    .stream(messageRequest)
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
                    .on('error', (error) => {
                        logger.error('Claude messages stream error', {
                            requestId,
                            error: error.message
                        });
                        throw error;
                    })
                    .on('finalMessage', (message: Message) => {
                        logger.info(`claude final message: ${JSON.stringify(message)}`);
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, message, fullResponse);
                        metrics.inputTokens = message.usage.input_tokens;
                        metrics.outputTokens = message.usage.output_tokens;
                        metrics.totalProcessingTime = Date.now() - startTime;
                        responseChunk.metrics = metrics;
                        this.responseService.sendToAuditOnly(this.workerId, responseChunk.sourceId, responseChunk);
                    })
                ;
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

            const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, response, fullResponse);
            await this.onResponseChunk(responseChunk, true);
        }
    }

}
