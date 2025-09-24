import 'reflect-metadata';
import {QueueService} from "./queue.service";
import logger from "../utils/logger";
import {Transform, TransformCallback} from "node:stream";
import {container, injectable} from "tsyringe";
import {HttpApiRequest} from "../api/types";
import {Response} from "express";
import {env} from "../env";
import {LLMWorkerRequest, LLMWorkerResponse} from '../types';
import {StreamFormatter} from './stream.formatter.service';


/**
 * Response stream for transforming LLM tokens into SSE or JSON
 */
export class ResponseStream extends Transform {
    requestId: string;
    isStreaming: boolean;
    accumulatedChunks: any[] = [];

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
export class ResponseService {
    private serverId: string = env.api.apiServerId;
    private readonly streams: Map<string, ResponseStream>;
    private readonly responseQueue = env.queue.responseQueue;
    private readonly requestExchange = env.queue.requestExchange;

    constructor(
        private queueService: QueueService,
        private streamFormatter: StreamFormatter) {
        this.streams = new Map<string, ResponseStream>();
    }

    /**
     * Start consuming LLM response messages from the queue
     * Sets up a queue consumer that listens for LLM responses and routes them to active streams
     * @param {string} [serverId] - Optional server ID override, defaults to env.api.apiServerId
     */
    async startLLMResponseConsumer(serverId?: string) {
        this.serverId = serverId || this.serverId;

        const queueName = `${this.responseQueue}.${this.serverId}`;
        const handler = async (id: string, content: any) => {
            return this.handleLLMResponseMessage(id, content);
        };

        await this.queueService.consume(queueName, handler, true);
    }

    /**
     * Handle incoming response messages from the queue
     * Routes response chunks to the appropriate active response stream
     * @param {string} _id - Message ID (unused)
     * @param {any} content - Response content containing requestId, provider, and token data
     */
    async handleLLMResponseMessage(_id: string, content: any) {
        logger.debug(`Received response: ${JSON.stringify(content)}`);
        const {requestId} = content;
        const {provider} = content;
        logger.debug(`RequestId : ${requestId} provider: ${provider}`);
        const openResponseStream = this.streams.get(requestId);

        if (openResponseStream) {
            await this.streamFormatter.formatAndSend(content, openResponseStream);
        } else {
            logger.warn(`Received response for unknown request: ${requestId}`);
            logger.warn(this.streams);
        }
    }

    /**
     * Create a response stream for a request
     * @param {string} requestId - Request ID
     * @param {boolean} isStreaming - Whether the response should be streamed
     * @returns {Transform} - Response stream
     */
    async createResponseStream(requestId: string, isStreaming: boolean = true): Promise<Transform> {
        const responseStream = new ResponseStream(requestId, isStreaming);

        // Store the stream in the map
        this.streams.set(requestId, responseStream);
        // Set up auto-cleanup on stream end or error
        responseStream.on('end', () => {
            logger.debug(`Stream ended for request ${requestId}`);
            this.removeStream(requestId)
        });
        responseStream.on('error', () => {
            logger.error(`Stream error for request ${requestId}`);
            this.removeStream(requestId)
        });

        logger.info(`Created response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
        return responseStream;
    }

    /**
     * Remove a response stream
     * @param {string} requestId - Request ID
     */
    removeStream(requestId: string) {
        if (this.streams.has(requestId)) {
            this.streams.delete(requestId);
            logger.info(`Removed response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
        }
    }

    /**
     * Get the number of active streams
     * @returns {number} - Count of active streams
     */
    get activeStreamCount(): number {
        return this.streams.size;
    }

    async sendRequest(req: HttpApiRequest, res: Response, request: LLMWorkerRequest) {

        const {requestId, isStreaming} = request;
        // Set up appropriate response headers based on streaming mode
        if (isStreaming) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        } else {
            res.setHeader('Content-Type', 'application/json');
        }

        // Create a response stream
        let responseStream = await this.createResponseStream(requestId, isStreaming);


        // Handle client disconnect
        req.on('close', () => {
            logger.info(`Client disconnected from request: ${requestId}`);
            if (responseStream) responseStream.end();
        });

        // Send the request to the exchange instead of directly to the queue
        // This allows multiple consumers (main processor and audit logger) to receive the message
        await this.queueService.sendToExchange(
            this.requestExchange,
            '',
            request,
            {correlationId: requestId}
        )
        // Then start the streaming response AFTER the request has been queued
        // Pipe the response stream to the client
        responseStream.pipe(res);
    }

    async submitRequest<T = unknown>(request: LLMWorkerRequest, timeoutMs = 60000) {
        logger.debug(`Submitting request: ${JSON.stringify(request)}`);
        const {requestId, isStreaming} = request;

        const stream = await this.createResponseStream(requestId, isStreaming);

        await this.queueService.sendToExchange(
            this.requestExchange,
            '',
            request,
            {correlationId: requestId}
        );

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

    /**
     * Send response chunk to client via queue exchange
     * Routes response data to the appropriate server and optionally to audit logging
     * @param {string} workerId - ID of the worker sending the response
     * @param {string} sourceId - Server ID to route response to (used as routing key)
     * @param {string} requestId - Request correlation ID
     * @param {object} data - Response data/chunk to send
     * @param {boolean} auditEnabled - Whether to send copy to audit logging
     */
    async sendResponseChunk(workerId: string, sourceId: string, requestId: string, data: object, auditEnabled: boolean) {
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

    /**
     * Send data directly to audit exchange only
     * Used for logging audit data without routing to client servers
     * @param {string} workerId - ID of the worker sending the audit data
     * @param {string} requestId - Request correlation ID
     * @param {LLMWorkerResponse} data - Audit data to send
     */
    async sendToAuditOnly(workerId: string, requestId: string, data: LLMWorkerResponse) {
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
}

container.registerSingleton(ResponseService)
