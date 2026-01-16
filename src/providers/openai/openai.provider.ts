import {AIProvider} from '../ai.provider';
import OpenAI from 'openai';
import {AIRequestStat, ModelInfo, ProviderRequest, RequestType} from '../types';
import {ErrorMessages} from '../../utils';
import {ResponseService} from "../../services";
import {Provider} from "../../db/types";
import {OpenAIChatRequest, OpenAIResponseCreateParams} from "./types";
import {OpenAIChatCompletionsService, OpenAIResponsesService} from "./services";

/**
 * OpenAI provider for connecting to OpenAI API
 */
export class OpenAIProvider extends AIProvider {
    protected readonly client: OpenAI;
    private readonly chatCompletionsService: OpenAIChatCompletionsService;
    private readonly responsesService: OpenAIResponsesService;

    constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(provider, responseService, workerId);
        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('OpenAI'));
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            logger: this.log,
            logLevel: 'debug',
        });

        this.chatCompletionsService = new OpenAIChatCompletionsService(
            this.client,
            this.createWorkerResponse.bind(this),
            this.onResponseChunk.bind(this),
            this.validateModel.bind(this)
        );

        this.responsesService = new OpenAIResponsesService(
            this.client,
            this.createWorkerResponse.bind(this),
            this.onResponseChunk.bind(this),
            this.validateModel.bind(this)
        );
    }

    private isResponsesAPIRequest(payload: ProviderRequest): payload is OpenAIResponseCreateParams {
        return 'input' in payload && !('messages' in payload);
    }

    /**
     * Initialize the provider
     */
    async init(): Promise<void> {
        const logger = this.mlog(this.init);
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


    async handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat> {
        const logger = this.mlog(this.handleLLMRequest);

        if (this.isResponsesAPIRequest(payload)) {
            logger.debug('Routing to Responses API', {requestId});
            return await this.wrapWithStats(
                type,
                this.responsesService.execute.bind(this.responsesService),
                sourceId,
                requestId,
                payload
            );
        } else {
            logger.debug('Routing to Chat Completions API', {requestId});
            const chatPayload = payload as OpenAIChatRequest;
            return await this.wrapWithStats(
                type,
                this.chatCompletionsService.execute.bind(this.chatCompletionsService),
                sourceId,
                requestId,
                chatPayload
            );
        }
    }

}
