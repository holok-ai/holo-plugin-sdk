import {ModelInfo, ModelStatus} from "./types";
import {QueueService} from "../services";

/**
 * Base interface for LLM providers
 * All LLM implementations must implement these methods
 */
export abstract class AIProvider {
    queueService: QueueService;
    abstract name: string;

    constructor(queueService: QueueService) {
        this.queueService = queueService;
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
     * @param model
     * @param prompt
     * @param options
     * @param stream
     */
    abstract generate(
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void>;

    /**
     * Generate chat completion with streaming
     * @param model
     * @param messages
     * @param options
     * @param stream
     */
    abstract chat(
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
    abstract getModelStatus(modelId: string): Promise<ModelStatus>;

    /**
     * Get detailed information about a model
     * @param modelId - Model identifier
     * @returns Model details
     */
    abstract getModelDetails(modelId: string): Promise<ModelInfo>;

    async sendResponseChunk(routingKey: string, correlationId: string, data: object) {
        await this.queueService.sendToExchange(
            'llm_response',
            routingKey,
            data,
            {correlationId}
        )
    }

    async onToken(routingKey: string, correlationId: string, data: object) {
        await this.sendResponseChunk(routingKey, correlationId, this.tokenizeData(correlationId, data))
    }

    async tokenizeData(requestId: string, data: object) {
        return {
            type: 'token',
            requestId,
            data
        };
    }
}

export default AIProvider;
