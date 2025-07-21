import {AIProviderConfig, ModelInfo} from "./types";
import {QueueService} from "../services";
import logger from "../utils/logger";

/**
 * Base interface for LLM providers
 * All LLM implementations must implement these methods
 */
export abstract class AIProvider {
    abstract name: string;
    queueService: QueueService;
    workerId: string;
    protected config: AIProviderConfig;
    protected models: Record<string, ModelInfo> | null = null;

    constructor(config: AIProviderConfig, queueService: QueueService, workerId: string = 'unknown') {
        this.config = config;
        this.queueService = queueService;
        this.workerId = workerId;
    }

    /**
     * Initialize the provider
     */
    abstract init(): Promise<void>;

    /**
     * Get available models from the provider
     * @returns Array of available models
     */
    abstract getModels(): Promise<ModelInfo[]>;

    /**
     * Generate text from a prompt with streaming
     * @param requestId
     * @param sourceId
     * @param model
     * @param prompt
     * @param options
     * @param stream
     */
    abstract generate(
        requestId: string,
        sourceId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void>;

    /**
     * Generate chat completion with streaming
     * @param requestId
     * @param sourceId
     * @param model
     * @param messages
     * @param options
     * @param stream
     */
    abstract chat(
        requestId: string,
        sourceId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void>;

    /**
     * Validate if model exists
     * @param model - Model name
     * @returns Whether model exists
     */
    async validateModel(model: string): Promise<boolean> {
        const models = await this.getModels();
        return models.some(m => m.id === model);
    }

    /**
     * Get status of a specific model
     * @param modelId - Model identifier
     * @returns Model status information
     */
    async getModelStatus(modelId: string): Promise<any> {
        const modelInfo = this.models![modelId];
        if (!modelInfo) {
            return {status: 'not_found'};
        }
        return {status: 'available', info: modelInfo};
    }

    /**
     * Get detailed information about a model
     * @param modelId - Model identifier
     * @returns Model details
     */
    async getModelDetails(modelId: string): Promise<ModelInfo> {
        const modelInfo = this.models![modelId];
        if (!modelInfo) {
            throw new Error(`Model ${modelId} not found`);
        }
        return modelInfo;
    }

    async sendResponseChunk(routingKey: string, correlationId: string, data: object, auditEnabled: boolean = this.config.auditEnabled) {
        logger.debug(`Sending response chunk: ${routingKey}, ${correlationId}, ${JSON.stringify(data)}`);

        await this.queueService.sendToExchange(
            'llm_responses',
            routingKey,
            data,
            {correlationId}
        );

        if (auditEnabled) {
            await this.queueService.sendToExchange(
                'llm_responses',
                'audit',
                {
                    timestamp: Date.now(),
                    workerId: this.workerId,
                    ...data
                },
                {correlationId}
            )
        }
    }

    //routingKey = sourceId, correlationId = requestId / id of message
    async onGenerate(routingKey: string, correlationId: string, token: object, type: string = 'token', customFields?: object) {
        await this.sendResponseChunk(
            routingKey,
            correlationId,
            this.formatToken(correlationId, token, type, customFields));
    }

    formatToken(requestId: string, token: object, type: string, customFields?: object) {
        return {
            type,
            provider: this.name,
            requestId,
            token,
            ...customFields
        };
    }

    async onGenerateComplete(routingKey: string, correlationId: string, token: object, type: string = 'done', customFields?: object) {
        await this.sendResponseChunk(
            routingKey,
            correlationId,
            this.formatToken(correlationId, token, type, customFields)
        );
    }

    async onChat(routingKey: string, correlationId: string, token: object, type: string = 'sse', customFields?: object) {
        await this.sendResponseChunk(
            routingKey,
            correlationId,
            this.formatToken(correlationId, token, type, customFields)
        );
    }

    async onChatComplete(routingKey: string, correlationId: string, token: object, type: string = 'done', customFields?: object) {
        await this.sendResponseChunk(
            routingKey,
            correlationId,
            this.formatToken(correlationId, token, type, customFields)
        );
    }

    async onError(routingKey: string, correlationId: string, error: Error) {
        await this.sendResponseChunk(routingKey, correlationId, {
            type: 'error',
            error: {
                message: error.message
            },
            requestId: routingKey
        });
    }
}

export default AIProvider;
