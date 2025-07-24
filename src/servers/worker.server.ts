import 'reflect-metadata';
import {withAdmin, withDB} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService} from "../services";
import {container, injectable} from "tsyringe";
import {env} from "../env";
import {withStats} from "./mixins/withStats";
import {AIRequestStat} from "../providers/types";

@injectable()
export class WorkerServer extends withAdmin((withDB(withStats(BaseServer)))) {

    constructor(
        private providerService: ProviderService) {
        super(env.worker.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);


        // const ai = await this.providerService.matchProvider('openai');
        // ai?.generate('server-1', '1', 'gpt-4', 'Hello world!', {}, false);

        let requestQueue = env.queue.requestQueue;
        await this.queueService.consume(requestQueue, async (id, content) => {
            this.stats.totalRequests++;
            const {sourceId, payload, type} = content;
            logger.info(`Worker ${this.id} handling generate request: ${id} from server ${sourceId} and queue ${requestQueue}...`);
            try {
                // Extract parameters
                const {model, prompt, options, stream, provider} = payload;
                const ai = await this.providerService.matchProvider(provider);
                let requestStats: AIRequestStat | null = null;
                // explicitly define outcomes
                switch (type) {
                    case 'generate':
                        this.stats.generateRequests++;
                        requestStats = await ai!.generate(sourceId, id, model, prompt, options, stream);
                        break;
                    case 'chat':
                        this.stats.chatRequests++;
                        requestStats = await ai!.chat(sourceId, id, model, prompt, options, stream);
                        break;
                    default:
                        logger.warn(`No handler registered for message type ${type} - ignoring message...`);
                        break;
                }
                if (requestStats) await this.mergeStats(requestStats!);
            } catch (error) {
                logger.error(`Error handling request (${id}): ${(error as Error).message}`);
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
