import 'reflect-metadata';
import {QueueService} from "../../services";
import {AppConfig, Constructor} from "../../types";
import logger from "../../utils/logger";
import {container, injectable} from "tsyringe";
import {IAppServer} from "../base.server";

/**
 * Mixin to add queue functionality to a class
 */
export function withQueue<TBase extends Constructor<IAppServer>>(Base: TBase) {
    @injectable()
    class WithQueueServer extends Base implements IAppServer {

        readonly queueService: QueueService;

        constructor(...args: any[]) {
            super(...args);

            let config: AppConfig = args[0];
            this.queueService = container.resolve(QueueService) || new QueueService(config.queueConfig);

            if (!this.queueService) {
                // Extract queueConfig from the first argument (config object)
                if (!config.queueConfig) {
                    throw new Error('Queue configuration is required when using withQueue mixin');
                }

                this.queueService = new QueueService(config.queueConfig);
            }

            if (!this.queueService) {
                throw new Error('Queue service is required when using withQueue mixin');
            }
        }


        async onError(error: Error): Promise<void> {
            logger.debug('Error occurred, disconnecting from queue...');
            await super.onError(error);
            await this.queueService.disconnect();
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
