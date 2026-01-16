// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import 'reflect-metadata';
import {withAdmin, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService, ResponseService} from "../services";
import {container, injectable} from "tsyringe";
import {withStats} from "./mixins/withStats";
import {AIRequestStat, RequestType} from "../providers/types";
import {LLMWorkerRequest} from '../types';
import {env} from "../env";
import {GuardService} from "../admin/services";
import {IProvider} from "../providers/ai.provider";

@injectable()
export class WorkerServer extends withAdmin((withDB(withStats(BaseServer)))) {

    protected __className = `${this.constructor.name}-${env.worker.serverId}`;

    constructor(
        private providerService: ProviderService,
        private guardService: GuardService,
        private responseService: ResponseService
    ) {
        super(env.worker.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);
        this.adminHandlers.set('worker.restart', this.adminService.restartWorker)
        let requestQueue = env.queue.requestQueue;

        const logger = this.mlog('workerConsume')
        await this.queueService.consume(requestQueue, async (requestId, llmRequest: LLMWorkerRequest) => {
            this.stats.totalRequests++;
            logger.info(`Worker ${this.id} handling request: ${requestId} provider: ${llmRequest.providerType} from server ${llmRequest.sourceId} and queue ${requestQueue}...`);

            try {
                // Check for upstream errors (validation/permission issues)
                if (llmRequest.errors?.length) {
                    logger.warn(`Request ${requestId} has upstream validation errors, sending error response`, {
                        errors: llmRequest.errors
                    });

                    await this.responseService.sendError(llmRequest, {
                        errorType: 'validation',
                        errors: llmRequest.errors,
                        workerId: this.id,
                        auditEnabled: true
                    });

                    logger.info(`Validation error response sent for request ${requestId}`);
                    return;
                }

                // Check guard results (PII/security checks)
                const shouldProceed = await this.guardService.processGuardResult(llmRequest, this.id);

                if (!shouldProceed) {
                    logger.info(`Guard check blocked request ${requestId}, error response sent`);
                    return; // Exit early - do not call provider
                }

                // Guards passed - proceed with normal provider processing
                logger.info(`Guards passed for request ${requestId}, proceeding to provider`);
                const ai: IProvider | undefined = await this.providerService.matchProvider(llmRequest.providerType);

                logger.info(`resolved ai provider: ${ai?.name}`);
                let requestStats: AIRequestStat | null = null;

                // explicitly define outcomes
                switch (llmRequest.type) {
                    case RequestType.GENERATE:
                        this.stats.generateRequests++;
                        requestStats = await ai!.processRequest(llmRequest);
                        break;
                    case RequestType.CHAT:
                        this.stats.chatRequests++;
                        requestStats = await ai!.processRequest(llmRequest);
                        break;
                    case RequestType.RESPONSES:
                        this.stats.chatRequests++;
                        requestStats = await ai!.processRequest(llmRequest);
                        break;
                    default:
                        logger.warn(`No handler registered for message type ${llmRequest.type} - ignoring message...`);
                        break;
                }

                if (requestStats) await this.mergeStats(requestStats!);
            } catch (error) {
                logger.error(`Error handling request (${requestId}): ${(error as Error).message}`);
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

const worker = container.resolve(WorkerServer);
worker.start();

['SIGBREAK', 'SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down worker server...`, {className: 'process', methodName: signal});
        worker.shutdown();
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
