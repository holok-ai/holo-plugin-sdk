import {BaseProvider, IProvider, ModelInfo, RequestType} from "@holokai/sdk";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {Message, MessageCreateParamsBase, MessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";


export class ClaudeProvider extends BaseProvider implements IProvider {

    protected client: Anthropic = new Anthropic();

    async init() {
        this.client = new Anthropic(this._config);
    }

    async getModels(): Promise<ModelInfo[]> {
        try {
            const logger = this.mlog(this.getModels);
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


    async handleRequest(request: MessageCreateParamsBase, _type: RequestType): Promise<void> {
        const logger = this.mlog(this.handleRequest);
        let fullResponse = '';
        const startTime = Date.now();
        const metrics = {
            inputTokens: 0,
            outputTokens: 0,
            timeToFirstToken: 0,
            totalProcessingTime: 9
        };

        if (request.stream) {
            this.client.messages.stream(request)
                .on('streamEvent', (event: MessageStreamEvent, snapshot: Message) => {
                    logger.debug(`Claude Event: ${JSON.stringify(event)}`);
                    if (event.type === 'message_start') {
                        metrics.timeToFirstToken = Date.now() - startTime;
                    }
                    this.data(event);

                    // Log completion when stream ends
                    if (event.type === 'message_stop') {
                        logger.debug('Claude messages stream completed', {messageId: snapshot.id});
                    }
                })
                .on('text', (textDelta: string) => {
                    //accumulate
                    fullResponse += textDelta;
                })
                .on('error', (error) => {
                    logger.error(`Claude Event: ${JSON.stringify(error)}`);
                    this.error(error.message);
                })
                .on('finalMessage', (message: Message) => {
                    this.audit(fullResponse);
                    // this.audit()
                    // const responseChunk = this.createWorkerResponse(sourceId, requestId, ProviderType.CLAUDE, message, fullResponse);
                    metrics.inputTokens = message.usage.input_tokens;
                    metrics.outputTokens = message.usage.output_tokens;
                    metrics.totalProcessingTime = Date.now() - startTime;
                    // responseChunk.metrics = metrics;
                    // this.responseService.sendToAuditOnly(this.workerId, responseChunk.sourceId, responseChunk);
                });
        } else {
            const response = this.client.messages.create(request);

            //FULL RESPONSE?
            this.done(response);
        }
    }
}