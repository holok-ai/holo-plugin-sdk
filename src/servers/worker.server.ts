import 'reflect-metadata';
import {withAdmin, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService} from "../services";
import {container, injectable} from "tsyringe";
import {env} from "../env";
import {withStats} from "./mixins/withStats";
import {AIRequestStat} from "../providers/types";
import { LLMWorkerRequest, RequestType } from '../types';

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
            logger.info(`Worker ${this.id} handling generate request: ${requestId} provider: ${llmRequest.provider} from server ${llmRequest.sourceId} and queue ${requestQueue}...`);
            try {
                const ai = await this.providerService.matchProvider(llmRequest.provider);
                
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
