import 'reflect-metadata';
import {QueueService} from "./queue.service";
import logger from "../utils/logger";
import {Transform, TransformCallback} from "node:stream";
import {inject, injectable} from "tsyringe";
import {CONTAINER_TOKENS} from "../config";
import {v4 as uuidv4} from "uuid";
import {ApiRequest} from "../api/types";
import {Response} from "express";

/**
 * Response stream for transforming LLM tokens into SSE
 */
class ResponseStream extends Transform {
    requestId: string;

    constructor(requestId: string) {
        super({objectMode: true});
        this.requestId = requestId;
    }

    _transform(chunk: any, _encoding: BufferEncoding, callback: TransformCallback) {
        callback(null, chunk);
    }
}

@injectable()
export class ResponseService {
    private streams: Map<string, ResponseStream> = new Map();

    constructor(
        @inject(CONTAINER_TOKENS.SERVER_ID) private readonly sourceId: string,
        @inject(CONTAINER_TOKENS.RESPONSE_QUEUE) private readonly responseQueue: string,
        @inject(CONTAINER_TOKENS.REQUEST_QUEUE) private readonly requestQueue: string,
        private queueService: QueueService) {
        this.responseQueue = responseQueue;
        this.queueService = queueService;
    }

    async init() {
        await this.queueService.consume(this.responseQueue, (_id, content) => {
            const {requestId} = content;
            const stream = this.streams.get(requestId);

            if (stream) {
                switch (content.type) {
                    case 'sse':
                        stream.push(`event: ${content.token.type}\n`)
                        stream.push("data: " + JSON.stringify(content.token) + '\n\n');
                        break;

                    case 'token':
                        // Send token to the stream
                        stream.push(JSON.stringify(content.token) + '\n');
                        break;

                    case 'done':
                        // Send final message and mark as completed
                        stream.push(JSON.stringify(content.response) + '\n');
                        //stream.push(`data: [DONE]\n\n`);
                        stream.end();
                        this.removeStream(requestId);
                        break;

                    case 'error':
                        // Send error and end stream
                        stream.push(`data: ${JSON.stringify(content)}\n\n`);
                        stream.push(`data: [DONE]\n\n`);
                        stream.end();
                        this.removeStream(requestId);
                        break;
                    default:
                        logger.warn(`Unknown message type: ${content.type}`);
                }
            } else {
                logger.warn(`Received response for unknown request: ${requestId}`);
            }

        }, true);
    }

    /**
     * Create a response stream for a request
     * @param {string} requestId - Request ID
     * @returns {Transform} - Response stream
     */
    async createResponseStream(requestId: string) {
        const responseStream = new ResponseStream(requestId);

        // Store the stream in the map
        this.streams.set(requestId, responseStream);

        // Set up auto-cleanup on stream end or error
        responseStream.on('end', () => this.removeStream(requestId));
        responseStream.on('error', () => this.removeStream(requestId));

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

    async generateResponse(req: ApiRequest, res: Response) {
        const requestId = uuidv4();
        const {model, prompt, options, stream, provider} = req.body;

        // Format the request for the worker
        const request = {
            id: requestId,
            type: 'generate',
            sourceId: this.sourceId, // Add server ID for response routing
            payload: {
                model,
                prompt,
                stream,
                provider, // Pass provider if specified
                options: options || {}
            },
            timestamp: Date.now()
        };

        logger.info(`New generate request: ${requestId} for model: ${model} streaming:${stream}`);
        // Set up server-sent events for streaming response
        this.setupResponse(req, res, request, requestId);
    }

    async chatCompletionResponse(req: ApiRequest, res: Response) {
        const requestId = uuidv4();
        const {model, messages, options, stream, provider} = req.body;

        // Format the request for the worker
        const request = {
            id: requestId,
            type: 'chat',
            sourceId: this.sourceId, // Add server ID for response routing
            payload: {
                model,
                messages,
                provider, // Pass provider if specified
                options: options || {},
                stream
            },
            timestamp: Date.now()
        };

        logger.info(`New chat request: ${requestId} for model: ${model} streaming:${stream}`);
        await this.setupResponse(req, res, request, requestId);
    }

    async setupResponse(req: ApiRequest, res: Response, request: Object, requestId: string) {
        // Set up a streaming or regular JSON response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Create a response stream
        let responseStream = await this.createResponseStream(requestId);

        // Handle client disconnect
        req.on('close', () => {
            logger.info(`Client disconnected from request: ${requestId}`);
            if (responseStream) responseStream.end();
        });

        // Send the request to the exchange instead of directly to the queue
        // This allows multiple consumers (main processor and audit logger) to receive the message
        await this.queueService.sendToExchange(
            this.requestQueue,
            '',
            request,
            {correlationId: requestId}
        )

        // Then start the streaming response AFTER the request has been queued
        // Pipe the response stream to the client
        responseStream.pipe(res);
    }
}
