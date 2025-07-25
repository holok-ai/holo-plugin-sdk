import AIProvider from "./ai.provider";
import {AIProviderConfig, CompleteHandler, IProvider, ModelInfo, TokenHandler} from "./types";
import logger from "../utils/logger";
import {Anthropic} from "@anthropic-ai/sdk/client";
import {Stream} from "@anthropic-ai/sdk/streaming";
import {MessageCreateParams, MessageCreateParamsStreaming, RawMessageStreamEvent} from "@anthropic-ai/sdk/resources";
import {ResponseService} from "../services";

export class ClaudeProvider extends AIProvider implements IProvider {
    readonly name: string = 'claude';
    private readonly client: Anthropic;

    constructor(
        protected config: AIProviderConfig,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(config, responseService, workerId);

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
    async _generate(
        sourceId: string,
        requestId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void> {
        // Convert text generation to chat format for Claude API
        const messages = [
            {
                role: 'user' as const,
                content: prompt
            }
        ];

        await this.callClaude(
            sourceId,
            requestId,
            model,
            messages,
            options,
            stream,
            'token',
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

        await this.callClaude(
            sourceId,
            requestId,
            model,
            messages,
            options,
            stream,
            'sse',
            this.onChat.bind(this),
            this.onChatComplete.bind(this));

    }

    async callClaude(sourceId: string,
                     requestId: string,
                     model: string,
                     messages: any[],
                     options: {},
                     stream: boolean,
                     tokenType: string,
                     onToken: TokenHandler,
                     onComplete: CompleteHandler
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
                await onToken(sourceId, requestId, chunk, tokenType);
            }

            // Call onComplete
            await onComplete(sourceId, requestId, {
                type: 'message',
                model,
                status: 'complete'
            });
        } else {
            logger.debug(`Claude response: ${JSON.stringify(response)}`);
            // Call onComplete with the full response
            await onComplete(sourceId, requestId, response);
        }
    }
}
