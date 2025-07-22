import 'reflect-metadata';
import {QueueService} from "../../services";
import {Constructor} from "../../types";
import logger from "../../utils/logger";
import {container, injectable} from "tsyringe";

/**
 * Mixin to add queue functionality to a class
 */
export function withQueue<TBase extends Constructor<{
    onError(): Promise<void>;
    onInit(): Promise<void>;
    onShutdown(): Promise<void>;
}>>(Base: TBase) {
    @injectable()
    class WithQueueClass extends Base {
        queueService: QueueService;

        constructor(...args: any[]) {
            super(...args);

            this.queueService = container.resolve(QueueService);

            if (!this.queueService) {
                // Extract queueConfig from the first argument (config object)
                const config = args[0];
                if (!config?.queueConfig) {
                    throw new Error('Queue configuration is required when using withQueue mixin');
                }

                this.queueService = new QueueService(config.queueConfig);
            }

            if (!this.queueService) {
                throw new Error('Queue service is required when using withQueue mixin');
            }
        }


        async onError(): Promise<void> {
            logger.debug('Error occurred, disconnecting from queue...');
            await super.onError();
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

    return WithQueueClass;
}
