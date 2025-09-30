import 'reflect-metadata';
import {QueueService} from "./queue.service";
import {Transform, TransformCallback} from "node:stream";
import {container, injectable} from "tsyringe";
import {HttpApiRequest} from "../api/types";
import {Response} from "express";
import {env} from "../env";
import {LLMWorkerRequest, LLMWorkerResponse} from '../types';
import {StreamService} from "./stream.service";
import {ClassLogger} from "../types/class.logger";


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

    async handleLLMResponseMessage(_id: string, content: any) {
        this.log.debug(`Received response: ${JSON.stringify(content)}`);
        const {requestId, provider} = content;
        this.log.debug(`RequestId : ${requestId} provider: ${provider}`);
        const openResponseStream = this.streamService.getStream(requestId);

        if (openResponseStream) {
            await this.formatAndSend(content, openResponseStream);
        } else {
            this.log.warn(`Received response for unknown request: ${requestId}`);
            this.log.warn(this.streamService.getActiveStreams());
        }
    }

    async formatAndSend(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        if (!res.isStreaming) {
            try {
                return this.streamService.endStream(responseChunk.payload, res);
            } catch (error) {
                this.log.error(`Non-streaming response error: ${(error as Error).message}`, {
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

    async sendRequest(req: HttpApiRequest, res: Response, request: LLMWorkerRequest) {

        const {requestId, isStreaming} = request;
        await this.setStreamingHeaders(res, isStreaming);

        // Create a response stream
        let responseStream = await this.streamService.createResponseStream(requestId, isStreaming);


        // Handle client disconnect
        req.on('close', () => {
            this.log.info(`Client disconnected from request: ${requestId}`);
            if (responseStream) responseStream.end();
        });

        // Send the request to the exchange instead of directly to the queue
        // This allows multiple consumers (main processor and audit logger) to receive the message
        await this.sendRequestToExchange(request, requestId);

        // Then start the streaming response AFTER the request has been queued
        // Pipe the response stream to the client
        responseStream.pipe(res);
    }

    async streamRequestOnce<T = unknown>(request: LLMWorkerRequest, timeoutMs = 60000) {
        this.log.debug(`Submitting request: ${JSON.stringify(request)}`, {methodName: 'streamRequestOnce' });
        const {requestId, isStreaming} = request;

        const stream = await this.streamService.createResponseStream(requestId, isStreaming);

        await this.sendRequestToExchange(request, requestId);

        return new Promise<T>((resolve, reject) => {
            stream.once('data', (data) => resolve(data as T));
            const to = setTimeout(() => {
                stream.removeListener('end', () => this.log.debug(`Removing end listener for responseStream ${requestId}`));
                stream.removeListener('error', () => this.log.debug(`Removing error listener for responseStream ${requestId}`));
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
        this.log.debug(`Sending response chunk: ${sourceId}, ${requestId}, ${JSON.stringify(data)}`);

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
        this.log.debug(`Sending audit-only data: ${requestId}, ${JSON.stringify(data)}`);
        data.workerId = workerId;
        data.timestamp = Date.now();
        await this.queueService.sendToExchange(
            env.queue.responseExchange,
            'audit', data,
            {correlationId: requestId}
        );

        this.log.debug(`Successfully sent audit-only data for request ${requestId}`);
    }
}

container.registerSingleton(ResponseService)
