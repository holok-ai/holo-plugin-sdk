import 'reflect-metadata';
import {QueueService} from "./queue.service";
import {Transform, TransformCallback} from "node:stream";
import {container, injectable} from "tsyringe";
import {HttpApiRequest} from "../api/types";
import {Response} from "express";
import {env} from "../env";
import {LLMWorkerRequest, LLMWorkerResponse, WorkerResponseFactory} from '../types';
import {StreamService} from "./stream.service";
import {ClassLogger} from "../types/class.logger";
import {HoloTranslater} from "../providers/holo/holo.translator";
import {HoloResponseFactory} from "../providers/holo/holo.response.factory";
import {ProviderResponse, ProviderType} from "../providers/types";


export class ResponseStream extends Transform {
    requestId: string;
    isStreaming: boolean;

    constructor(requestId: string, isStreaming: boolean = true) {
        super({objectMode: true});
        this.requestId = requestId;
        this.isStreaming = isStreaming;
    }

    _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
        callback(null, chunk);
    }
}

@injectable()
export class ResponseService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    private readonly responseQueue = env.queue.responseQueue;
    private readonly requestExchange = env.queue.requestExchange;

    constructor(
        private queueService: QueueService,
        private streamService: StreamService) {
        super();

    }

    async startLLMResponseConsumer(serverId?: string) {
        this.serverId = serverId || this.serverId;

        const queueName = `${this.responseQueue}.${this.serverId}`;
        const handler = async (id: string, content: any) => {
            return this.handleLLMResponseMessage(id, content);
        };

        await this.queueService.consume(queueName, handler, true);
    }

    async handleLLMResponseMessage(_id: string, content: LLMWorkerResponse) {
        const logger = this.mlog(this.handleLLMResponseMessage);
        logger.debug(`Received response: ${JSON.stringify(content)}`);
        const {requestId, providerName} = content;
        logger.debug(`RequestId : ${requestId} provider: ${providerName}`);
        const openResponseStream = this.streamService.getStream(requestId);

        if (openResponseStream) {
            await this.formatAndSend(content, openResponseStream);
        } else {
            logger.warn(`Received response for unknown request: ${requestId}`);
            logger.warn(this.streamService.getActiveStreams());
        }
    }

    async formatAndSend(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        const logger = this.mlog(this.formatAndSend);

        const payload = responseChunk.payload as any;
        const isSdkError = payload && typeof payload === 'object' && 'status' in payload && 'error' in payload;

        if (isSdkError) {
            logger.info(`Received SDK error for request ${responseChunk.requestId}, converting to streaming format`);

            const errorPayload = payload.error;
            const modifiedChunk: LLMWorkerResponse = {
                ...responseChunk,
                payload: errorPayload
            };

            await this.streamService.streamData(modifiedChunk, res);
            return;
        }

        if (Array.isArray(responseChunk.payload)) {
            logger.debug(`Streaming array of ${responseChunk.payload.length} chunks for request ${responseChunk.requestId}`);
            for (const chunk of responseChunk.payload) {
                const chunkResponse: LLMWorkerResponse = {
                    ...responseChunk,
                    payload: chunk
                };
                await this.streamService.streamData(chunkResponse, res);
            }
            return;
        }

        if (!res.isStreaming) {
            try {
                return this.streamService.endStream(responseChunk.payload, res);
            } catch (error) {
                logger.error(`Non-streaming response error: ${(error as Error).message}`, {
                    requestId: responseChunk.requestId,
                    providerType: responseChunk.providerType
                });
                throw error;
            }
        }
        return this.streamService.streamData(responseChunk, res);
    }

    async setStreamingHeaders(res: Response, isStreaming: boolean) {
        if (isStreaming) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        } else {
            res.setHeader('Content-Type', 'application/json');
        }
    }

    async createStream(requestId: string, isStreaming: boolean): Promise<Transform> {
        return this.streamService.createResponseStream(requestId, isStreaming);
    }

    async sendRequest(req: HttpApiRequest, res: Response, request: LLMWorkerRequest) {
        const logger = this.mlog(this.sendRequest);

        const {requestId, isStreaming} = request;
        await this.setStreamingHeaders(res, isStreaming);

        let responseStream = this.streamService.getStream(requestId) || await this.streamService.createResponseStream(requestId, isStreaming);

        req.on('close', () => {
            logger.info(`Client disconnected from request: ${requestId}`);
            if (responseStream) responseStream.end();
        });

        await this.sendRequestToExchange(request, requestId);
        responseStream.pipe(res);
    }

    async streamRequestOnce<T = unknown>(request: LLMWorkerRequest, timeoutMs = 60000) {
        const logger = this.mlog(this.streamRequestOnce);

        logger.debug(`Submitting request: ${JSON.stringify(request)}`, {methodName: 'streamRequestOnce'});
        const {requestId, isStreaming} = request;

        const stream = await this.streamService.createResponseStream(requestId, isStreaming);

        await this.sendRequestToExchange(request, requestId);

        return new Promise<T>((resolve, reject) => {
            stream.once('data', (data) => resolve(data as T));
            const to = setTimeout(() => {
                stream.removeListener('end', () => logger.debug(`Removing end listener for responseStream ${requestId}`));
                stream.removeListener('error', () => logger.debug(`Removing error listener for responseStream ${requestId}`));
                reject(new Error(`Response timed out after ${timeoutMs}ms (requestId=${requestId})`));
            }, timeoutMs);

            stream.once('end', () => clearTimeout(to));
            stream.once('error', () => clearTimeout(to));
        })
    }

    async sendRequestToExchange(request: LLMWorkerRequest, correlationId: string, exchange: string = this.requestExchange) {
        await this.queueService.sendToExchange(
            exchange,
            '',
            request,
            {correlationId}
        )
    }

    async sendResponseChunk(workerId: string, sourceId: string, requestId: string, data: object, auditEnabled: boolean) {
        const logger = this.mlog(this.sendResponseChunk);
        logger.debug(`Sending response chunk: ${sourceId}, ${requestId}, ${JSON.stringify(data)}`);

        await this.queueService.sendToExchange(
            env.queue.responseExchange,
            sourceId,
            data,
            {correlationId: requestId}
        );

        if (auditEnabled) {
            await this.queueService.sendToExchange(
                env.queue.responseExchange,
                'audit',
                {
                    timestamp: Date.now(),
                    workerId,
                    ...data
                },
                {correlationId: requestId}
            )
        }
    }

    async sendToAuditOnly(workerId: string, requestId: string, data: LLMWorkerResponse) {
        const logger = this.mlog(this.sendToAuditOnly);
        logger.debug(`Sending audit-only data: ${requestId}, ${JSON.stringify(data)}`);
        data.workerId = workerId;
        data.timestamp = Date.now();
        await this.queueService.sendToExchange(
            env.queue.responseExchange,
            'audit', data,
            {correlationId: requestId}
        );

        logger.debug(`Successfully sent audit-only data for request ${requestId}`);
    }

    /**
     * Unified error response handler for all error types (validation, guard, general).
     * Automatically handles both streaming and non-streaming responses.
     *
     * @param request - The original LLM worker request
     * @param options - Configuration options
     * @param options.errorType - Type of error: 'validation' (permission/model access), 'guard' (PII/security), 'general' (other)
     * @param options.errors - Array of error messages or single Error object
     * @param options.workerId - ID of the worker processing the request
     * @param options.auditEnabled - Whether to audit this error (default: true for validation/guard, false for general)
     */
    async sendError(
        request: LLMWorkerRequest,
        options: {
            errorType: 'validation' | 'guard' | 'general';
            errors: string[] | Error;
            workerId: string;
            auditEnabled?: boolean;
        }
    ): Promise<void> {
        const logger = this.mlog(this.sendError);
        const holoTranslator = container.resolve(HoloTranslater);

        // Normalize errors to string array
        const errorMessages = Array.isArray(options.errors)
            ? options.errors
            : [options.errors.message];

        // Default audit behavior: enable for validation/guard, disable for general
        const auditEnabled = options.auditEnabled ?? (options.errorType !== 'general');

        try {
            // Create error response (handles both streaming and non-streaming)
            const workerResponse = await WorkerResponseFactory.createGuardError(
                request,
                errorMessages,
                options.workerId,
                holoTranslator
            );

            // Send error response back through response exchange
            await this.sendResponseChunk(
                options.workerId,
                request.sourceId,
                request.requestId,
                workerResponse,
                auditEnabled
            );

            logger.info(`${options.errorType} error response sent for request ${request.requestId}`, {
                errorType: options.errorType,
                errors: errorMessages,
                isStreaming: request.isStreaming,
                auditEnabled
            });
        } catch (error) {
            logger.error(`Failed to send ${options.errorType} error response: ${(error as Error).message}`, {
                requestId: request.requestId,
                errorType: options.errorType,
                error
            });
            throw error;
        }
    }

    /**
     * @deprecated Use sendError() instead with errorResponse option
     * Legacy method - kept for backward compatibility
     */
    async sendErrorResponse(organizationId: string, providerType: ProviderType, providerName: string, workerId: string, sourceId: string, requestId: string, error: Error) {
        const holoTranslator = container.resolve(HoloTranslater);

        // Create Holo error response
        const holoError = await HoloResponseFactory.createErrorResponse(
            `HE-${requestId}`,
            'error',
            `We were unable to complete the request due to the following reasons: ${error.message}`
        );

        // Translate to provider-native format
        const providerPayload = await holoTranslator.fromHoloResponse(holoError, providerType);

        // Create worker response
        const errorResponse = WorkerResponseFactory.create(
            sourceId,
            requestId,
            providerType,
            providerPayload as ProviderResponse,
            organizationId,
            JSON.stringify(providerPayload),
            env.worker.serverId || 'unknown',
            providerName
        );

        await this.sendResponseChunk(workerId, errorResponse.sourceId, errorResponse.requestId, errorResponse, false);
    }

    /**
     * @deprecated Use sendError() instead with errorType: 'validation'
     * Legacy method - kept for backward compatibility
     */
    async sendValidationErrorResponse(
        request: LLMWorkerRequest,
        errors: string[],
        workerId: string
    ): Promise<void> {
        return this.sendError(request, {
            errorType: 'validation',
            errors,
            workerId,
            auditEnabled: true
        });
    }
}

container.registerSingleton(ResponseService)
