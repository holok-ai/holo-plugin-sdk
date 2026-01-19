import 'reflect-metadata';
import {QueueService} from "./queue.service";
import {Transform, TransformCallback} from "node:stream";
import {container, injectable} from "tsyringe";
import {HttpApiRequest} from "../api/types";
import {Response} from "express";
import {env} from "../env";
import {StreamService} from "./stream.service";
import {ClassLogger} from "../types/class.logger";
import {HoloTranslator} from "./providers/holo.translator";
import {HoloWorkerRequest, LlmResponse, WireChunk} from "@holokai/sdk";
import {WorkerResponseFactory} from "../types";


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

    constructor(private queueService: QueueService, private streamService: StreamService) {
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
        logger.info(JSON.stringify(wire));

        const {requestId} = wire;
        const stream = this.streamService.getStream(requestId);

        if (!stream) {
            logger.warn(`Received response for unknown request: ${requestId}`);
            return;
        }

        this.streamService.writeWire(requestId, wire);
    }

    async createStream(requestId: string, isStreaming: boolean): Promise<Transform> {
        return this.streamService.ensureStream(requestId, isStreaming);
    }

    async sendRequest(req: HttpApiRequest, res: Response, request: HoloWorkerRequest) {
        const logger = this.mlog(this.sendRequest);
        const {requestId, isStreaming} = request;

        const responseStream = await this.streamService.ensureStream(requestId, isStreaming);
        this.streamService.attachResponse(requestId, res);

        req.on('close', () => {
            logger.info(`Client disconnected from request: ${requestId}`);
            this.streamService.endWire(requestId);
        });

        responseStream.pipe(res);
        await this.sendRequestToExchange(request, requestId);
    }

    async requestOnce<T = string>(request: HoloWorkerRequest, timeoutMs = 60000): Promise<T> {
        // const logger = this.mlog(this.requestOnce);

        const {requestId} = request;
        const stream = (await this.streamService.ensureStream(requestId, false)) as ResponseStream;

        await this.sendRequestToExchange(request, requestId);

        return new Promise<T>((resolve, reject) => {
            let acc = "";

            const cleanup = () => {
                clearTimeout(to);
                stream.removeListener("data", onData);
                stream.removeListener("end", onEnd);
                stream.removeListener("error", onErr);
                this.streamService.removeStream(requestId);
            };

            const onData = (data: any) => {
                if (data == null) return;
                if (typeof data === "string") acc += data;
                else if (Buffer.isBuffer(data)) acc += data.toString("utf8");
                else acc += JSON.stringify(data);
            };

            const onEnd = () => {
                cleanup();
                resolve(acc as unknown as T);
            };

            const onErr = (err: any) => {
                cleanup();
                reject(err instanceof Error ? err : new Error(String(err)));
            };

            const to = setTimeout(() => {
                cleanup();
                reject(new Error(`Response timed out after ${timeoutMs}ms (requestId=${requestId})`));
            }, timeoutMs);

            stream.on("data", onData);
            stream.once("end", onEnd);
            stream.once("error", onErr);
        });
    }

    async sendRequestToExchange(request: HoloWorkerRequest, correlationId: string, exchange: string = this.requestExchange) {
        await this.queueService.sendToExchange(exchange, "", request, {correlationId});
    }

    async sendWireChunk(sourceId: string, requestId: string, chunk: WireChunk) {
        await this.queueService.sendToExchange(env.queue.responseExchange, sourceId, chunk, {correlationId: requestId});
    }

    async sendResponseChunk(sourceId: string, requestId: string, data: object) {
        await this.queueService.sendToExchange(env.queue.responseExchange, sourceId, data, {correlationId: requestId});
    }

    async sendToAudit(requestId: string, data: LlmResponse) {
        await this.queueService.sendToExchange(env.queue.responseExchange, "audit", data, {correlationId: requestId});
    }

    async sendError(
        request: HoloWorkerRequest,
        options: {
            errorType: "validation" | "guard" | "general";
            errors: string[] | Error;
            workerId: string;
            auditEnabled?: boolean;
        }
    ): Promise<void> {
        const logger = this.mlog(this.sendError);
        const holoTranslator = container.resolve(HoloTranslator);

        const errorMessages = Array.isArray(options.errors) ? options.errors : [options.errors.message];
        const auditEnabled = options.auditEnabled ?? (options.errorType !== "general");

        const workerResponse = await WorkerResponseFactory.createGuardError(
            request,
            errorMessages,
            options.workerId,
            holoTranslator
        );

        await this.sendResponseChunk(request.sourceId, request.requestId, workerResponse);

        logger.info(`${options.errorType} error response sent for request ${request.requestId}`, {
            errorType: options.errorType,
            errors: errorMessages,
            isStreaming: request.isStreaming,
            auditEnabled,
        });
    }
}

container.registerSingleton(ResponseService)
