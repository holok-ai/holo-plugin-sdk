import {AIProviderConfig, AIRequestStat, ModelInfo} from "./types";
import {ResponseService} from "../services";
import {LLMWorkerRequest, LLMWorkerResponse, RequestType} from "../types";
import logger from "../utils/logger";

/**
 * Base interface for LLM providers
 * All LLM implementations must implement these methods
 */
export abstract class AIProvider {
    abstract name: string;
    protected models: Record<string, ModelInfo> | null = null;

    //workerId is passed in via provider service
    constructor(
        protected config: AIProviderConfig,
        protected responseService: ResponseService,
        protected workerId: string) {
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
     * Handle LLMWorkerRequest - unified interface for all providers
     */
    abstract handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat>;

    /**
     * General stats/try-catch wrapper for chat/generate
     */
    protected async wrapWithStats<T extends [sourceId: string, requestId: string, ...any[]]>(
        type: RequestType,
        method: (...args: T) => Promise<void>,
        ...args: T
    ): Promise<AIRequestStat> {
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





    async onError(sourceId: string, requestId: string, error: Error) {
        const errorResponse: LLMWorkerResponse = {
            sourceId: sourceId,
            requestId: requestId,
            provider: this.name as any, // Provider will be set by concrete implementation
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

    async onResponseChunk(responseChunk: LLMWorkerResponse){
        logger.info(`new ResponseChunk method: ${JSON.stringify(responseChunk)}`);
        await this.responseService.sendResponseChunk(this.workerId, responseChunk.sourceId, responseChunk.requestId, responseChunk, true);
    }
}

export default AIProvider;
