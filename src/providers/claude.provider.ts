import AIProvider from "./ai.provider";
import {AIProviderConfig, IProvider, ModelInfo} from "./types";
import logger from "../utils/logger";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {Stream} from "@anthropic-ai/sdk/streaming";
import {MessageCreateParams, MessageCreateParamsStreaming, RawMessageStreamEvent} from "@anthropic-ai/sdk/resources";
import {WorkerService} from "../services/worker.service";

export class ClaudeProvider extends AIProvider implements IProvider {
    readonly name: string = 'claude';
    private readonly client: Anthropic;

    constructor(
        protected config: AIProviderConfig,
        protected workerService: WorkerService,
        protected workerId: string) {
        super(config, workerService, workerId);

        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
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
     * Generate text from a prompt with streaming
     */
    async generate(
        requestId: string,
        sourceId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void> {
        try {
            // Convert text generation to chat format for Claude API
            const messages = [
                {
                    role: 'user' as const,
                    content: prompt
                }
            ];

            await this.callClaude(
                requestId,
                sourceId,
                model,
                messages,
                options,
                stream,
                this.onGenerate.bind(this),
                this.onGenerateComplete.bind(this)
            );
        } catch (error) {
            logger.error(`Claude generate error: ${(error as Error).message}`);
            await this.onError(requestId, sourceId, error as Error);
        }
    }

    /**
     * Generate chat completion with streaming
     */
    async chat(
        requestId: string,
        sourceId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void> {
        try {
            await this.callClaude(
                requestId,
                sourceId,
                model,
                messages,
                options,
                stream,
                this.onChat.bind(this),
                this.onChatComplete.bind(this));
        } catch (error) {
            logger.error(`Claude chat error: ${(error as Error).message}`);
            await this.onError(requestId, sourceId, error as Error);
        }
    }

    async callClaude(requestId: string,
                     sourceId: string,
                     model: string,
                     messages: any[],
                     options: {},
                     stream: boolean,
                     onToken: (requestId: string, sourceId: string, token: object) => Promise<void>,
                     onComplete: (requestId: string, sourceId: string, token: object) => Promise<void>
    ): Promise<void> {
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }

        if (!this.client) {
            await this.init();
        }
        const requestOptions: MessageCreateParamsStreaming | MessageCreateParams = {
            model,
            messages,
            max_tokens: 4096,
            ...options,
            stream
        };

        const response = await this.client!.messages.create(requestOptions);
        // Handle streaming response
        if (stream) {
            logger.debug(`Claude streaming: ${JSON.stringify(response)}`);

            for await (const chunk of (response as unknown as Stream<RawMessageStreamEvent>)) {
                // Pass the raw chunk directly to the onToken callback
                await onToken(requestId, sourceId, chunk);
            }

            // Call onComplete
            await onComplete(requestId, sourceId, {
                type: 'message',
                model,
                status: 'complete'
            });
        } else {
            logger.debug(`Claude response: ${JSON.stringify(response)}`);
            // Call onComplete with the full response
            await onComplete(requestId, sourceId, response);
        }
    }
}
