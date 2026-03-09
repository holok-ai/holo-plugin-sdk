import 'reflect-metadata';
import {container, inject, injectable} from "tsyringe";
import {withAdmin, withDB, withStats} from "./mixins";
import {BaseServer} from "./base.server";
import {env} from "../env";
import {
    CryptoService,
    NotificationService,
    PluginDiscoveryService,
    PluginLoaderService,
    PluginService,
    ProviderImplService,
    ProviderPluginService,
    ProviderService,
    ResponseService
} from "../services";
import {NotificationEventFactory, NotificationServiceToken, NotificationStoreToken} from "@holokai/sdk/notification";
import {AIRequestStat, HoloWorkerRequest, IProvider, ProviderEvent} from "@holokai/types";
import type {INotificationService} from "@holokai/types/notification";
import {PostgresNotificationStore} from "../db/notification.db";
import logger from "../utils/logger";
import {ServerType} from "@holokai/types/entities";

@injectable()
export class WorkerServer extends withAdmin((withDB(withStats(BaseServer)))) {

    protected __className = `${this.constructor.name}-${env.worker.serverId}`;

    constructor(
        private pluginService: PluginService,
        private providerPluginService: ProviderImplService,
        private responseService: ResponseService,
        @inject(NotificationServiceToken) private readonly notificationService: INotificationService
    ) {
        super(env.worker.serverId, ServerType.WORKER);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.pluginService.initializePluginSystem(this.id);
        this.adminHandlers.set('worker.restart', this.adminService.restartWorker)
        let requestQueue = env.queue.requestQueue;

        const logger = this.mlog('workerConsume')
        await this.queueService.consume(requestQueue, async (requestId, workerRequest: HoloWorkerRequest) => {
            this.stats.totalRequests++;
            logger.info(`Worker ${this.id} handling request: ${requestId} provider: ${workerRequest.provider.name} from server ${workerRequest.sourceId} and queue ${requestQueue}...`);
            try {
                const ai: IProvider = await this.providerPluginService.getProviderImplById(workerRequest.provider.id);
                const plugin = ai.plugin;
                logger.info(`resolved ai provider: ${ai.name}`);

                const {sourceId, guardResult} = workerRequest;

                // Setup the over-the-wire response for client-native streaming
                const envelope = await ai.auditor.createWorkerResponseEnvelope(workerRequest, this.id);

                if (guardResult && !guardResult.passed) {
                    logger.info('Guards failed. Sending back guard errors.');

                    const wire = await plugin.createWireAdapter({
                        requestId,
                        isStreaming: false,
                        protocol: ai.plugin.defaultProtocol
                    });

                    const errorMessage = guardResult.errors?.join('\n\n') || 'Policy violation';

                    const evt = {
                        type: 'error',
                        requestId,
                        seq: 0,
                        ts: Date.now(),
                        status: 400,
                        error: ai.responseFactory.createError(errorMessage,)
                    } as ProviderEvent;

                    for (const wireChunk of wire.fromProviderEvent(evt)) {
                        logger.debug(`Guard failed response: ${JSON.stringify(wireChunk)}`);
                        await this.responseService.sendResponseChunk(sourceId, requestId, wireChunk);
                    }
                    await this.responseService.sendToAudit(requestId, await ai.auditResponse(envelope, evt));
                    await this.notificationService.publish(
                        NotificationEventFactory.fromRequest(
                            'response_completed',
                            workerRequest,
                            'Response completed',
                            {status: 'error', eventType: evt.type},
                            "error"
                        )
                    );
                } else {
                    const wire = await plugin.createWireAdapter({
                        requestId,
                        isStreaming: workerRequest.isStreaming,
                        protocol: workerRequest.protocol.name
                    });

                    const q = await ai.processWorkerRequest(workerRequest);

                    for await (const evt of q) {
                        for (const wireChunk of wire.fromProviderEvent(evt)) {
                            await this.responseService.sendResponseChunk(sourceId, requestId, wireChunk);
                        }
                        if (evt.type === "done" || evt.type === "error") {
                            if (evt.type === "error") {
                                logger.error(`Error response: ${JSON.stringify(evt.error)}`, {requestId});
                            } else {
                                logger.debug(`Final response: ${JSON.stringify(evt.message)}`, {requestId});
                            }
                            await this.responseService.sendToAudit(requestId, await ai.auditResponse(envelope, evt));
                            if (evt.type === "done") {
                                await this.notificationService.publish(
                                    NotificationEventFactory.fromRequest(
                                        'response_completed',
                                        workerRequest,
                                        'Response completed',
                                        {status: 'success', eventType: evt.type}
                                    )
                                );
                            } else if (evt.type === "error") {
                                await this.notificationService.publish(
                                    NotificationEventFactory.fromRequest(
                                        'response_completed',
                                        workerRequest,
                                        'Response completed',
                                        {
                                            status: 'error',
                                            eventType: evt.type,
                                            error: evt.error
                                        },
                                        "error"
                                    )
                                );
                            }
                            break;
                        }
                    }
                }
            } catch (error) {
                logger.error(`Error handling request (${requestId}): ${(error as Error).message}`);
                logger.error(JSON.stringify(workerRequest, null, 2));
                await this.onError(error as Error);
            }
        });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
        this.stats.totalErrors++;
    }

    async mergeStats(requestStats: AIRequestStat) {
        this.stats.totalErrors += requestStats.error;
        this.stats.totalSuccesses += requestStats.success;
        this.stats.totalProcessingTime += requestStats.duration;
        switch (requestStats.type) {
            case "generate":
                this.stats.generateSuccesses += requestStats.success;
                this.stats.generateErrors += requestStats.error;
                this.stats.generateTime += requestStats.duration;
                break;
            case "chat":
                this.stats.chatSuccesses += requestStats.success;
                this.stats.chatErrors += requestStats.error;
                this.stats.chatTime += requestStats.duration;
                break;
            default:
                return;
        }
    }
}

container.registerSingleton(CryptoService)
    .registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginService)
    .registerSingleton(ProviderImplService)
    .registerSingleton(NotificationServiceToken, NotificationService)
    .registerSingleton(NotificationStoreToken, PostgresNotificationStore)
    .registerSingleton(ProviderService);

let workerInstance: WorkerServer | null = null;

async function startWorker() {
    try {
        workerInstance = container.resolve(WorkerServer);
        await workerInstance.start();
    } catch (error) {
        logger.error(`Failed to start worker: ${(error as Error).message}`, {
            className: 'startWorker',
            methodName: 'startWorker',
            stack: (error as Error).stack
        });
        process.exit(1);
    }
}

['SIGBREAK', 'SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down worker server...`, {className: 'process', methodName: signal});
        if (workerInstance) {
            workerInstance.shutdown();
        }
        process.exit(0);
    });
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception in worker server: ${err.message}`, {
        className: 'process',
        methodName: 'uncaughtException'
    });
    logger.error(err.stack);
});

await startWorker();