import {AIProviderConfig, AIRequestStat, ModelInfo, ProviderRequest, RequestType} from "./types";
import {ResponseService} from "../services";
import {LLMWorkerRequest, LLMWorkerResponse} from "../types";
import {ErrorMessages} from "../utils";
import {Provider} from "../db/types";
import {ProviderRequestValidator} from "./validators";
import {ClassLogger} from "../types/class.logger";
import {env} from "../env";
import {WorkerResponseFactory} from "../types/worker.response.factory";

/**
 * Base interface for LLM providers
 * All LLM implementations must implement these methods
 */
export abstract class AIProvider extends ClassLogger {
    protected models: Record<string, ModelInfo> | null = null;

    //workerId is passed in via provider service
    protected constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super();
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


    async processRequest(request: LLMWorkerRequest): Promise<AIRequestStat> {
        const {sourceId, requestId, payload, type} = request;
        ProviderRequestValidator.assert(payload);

        return this.handleLLMRequest(sourceId, requestId, payload, type);
    }


    /**
     * Handle LLMWorkerRequest - unified interface for all providers
     */
    abstract handleLLMRequest(sourceId: string, requestId: string, payload: ProviderRequest, type: RequestType): Promise<AIRequestStat>;

    /**
     * Wraps provider method calls with statistics tracking, error handling, and logging.
     * Automatically measures execution time and tracks success/error counts.
     *
     * @param type - The type of request being processed (GENERATE or CHAT)
     * @param method - The provider method to execute (must be bound to provider instance)
     * @param args - Arguments to pass to the method, first two must be sourceId and requestId
     * @returns Promise resolving to AIRequestStat with timing and success/error metrics
     */
    protected async wrapWithStats<T extends [sourceId: string, requestId: string, ...any[]]>(
        type: RequestType,
        method: (...args: T) => Promise<void>,
        ...args: T
    ): Promise<AIRequestStat> {
        const logger = this.mlog(this.wrapWithStats);
        const startTime = Date.now();
        let success = 0;
        let error = 0;

        // Extract sourceId and requestId from the first two arguments
        const [sourceId, requestId] = args as [string, string, ...any[]];

        logger.debug(`${type.charAt(0).toUpperCase() + type.slice(1)} request: ${requestId}`);
        try {
            await method(...args);
            success++;
        } catch (e) {
            logger.error(`${type.charAt(0).toUpperCase() + type.slice(1)} error: ${(e as Error).message}`);
            await this.onError(sourceId, requestId, e as Error);
            error++;
        }
        const endTime = Date.now();
        return {
            type,
            startTime,
            endTime,
            duration: endTime - startTime,
            success,
            error
        };
    }


    /**
     * Handles errors by creating a standardized error response and sending it via the response stream.
     * Called automatically by wrapWithStats when a provider method throws an error.
     *
     * @param sourceId - Unique identifier for the request source
     * @param requestId - Unique identifier for the specific request
     * @param error - The error that occurred during processing
     */
    async onError(sourceId: string, requestId: string, error: Error) {
        const errorResponse: LLMWorkerResponse = {
            organizationId: this.provider.organization_id,
            sourceId: sourceId,
            requestId: requestId,
            providerType: this.provider.type as any, // Provider will be set by concrete implementation
            workerId: env.worker.serverId || 'unknown',
            payload: {
                type: 'error',
                error: {
                    message: error.message
                },
                requestId
            }
        };
        await this.onResponseChunk(errorResponse);
    }

    /**
     * Validates that a model exists in the provider's models cache.
     * Throws an error if the model is not found or if models haven't been loaded.
     *
     * @param model - The model name to validate
     * @throws Error when model is not found in the provider's model cache
     */
    protected validateModel(model: string): void {
        if (!this.models || !this.models[model]) {
            throw new Error(ErrorMessages.modelNotFound(model));
        }
    }

    /**
     * Ensures the provider is fully initialized by checking if models are loaded.
     * If models are not loaded, triggers the init() method to initialize the provider.
     *
     * @returns Promise that resolves when provider is confirmed to be initialized
     */
    protected async ensureInitialized(): Promise<void> {
        if (!this.models) {
            await this.init();
        }
    }

    /**
     * Creates a standardized LLMWorkerResponse object for sending data back to clients.
     * Handles both streaming chunks and complete responses with optional full response text.
     *
     * @param sourceId - Unique identifier for the request source
     * @param requestId - Unique identifier for the specific request
     * @param providerType - Provider enum value identifying which LLM provider generated the response
     * @param payload - The actual response data from the LLM provider
     * @param fullResponse - Optional complete response text for final chunks
     * @returns Standardized LLMWorkerResponse object ready for streaming
     */
    protected createWorkerResponse(
        sourceId: string,
        requestId: string,
        providerType: any, // Provider enum value
        payload: any,
        fullResponse?: string
    ): LLMWorkerResponse {
        return WorkerResponseFactory.create(
            sourceId,
            requestId,
            providerType,
            payload,
            this.provider.organization_id,
            fullResponse,
            env.worker.serverId || 'unknown'
        );
    }

    /**
     * Processes and sends response chunks to the response service for streaming to clients.
     * Handles the final step of the response pipeline by routing chunks to the response service.
     *
     * @param responseChunk - The standardized response chunk to send to clients
     * @param auditEnabled
     * @returns Promise that resolves when the chunk has been sent to the response service
     */
    async onResponseChunk(responseChunk: LLMWorkerResponse, auditEnabled?: boolean) {
        const logger = this.mlog(this.onResponseChunk);
        logger.info(`auditEnabled ${auditEnabled}`);
        // Default to false if not provided
        const auditEnabledValue = auditEnabled ?? false;

        logger.info(`onResponseChunk: ${JSON.stringify(responseChunk)} auditEnabled: ${auditEnabledValue}`);

        await this.responseService.sendResponseChunk(this.workerId, responseChunk.sourceId, responseChunk.requestId, responseChunk, auditEnabledValue);
    }

    get id(): string {
        return this.provider.name;
    }

    get name(): string {
        return this.provider.name;
    }

    get config(): AIProviderConfig {
        return this.provider.config as AIProviderConfig;
    }
}

export default AIProvider;
