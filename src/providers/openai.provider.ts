import {AIProvider} from './ai.provider';
import logger from '../utils/logger';
import OpenAI from 'openai';
import {AIProviderConfig, ModelInfo} from './types';
import {
    ChatCompletionChunk,
    ChatCompletionCreateParams,
    ChatCompletionCreateParamsStreaming
} from "openai/resources/chat/completions/completions";
import {Stream} from "openai/streaming";
import {QueueService} from "../services";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends AIProvider {
    private readonly client: OpenAI;
    name: string = 'openai';

    constructor(
        protected config: AIProviderConfig,
        protected queueService: QueueService,
        protected workerId: string = 'unknown') {
        super(config, queueService, workerId);
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey
        });
    }

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        try {
            // Initialize the client
            await this.getModels();

            logger.info('OpenAI provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize OpenAI provider: ${(error as Error).message}`);
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
            // Convert text generation to chat format for OpenAI API
            const messages = [
                {
                    role: 'user' as const,
                    content: prompt
                }
            ];

            await this.callOpenAI(
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
            logger.error(`OpenAI generate error: ${(error as Error).message}`);
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
            await this.callOpenAI(
                requestId,
                sourceId,
                model,
                messages,
                options,
                stream,
                this.onChat.bind(this),
                this.onChatComplete.bind(this));
        } catch (error) {
            logger.error(`OpenAI chat error: ${(error as Error).message}`);
            await this.onError(requestId, sourceId, error as Error);
        }
    }

    async callOpenAI(
        requestId: string,
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
        const requestOptions: ChatCompletionCreateParamsStreaming | ChatCompletionCreateParams = {
            model,
            messages,
            ...options,
            stream
        };

        const response = await this.client.chat.completions.create(requestOptions);
        // Handle streaming response
        if (stream) {
            logger.debug(`OpenAI streaming: ${JSON.stringify(response)}`);

            for await (const chunk of (response as Stream<ChatCompletionChunk>)) {
                // Pass the raw chunk directly to the onToken callback
                await onToken(requestId, sourceId, chunk);
            }

            // Call onComplete
            await onComplete(requestId, sourceId, {
                type: 'chat.completion',
                model,
                status: 'complete'
            });
        } else {
            logger.debug(`OpenAI response: ${JSON.stringify(response)}`);
            // Call onComplete with the full response
            await onComplete(requestId, sourceId, response);
        }
    }
}
