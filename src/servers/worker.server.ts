import 'reflect-metadata';
import {withAdmin, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService, ResponseService} from "../services";
import {container, injectable} from "tsyringe";
import {withStats} from "./mixins/withStats";
import {env} from "../env";
import {PluginService} from "../services/plugin/plugin.service";
import {PluginDiscoveryService} from "../services/plugin/discovery.service";
import {PluginLoaderService} from "../services/plugin/loader.service";
import {ProviderPluginRegistry} from "../services/plugin/provider-registry.service";
import {AIRequestStat, HoloWorkerRequest, IProvider, ProviderEvent} from "@holokai/sdk";
import {WireService} from "../services/wire.service";

@injectable()
export class WorkerServer extends withAdmin((withDB(withStats(BaseServer)))) {

    protected __className = `${this.constructor.name}-${env.worker.serverId}`;

    constructor(
        private providerService: ProviderService,
        private responseService: ResponseService,
        private wireService: WireService
    ) {
        super(env.worker.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);
        this.adminHandlers.set('worker.restart', this.adminService.restartWorker)
        let requestQueue = env.queue.requestQueue;

        const logger = this.mlog('workerConsume')
        await this.queueService.consume(requestQueue, async (requestId, workerRequest: HoloWorkerRequest) => {
            this.stats.totalRequests++;
            logger.info(`Worker ${this.id} handling request: ${requestId} provider: ${workerRequest.providerName} from server ${workerRequest.sourceId} and queue ${requestQueue}...`);
            try {
                const ai: IProvider = await this.providerService.matchProvider(workerRequest.providerName);
                logger.info(`resolved ai provider: ${ai.name}`);

                const {sourceId, guardResult} = workerRequest;

                // Setup the over-the-wire response for client-native streaming


                const envelope = await ai.auditor.createWorkerResponseEnvelope(workerRequest, this.id);

                if (guardResult && !guardResult.passed) {
                    logger.info('Guards failed. Sending back guard errors.');

                    const wire = await this.wireService.matchWireAdapter(ai.family, ai.version, {
                        requestId,
                        isStreaming: false,
                        requestType: workerRequest.type,
                    });

                    const errorMessage = guardResult.errors?.join('\n\n') || 'Policy violation';

                    const evt = {
                        type: 'error',
                        requestId,
                        seq: 1,
                        ts: Date.now(),
                        error: ai.responseFactory.createError(workerRequest.type, errorMessage)
                    } as ProviderEvent;

                    await this.responseService.sendWireChunk(sourceId, requestId, wire.start(400));
                    for (const wireChunk of wire.fromProviderEvent(evt)) {
                        logger.info(JSON.stringify(wireChunk));
                        await this.responseService.sendToAudit(requestId, await ai.auditResponse(envelope, evt));
                        await this.responseService.sendResponseChunk(sourceId, requestId, wireChunk);
                    }
                } else {
                    const wire = await this.wireService.matchWireAdapter(ai.family, ai.version, {
                        requestId,
                        isStreaming: workerRequest.isStreaming,
                        requestType: workerRequest.type,
                    });

                    await this.responseService.sendWireChunk(sourceId, requestId, wire.start());
                    const q = await ai.processWorkerRequest(workerRequest);

                    for await (const evt of q) {
                        if (evt.type == 'done') {
                            await this.responseService.sendToAudit(requestId,
                                await ai.auditResponse(envelope, evt)
                            );
                            if (workerRequest.isStreaming) break;
                        }
                        for (const wireChunk of wire.fromProviderEvent(evt)) {
                            await this.responseService.sendResponseChunk(sourceId, requestId, wireChunk);
                        }
                        if (evt.type === "error") {
                            await this.responseService.sendToAudit(requestId, await ai.auditResponse(envelope, evt))
                            break; // is this necessary?
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

container.registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginRegistry)
    .registerSingleton(ProviderService);

let workerInstance: WorkerServer | null = null;

async function startWorker() {
    try {
        const pluginService = container.resolve(PluginService);
        await pluginService.initializePluginSystem();
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

startWorker();

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
