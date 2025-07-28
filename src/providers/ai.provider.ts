import {AIProviderConfig, AIRequestStat, ModelInfo} from "./types";
import {ResponseService} from "../services";
import {LLMWorkerRequest, LLMWorkerResponse} from "../types";
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

    abstract _generate(
        sourceId: string,
        requestId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<void>;

    abstract _chat(
        sourceId: string,
        requestId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void>;

    /**
     * Handle LLMWorkerRequest - unified interface for all providers
     */
    abstract handleLLMRequest(request: LLMWorkerRequest): Promise<AIRequestStat>;

    /**
     * General stats/try-catch wrapper for chat/generate
     */
    protected async wrapWithStats<T extends [sourceId: string, requestId: string, ...any[]]>(
        type: 'chat' | 'generate',
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


    async generate(
        sourceId: string,
        requestId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<AIRequestStat> {
        return this.wrapWithStats(
            'generate',
            this._generate.bind(this),
            sourceId,
            requestId,
            model,
            prompt,
            options,
            stream
        );
    }

    async chat(
        sourceId: string,
        requestId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<AIRequestStat> {
        return this.wrapWithStats(
            'chat',
            this._chat.bind(this),
            sourceId,
            requestId,
            model,
            messages,
            options,
            stream
        );
    }


    async sendResponseChunk(sourceId: string, requestId: string, data: object, auditEnabled: boolean = this.config.auditEnabled) {
        await this.responseService.sendResponseChunk(this.workerId, sourceId, requestId, data, auditEnabled);
    }

    async onGenerate(sourceId: string, requestId: string, token: object, type: string, customFields?: object) {
        await this.sendResponseChunk(
            sourceId,
            requestId,
            this.formatToken(requestId, token, type, customFields));
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

    async onGenerateComplete(sourceId: string, requestId: string, token: object, type: string = 'done', customFields?: object) {
        await this.sendResponseChunk(
            sourceId,
            requestId,
            this.formatToken(requestId, token, type, customFields)
        );
    }

    async onChat(sourceId: string, requestId: string, token: object, type: string, customFields?: object) {
        await this.sendResponseChunk(
            sourceId,
            requestId,
            this.formatToken(requestId, token, type, customFields)
        );
    }

    async onChatComplete(sourceId: string, requestId: string, token: object, type: string = 'done', customFields?: object) {
        await this.sendResponseChunk(
            sourceId,
            requestId,
            this.formatToken(requestId, token, type, customFields)
        );
    }

    async onError(sourceId: string, requestId: string, error: Error) {
        await this.sendResponseChunk(sourceId, requestId, {
            type: 'error',
            error: {
                message: error.message
            },
            requestId
        });
    }

    async onResponseChunk(responseChunk: LLMWorkerResponse){
        logger.info(`new ResponseChunk method: ${JSON.stringify(responseChunk)}`);
        await this.responseService.sendResponseChunk(this.workerId, responseChunk.sourceId, responseChunk.requestId, responseChunk, true);
    }
}

export default AIProvider;
