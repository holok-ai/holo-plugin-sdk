import 'reflect-metadata';
import '../container/base.registry';
import '../container/worker.registry';
import {container, inject, injectable} from "tsyringe";
import {withAdmin, withDB, withStats} from "./mixins";
import {BaseServer} from "./base.server";
import {env} from "../env";
import {PluginService, ProviderImplService, ResponseService} from "../services";
import {NotificationEventFactory, NotificationServiceToken} from "@holokai/sdk/notification";
import {AIRequestStat, HoloWorkerRequest, IProvider, ProviderErrorEvent} from "@holokai/types";
import type {INotificationService} from "@holokai/types/notification";
import {ServerType} from "@holokai/types/entities";
import {runRequestPipeline} from "@holokai/lib";
import {HoloWireAdapter} from "@holokai/sdk/provider";

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
            const ai: IProvider = await this.providerPluginService.getProviderImplById(workerRequest.provider.id);
            const plugin = ai.plugin;
            logger.info(`resolved ai provider: ${ai.name}`);

            const {sourceId, guardResult} = workerRequest;
            const envelope = await ai.auditor.createWorkerResponseEnvelope(workerRequest, this.id);

            try {
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
                        metrics: {
                            inputTokens: 0,
                            outputTokens: 0,
                            timeToFirstToken: 0,
                            totalProcessingTime: 0,
                            totalTokens: 0
                        },
                        text: errorMessage,
                        error: ai.responseFactory.createError(errorMessage)
                    } as ProviderErrorEvent;

                    for (const wireChunk of await wire.fromProviderEvent(evt)) {
                        logger.debug(`Guard failed response: ${JSON.stringify(wireChunk)}`);
                        await this.responseService.sendResponseChunk(sourceId, requestId, wireChunk);
                    }
                    await this.responseService.sendToAudit({...workerRequest, providerEvent: evt, workerId: this.id});
                    await this.notificationService.publish(
                        NotificationEventFactory.fromProviderEvent(envelope, evt),
                    );
                } else {
                    const wire = workerRequest.isHoloNative
                        ? new HoloWireAdapter(requestId, workerRequest.isStreaming)
                        : await plugin.createWireAdapter({
                            requestId,
                            isStreaming: workerRequest.isStreaming,
                            protocol: workerRequest.protocol.name
                        });

                    const q = await ai.processWorkerRequest(workerRequest);
                    await runRequestPipeline(q, wire, workerRequest, envelope, this.responseService, this.notificationService);
                }
            } catch (error) {
                logger.error(`Error handling request (${requestId}): ${(error as Error).message}`);
                logger.error(JSON.stringify(workerRequest, null, 2));
                try {
                    const errorMessage = (error as Error).message;
                    const errorEvent = {
                        type: 'error',
                        requestId,
                        seq: 0,
                        ts: Date.now(),
                        status: 500,
                        error: ai.responseFactory.createError(errorMessage),
                        text: errorMessage,
                        metrics: {
                            inputTokens: 0,
                            outputTokens: 0,
                            timeToFirstToken: 0,
                            totalProcessingTime: 0,
                            totalTokens: 0
                        },
                    } as ProviderErrorEvent;
                    await this.responseService.sendToAudit({...workerRequest, providerEvent: errorEvent, workerId: this.id});
                } catch (auditError) {
                    logger.error(`Failed to create error audit record: ${(auditError as Error).message}`);
                }
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

const server = container.resolve(WorkerServer);
await server.start();
