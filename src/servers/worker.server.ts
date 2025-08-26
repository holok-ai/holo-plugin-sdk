// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import {withAdmin, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService} from "../services";
import {container, injectable} from "tsyringe";
import {env} from "../env";
import {withStats} from "./mixins/withStats";
import {AIRequestStat, IProvider} from "../providers/types";
import {LLMWorkerRequest, RequestType} from '../types';

dotenv.config();

@injectable()
export class WorkerServer extends withAdmin((withDB(withStats(BaseServer)))) {

    constructor(
        private providerService: ProviderService) {
        super(env.worker.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);
        this.adminHandlers.set('worker.restart', this.adminService.restartWorker)
        let requestQueue = env.queue.requestQueue;

        await this.queueService.consume(requestQueue, async (requestId, llmRequest: LLMWorkerRequest) => {
            this.stats.totalRequests++;
            logger.info(`Worker ${this.id} handling generate request: ${requestId} provider: ${llmRequest.providerType} from server ${llmRequest.sourceId} and queue ${requestQueue}...`);
            try {
                const ai: IProvider | undefined = await this.providerService.matchProvider(llmRequest.providerType);

                logger.info(`resolved ai provider: ${ai?.name}`);
                let requestStats: AIRequestStat | null = null;
                // explicitly define outcomes
                switch (llmRequest.type) {
                    case RequestType.GENERATE:
                        this.stats.generateRequests++;
                        requestStats = await ai!.handleLLMRequest(llmRequest);
                        break;
                    case RequestType.CHAT:
                        this.stats.chatRequests++;
                        requestStats = await ai!.handleLLMRequest(llmRequest);
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

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception in worker server: ${err.message}`);
    logger.error(err.stack);
});
