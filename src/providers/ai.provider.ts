import {AIProviderConfig, AIRequestStat, ModelInfo} from "./types";
import {ResponseService} from "../services";
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
     * Generate text from a prompt with streaming
     * @param requestId
     * @param sourceId
     * @param model
     * @param prompt
     * @param options
     * @param stream
     */
    abstract _generate(
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
    abstract _chat(
        requestId: string,
        sourceId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<void>;

    /**
     * General stats/try-catch wrapper for chat/generate
     */
    protected async wrapWithStats(
        type: 'chat' | 'generate',
        action: () => Promise<void>,
        onError: (e: Error) => Promise<void>
    ): Promise<AIRequestStat> {
        const startTime = Date.now();
        let success = 0;
        let error = 0;
        try {
            await action();
            success++;
        } catch (e) {
            logger.error(`${type.charAt(0).toUpperCase() + type.slice(1)} error: ${(e as Error).message}`);
            await onError(e as Error);
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
        requestId: string,
        sourceId: string,
        model: string,
        prompt: string,
        options: {},
        stream: boolean
    ): Promise<AIRequestStat> {
        return this.wrapWithStats(
            'generate',
            async () => {
                await this._generate(requestId, sourceId, model, prompt, options, stream);
            },
            async (e) => {
                await this.onError(requestId, sourceId, e);
            }
        );
    }

    async chat(
        requestId: string,
        sourceId: string,
        model: string,
        messages: any[],
        options: {},
        stream: boolean
    ): Promise<AIRequestStat> {
        return this.wrapWithStats(
            'chat',
            async () => {
                await this._chat(requestId, sourceId, model, messages, options, stream);
            },
            async (e) => {
                await this.onError(requestId, sourceId, e);
            }
        );
    }


    async sendResponseChunk(routingKey: string, correlationId: string, data: object, auditEnabled: boolean = this.config.auditEnabled) {
        await this.responseService.sendResponseChunk(this.workerId, routingKey, correlationId, data, auditEnabled);
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
