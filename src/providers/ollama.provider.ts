import AIProvider from "./ai.provider";
import {ChatResponse, GenerateResponse, Ollama, Options} from "ollama";
import {ModelInfo, OllamaProviderConfig} from "./types";
import logger from "../utils/logger";
import {ResponseService} from "../services";


export class OllamaProvider extends AIProvider {
    readonly name = 'ollama';
    private readonly client: Ollama = new Ollama();

    constructor(protected config: OllamaProviderConfig,
                protected responseService: ResponseService,
                protected workerId: string) {
        super(config, responseService, workerId);

        this.client = new Ollama(this.config);
    }

    async init(): Promise<void> {
        try {
            await this.getModels();

            logger.info('Ollama provider initialized');
        } catch (error) {
            logger.error(`Failed to initialize Ollama provider: ${(error as Error).message}`);
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

            logger.debug('Getting ollama models...');
            const response = await this.client.list();
            logger.debug(`Ollama models: ${JSON.stringify(response.models)}`);
            const modelList = response.models.map(model => ({
                id: model.name,
                name: model.name,
                modified_at: model.modified_at,
                size: model.size || 0
            }));

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            logger.debug(`Ollama models: ${JSON.stringify(Object.keys(this.models))}`);
            return modelList;
        } catch (error) {
            logger.error(`Error fetching Ollama models: ${(error as Error).stack}`);
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
        options: any,
        stream: boolean
    ): Promise<void> {
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }
        if (!this.client) {
            await this.init();
        }

        const ollamaOptions = {
            model,
            prompt,
            options: {
                num_predict: options.max_tokens,
                ...options
            } as Partial<Options>,
            stream
        }
        let fullResponse = '';
        // @ts-ignore
        const response = await this.client.generate(ollamaOptions);
        if (stream) {


            // Use Ollama streaming API
            for await (const chunk of response) {
                if (chunk.done) {
                    await this.onGenerateComplete(sourceId, requestId, chunk, 'done', this.generateOptionalData(fullResponse, chunk));
                    break;
                }

                const token = chunk.response;
                fullResponse += token;

                if (token) {
                    await this.onGenerate(sourceId, requestId, chunk, 'token');
                }
            }
        } else {
            fullResponse = response.response;
            await this.onGenerateComplete(sourceId, requestId, response, 'done', this.generateOptionalData(fullResponse, response));
        }

        logger.info(`Generated response with Ollama model ${model}, length: ${fullResponse.length}`);
    }

    generateOptionalData(fullResponse: string, chunk: GenerateResponse | ChatResponse) {
        return {
            fullResponse,
            total_duration: chunk.total_duration,
            prompt_eval_count: chunk.prompt_eval_count,
            eval_count: chunk.eval_count,
            eval_duration: chunk.eval_duration
        }
    }

    /**
     * Generate chat completion with streaming
     */
    async _chat(
        sourceId: string,
        requestId: string,
        model: string,
        messages: any[],
        options: any,
        stream: boolean
    ): Promise<void> {
        if (!this.models![model]) {
            throw new Error(`Model ${model} not found`);
        }
        if (!this.client) {
            await this.init();
        }

        const ollamaOptions = {
            model,
            messages,
            options: {
                num_predict: options.max_tokens,
                ...options
            } as Partial<Options>,
            stream
        }

        let fullResponse = '';
        // @ts-ignore
        const response = await this.client.chat(ollamaOptions);
        if (stream) {
            // Use Ollama streaming API
            for await (const chunk of response) {
                if (chunk.done) {
                    await this.onChatComplete(sourceId, requestId, chunk, 'done', this.generateOptionalData(fullResponse, chunk));
                    break;
                }

                const token = chunk.message?.content || '';
                fullResponse += token;

                if (token) {
                    await this.onChat(sourceId, requestId, chunk, 'token', {
                        delta: {content: token},
                        model
                    });
                }
            }
        } else {
            fullResponse = response.message?.content || '';
            await this.onGenerateComplete(sourceId, requestId, response, 'done', this.generateOptionalData(fullResponse, response));
        }
    }
}
