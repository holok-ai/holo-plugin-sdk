import OpenAI from 'openai';
import {BaseProvider, ModelInfo, RequestType} from "@holokai/sdk";
import {ResponseCreateParamsBase} from "openai/resources/responses/responses";
import {OpenAIResponseStreamEvent} from "./types";
import {ChatCompletionCreateParamsBase} from "openai/resources/chat/completions";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends BaseProvider {
    protected client: OpenAI = new OpenAI();

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        this.client = new OpenAI(this._config);
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

    async handleRequest(request: any, type: RequestType): Promise<any> {

        switch (type) {
            case RequestType.RESPONSES:
                await this.openAIResponses(request);
                break;
            default:
                await this.openAICompletions(request);
                break;
        }

    }


    private async openAIResponses(request: ResponseCreateParamsBase) {
        let fullResponse = '';

        // @ts-ignore - OpenAI SDK types may need adjustment for responses API
        const response = await this.client.responses.create(responseRequest);
        const startTime = Date.now();
        let timeToFirst: number = 0;

        // Check if response is async iterable (streaming)
        if (request.stream) {
            try {
                // @ts-ignore
                for await (const event of response) {
                    const streamEvent = event as OpenAIResponseStreamEvent;

                    // Handle different event types
                    switch (streamEvent.type) {
                        case 'response.created':
                        case 'response.queued':
                        case 'response.in_progress':
                            this.data(event)
                            break;

                        case 'response.output_text.delta':
                            // Text content delta
                            if (timeToFirst === 0) timeToFirst = Date.now() - startTime;
                            fullResponse += streamEvent.delta;
                            this.data(event);
                            break;

                        case 'response.output_text.done':
                            this.audit(fullResponse);
                            break;

                        case 'response.completed':
                            this.done(event, fullResponse);
                            break;

                        case 'response.failed':
                        case 'response.incomplete':
                        case 'error':
                            // Error states
                            this.error(event);
                            break;
                        default:
                            this.data(event);
                            break;
                    }
                }
            } catch (error) {
                this.error(error);
            }
        } else {
            try {
                const message = response as OpenAI.Responses.Response;

                // Extract text from output items
                if (message.output && Array.isArray(message.output)) {
                    for (const item of message.output) {
                        if (item.type === 'message' && item.content) {
                            for (const content of item.content) {
                                if (content.type === 'output_text') {
                                    fullResponse += content.text;
                                }
                            }
                        }
                    }
                }

                this.data(message, fullResponse);
            } catch (error) {
                this.error(error);
            }
        }
    }

    private async openAICompletions(request: ChatCompletionCreateParamsBase) {
        let fullResponse = '';

        if (request.stream) {
            request.stream_options = {include_usage: true};
        }

        const response = await this.client.chat.completions.create(request);
        const startTime = Date.now();
        let timeToFirst: number = 0;

        if (request.stream) {
            try {
                // @ts-ignore
                for await (const chunk of response) {

                    if (chunk?.usage) {
                        chunk.usage.timeToFirstToken = timeToFirst;
                        chunk.usage.totalProcessingTime = Date.now() - startTime;
                        this.data(chunk, fullResponse);
                        break;
                    }

                    const choice = chunk.choices?.[0];
                    if (choice?.delta) {
                        if (choice.delta.content) {
                            if (timeToFirst == 0) timeToFirst = Date.now() - startTime;
                            const token = choice.delta.content;
                            fullResponse += token;
                        }

                        this.data(chunk);
                    }
                }
            } catch (error) {
                this.error(error);
            }
        } else {
            try {
                const message = response as any;
                if (message.choices && message.choices.length > 0) {
                    fullResponse = message.choices[0].message?.content || '';
                }

                this.data(response, fullResponse);
            } catch (error) {
                this.error(error);
            }
        }
    }

}
