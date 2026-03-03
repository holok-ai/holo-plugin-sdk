import 'reflect-metadata';
import {QueueService} from "../../services";
import logger from "../../utils/logger";
import {container, injectable} from "tsyringe";
import {IAppServer} from "../base.server";
import {Constructor} from "../../utils/mixins";

/**
 * Mixin to add queue functionality to a class
 */
export function withQueue<TBase extends Constructor<IAppServer>>(Base: TBase) {
    @injectable()
    class WithQueueServer extends Base implements IAppServer {

        readonly queueService: QueueService;

        constructor(...args: any[]) {
            super(...args);
            this.queueService = container.resolve(QueueService);
            if (!this.queueService) {
                throw new Error('Queue service is required when using withQueue mixin');
            }
        }


        async onError(error: Error): Promise<void> {
            await super.onError(error);
        }

        async onInit(): Promise<void> {
            logger.debug('Initializing queue...');
            await super.onInit();
            await this.queueService.connect();
        }

        async onShutdown(): Promise<void> {
            logger.debug('Shutting down queue...');
            await super.onShutdown();
            await this.queueService.disconnect();
        }
    }

    return WithQueueServer;
}
