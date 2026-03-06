import 'reflect-metadata';
import {QueueService} from "./queue.service";
import {container, injectable} from "tsyringe";
import {HoloApiRequest} from "../api/types";
import {Response} from "express";
import {env} from "../env";
import {AsyncEventQueue, ClassLogger} from "@holokai/sdk";
import type {WireChunk} from "@holokai/types/provider";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import {ProviderResponse} from "@holokai/types/entities";

@injectable()
export class ResponseService extends ClassLogger {
    private serverId: string = env.api.apiServerId;
    private readonly responseQueue = env.queue.responseQueue;
    private readonly requestExchange = env.queue.requestExchange;
    private readonly queues = new Map<string, AsyncEventQueue<WireChunk>>();

    constructor(
        private queueService: QueueService
    ) {
        super();
    }

    async startLLMResponseConsumer(serverId?: string) {
        this.serverId = serverId || this.serverId;
        const queueName = `${this.responseQueue}.${this.serverId}`;

        await this.queueService.consume(
            queueName,
            async (id: string, content: any) => this.processWireChunk(id, content),
            true
        );
    }

    async processWireChunk(_id: string, wire: WireChunk) {
        const logger = this.mlog(this.processWireChunk);

        const {requestId} = wire;
        const queue = this.queues.get(requestId);

        if (!queue) {
            logger.warn(`Received response for unknown request: ${requestId}`);
            return;
        }

        queue.push(wire);
        if (wire.done) {
            logger.debug(`Finished processing wire: ${wire.body}`);
            queue.end();
            this.queues.delete(requestId);
        }
    }

    async sendRequest(req: HoloApiRequest, res: Response, request: HoloWorkerRequest) {
        const logger = this.mlog(this.sendRequest);
        const {requestId} = request;

        const queue = new AsyncEventQueue<WireChunk>();
        this.queues.set(requestId, queue);

        req.on('close', () => {
            logger.info(`Client disconnected from request: ${requestId}`);
            queue.end();
            this.queues.delete(requestId);
        });

        await this.sendRequestToExchange(request, requestId);

        let headersSent = false;
        try {
            for await (const wire of queue) {
                if (wire.headers && !headersSent) {
                    if (wire.status) res.status(wire.status);
                    Object.entries(wire.headers).forEach(([k, v]) => res.setHeader(k, v));
                    headersSent = true;
                }

                if (wire.body) {
                    if (!res.write(wire.body)) {
                        await new Promise<void>(resolve => res.once('drain', resolve));
                    }

                }

                if (wire.done) {
                    res.end();
                }
            }
        } catch (error) {
            logger.error(`Error streaming response: ${(error as Error).message}`);
            if (!res.headersSent) {
                res.status(500).end();
            }
        } finally {
            this.queues.delete(requestId);
        }
    }

    async requestOnce<T = string>(request: HoloWorkerRequest, timeoutMs = 60000): Promise<T> {
        const {requestId} = request;

        const queue = new AsyncEventQueue<WireChunk>();
        this.queues.set(requestId, queue);

        await this.sendRequestToExchange(request, requestId);

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Response timed out after ${timeoutMs}ms (requestId=${requestId})`)), timeoutMs)
        );

        try {
            let acc = "";

            return await Promise.race([
                (async () => {
                    for await (const wire of queue) {
                        if (wire.body) acc += wire.body;
                        if (wire.done) break;
                    }
                    return acc as unknown as T;
                })(),
                timeout
            ]);
        } finally {
            this.queues.delete(requestId);
        }
    }

    async sendRequestToExchange(request: HoloWorkerRequest, correlationId: string, exchange: string = this.requestExchange) {
        await this.queueService.sendToExchange(exchange, "", request, {correlationId});
    }

    async sendResponseChunk(sourceId: string, requestId: string, data: object) {
        await this.queueService.sendToExchange(env.queue.responseExchange, sourceId, data, {correlationId: requestId});
    }

    async sendToAudit(requestId: string, data: ProviderResponse) {
        await this.queueService.sendToExchange(env.queue.responseExchange, "audit", data, {correlationId: requestId});
    }
}

container.registerSingleton(ResponseService)
