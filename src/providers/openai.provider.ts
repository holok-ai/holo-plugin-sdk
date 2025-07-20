import {AIProvider} from './ai.provider';
import logger from '../utils/logger';
import OpenAI from 'openai';
import {ModelInfo} from './types';
import {
    ChatCompletionCreateParams,
    ChatCompletionCreateParamsStreaming
} from "openai/resources/chat/completions/completions";
import {QueueService} from "../services";

interface OpenAIConfig {
    apiKey: string;

    [key: string]: any;
}

interface OpenAIModel {
    id: string;
    name: string;
    modified_at?: string;
}

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends AIProvider {
    private config: OpenAIConfig;
    private client: OpenAI | null = null;
    private models: Record<string, OpenAIModel> | null = null;
    name: string = 'openai';

    constructor(config: OpenAIConfig, queueService: QueueService) {
        super(queueService);
        this.config = config;
    }

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        try {
            // Initialize the client
            this.client = new OpenAI({
                apiKey: this.config.apiKey
            });

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

            const response = await this.client!.models.list();
            const modelList = response.data.map(model => ({
                id: model.id,
                name: model.id,
                modified_at: new Date(model.created * 1000).toISOString()
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, OpenAIModel>);

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
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void> {


        // Check if model exists
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }
        try {
            // Convert text generation to chat format for OpenAI API
            const messages = [
                {
                    role: 'user' as const,
                    content: prompt
                }
            ];

            // Delegate to chat implementation
            await this.chat(
                model, messages, options, stream
            );
        } catch (error) {
            logger.error(`OpenAI generate error: ${(error as Error).message}`);
            this.onError(error as Error);
        }
    }

    /**
     * Generate chat completion with streaming
     */
    async chat(
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void> {

        // Check if model exists
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }

        try {
            if (!this.client) {
                await this.init();
            }
            // Prepare request parameters
            const requestParams = {
                model,
                messages,
                ...options
            };

            // Handle streaming response
            if (stream) {
                const completion = await this.client!.chat.completions.create({
                    ...requestParams,
                    stream: true
                } as ChatCompletionCreateParamsStreaming);

                for await (const chunk of completion) {
                    // Pass the raw chunk directly to the onToken callback
                    await this.onToken(chunk);
                }

                // Call onComplete
                await this.onComplete({
                    type: 'chat.completion',
                    model,
                    status: 'complete'
                });
            } else {
                // Handle non-streaming response
                const response = await this.client!.chat.completions.create({
                    ...requestParams,
                    stream: false
                } as ChatCompletionCreateParams);

                // Call onComplete with the full response
                await this.onComplete(response);
            }
        } catch (error) {
            logger.error(`OpenAI chat error: ${(error as Error).message}`);
            await this.onError(error as Error);
        }
    }

    async getModelStatus(modelId: string): Promise<any> {
        const modelInfo = this.models![modelId];
        if (!modelInfo) {
            return {status: 'not_found'};
        }
        return {status: 'available', info: modelInfo};
    }

    async getModelDetails(modelId: string): Promise<ModelInfo> {
        const modelInfo = this.models![modelId];
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found`);
        }
        return {
            id: modelInfo.id,
            name: modelInfo.name,
            modified_at: modelInfo.modified_at
        };
    }

    async tokenizeData(requestId: string, data: object) {
        return {
            provider: this.name,
            ...await super.tokenizeData(requestId, data)
        }
    }
}
