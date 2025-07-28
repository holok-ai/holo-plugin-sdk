import {AIProvider} from './ai.provider';
import logger from '../utils/logger';
import OpenAI from 'openai';
import {AIProviderConfig, CompleteHandler, IProvider, ModelInfo, TokenHandler} from './types';
import {LLMWorkerRequest} from '../types';
import {
    ChatCompletionChunk,
    ChatCompletionCreateParams,
    ChatCompletionCreateParamsStreaming
} from "openai/resources/chat/completions/completions";
import {Stream} from "openai/streaming";
import {ResponseService} from "../services";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends AIProvider implements IProvider {
    private readonly client: OpenAI;
    name: string = 'openai';

    constructor(
        protected config: AIProviderConfig,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(config, responseService, workerId);
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
    async _generate(
        sourceId: string,
        requestId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void> {
        // Convert text generation to chat format for OpenAI API
        const messages = [
            {
                role: 'user' as const,
                content: prompt
            }
        ];

        await this.callOpenAI(
            sourceId,
            requestId,
            model,
            messages,
            options,
            stream,
            this.onGenerate.bind(this),
            this.onGenerateComplete.bind(this)
        );
    }

    /**
     * Generate chat completion with streaming
     */
    async _chat(
        sourceId: string,
        requestId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void> {
        await this.callOpenAI(
            sourceId,
            requestId,
            model,
            messages,
            options,
            stream,
            this.onChat.bind(this),
            this.onChatComplete.bind(this));

    }

    async callOpenAI(
        sourceId: string,
        requestId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean,
        onToken: TokenHandler,
        onComplete: CompleteHandler
    ): Promise<void> {
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }

        if (!this.client) {
            await this.init();
        }

        logger.debug(`OpenAI request: ${JSON.stringify(messages)}`);
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
                await onToken(sourceId, requestId, chunk, 'sse');
            }

            // Call onComplete
            await onComplete(sourceId, requestId, {
                type: 'chat.completion',
                model,
                status: 'complete'
            });
        } else {
            logger.debug(`OpenAI response: ${JSON.stringify(response)}`);
            // Call onComplete with the full response
            await onComplete(sourceId, requestId, response);
        }
    }

    /**
     * Handle LLMWorkerRequest - unified interface
     * TODO: Implement OpenAI-specific request handling
     */
    async handleLLMRequest(_request: LLMWorkerRequest): Promise<any> {
        throw new Error('OpenAI handleLLMRequest not yet implemented');
    }
}
