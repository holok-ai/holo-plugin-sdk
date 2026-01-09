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
import {HoloWorkerRequest, HoloWorkerResponse, WireChunk, WireEnvelope} from "@holokai/sdk";
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
            async (id: string, content: any) => this.handleLLMResponseMessage(id, content),
            true
        );
    }

    private requireWire(payload: any): WireChunk {
        if (!payload || typeof payload !== "object") throw new Error("Missing payload object");

        // Your current producer shape: { type: "wire", wire: { ... } }
        if ("type" in payload && (payload.type === "wire" || payload.type === "wire_start") && "wire" in payload) {
            const env = payload as WireEnvelope;
            if (!env.wire || typeof env.wire !== "object") throw new Error("Missing payload.wire");
            return env.wire;
        }

        // If you later standardize to payload = { wire: ... } you can add it here
        throw new Error(`Non-wire payload received (expected {type:'wire', wire:{...}}). Got: ${JSON.stringify(payload)}`);
    }

    async handleLLMResponseMessage(_id: string, content: HoloWorkerResponse) {
        const logger = this.mlog(this.handleLLMResponseMessage);
        logger.info(JSON.stringify(content));

        const {requestId} = content;
        const stream = this.streamService.getStream(requestId);

        if (!stream) {
            logger.warn(`Received response for unknown request: ${requestId}`);
            return;
        }

        const wire = this.requireWire(content.payload);
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

    async sendResponseChunk(workerId: string, sourceId: string, requestId: string, data: object, auditEnabled: boolean) {
        const logger = this.mlog(this.sendResponseChunk);
        logger.debug(`Sending response chunk: ${sourceId}, ${requestId}, ${JSON.stringify(data)}`);

        await this.queueService.sendToExchange(env.queue.responseExchange, sourceId, data, {correlationId: requestId});

        if (auditEnabled) {
            await this.queueService.sendToExchange(
                env.queue.responseExchange,
                "audit",
                {timestamp: Date.now(), workerId, ...data},
                {correlationId: requestId}
            );
        }
    }

    async sendToAuditOnly(workerId: string, requestId: string, data: HoloWorkerResponse) {
        const logger = this.mlog(this.sendToAuditOnly);
        logger.debug(`Sending audit-only data: ${requestId}, ${JSON.stringify(data)}`);

        (data as any).workerId = workerId;
        (data as any).timestamp = Date.now();

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

        await this.sendResponseChunk(options.workerId, request.sourceId, request.requestId, workerResponse, auditEnabled);

        logger.info(`${options.errorType} error response sent for request ${request.requestId}`, {
            errorType: options.errorType,
            errors: errorMessages,
            isStreaming: request.isStreaming,
            auditEnabled,
        });
    }
}

container.registerSingleton(ResponseService)
