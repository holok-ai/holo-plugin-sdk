import 'reflect-metadata';
import '../container/base.registry';
import '../container/batch.registry';
import {container, injectable} from "tsyringe";
import {BaseServer} from "./base.server";
import {withDB, withQueue} from "./mixins";
import {env} from "../env";
import {PricingService} from "../services";
import {ServerType} from "@holokai/types/entities";

interface BatchJob {
    type: string;
    from?: string;
    to?: string;
    response_id?: string;
}

@injectable()
export class BatchServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private pricingService: PricingService
    ) {
        super(env.batch.serverId, ServerType.BATCH);
    }

    async onInit(): Promise<void> {
        await super.onInit();

        await this.queueService.assertQueue(env.queue.batchQueue, {durable: true});
        await this.queueService.bindQueue(env.queue.batchQueue, env.queue.directExchange, env.queue.batchRoutingKey);
        await this.queueService.consume(env.queue.batchQueue, async (_id, content: BatchJob) => {
            await this.handleBatchJob(content);
        });
    }

    private async handleBatchJob(job: BatchJob): Promise<void> {
        const logger = this.mlog(this.handleBatchJob);
        logger.info(`Processing batch job: ${job.type}`);

        switch (job.type) {
            case 'recalculate_costs':
                if (job.from && job.to) {
                    await this.pricingService.recalculateCostsForDateRange(
                        new Date(job.from),
                        new Date(job.to)
                    );
                } else if (job.response_id) {
                    await this.pricingService.recalculateCosts(job.response_id);
                }
                break;
            default:
                logger.warn(`Unknown batch job type: ${job.type}`);
        }
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const server = container.resolve(BatchServer);
await server.start();
