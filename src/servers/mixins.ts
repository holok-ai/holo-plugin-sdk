import {DatabaseService, QueueService} from "../services";
import {Constructor} from "../types";
import logger from "../utils/logger";

export interface WithDBMixin {
    db: DatabaseService;
}

export interface WithQueueMixin {
    queueService: QueueService;
}

/**
 * Mixin to add database functionality to a class
 */
export function withDB<TBase extends Constructor<{
    onError(): Promise<void>;
    onInit(): Promise<void>;
    onShutdown(): Promise<void>;
}>>(Base: TBase) {
    abstract class WithDBClass extends Base implements WithDBMixin {
        public db: DatabaseService;

        constructor(...args: any[]) {
            super(...args);

            // Extract dbConfig from the first argument (config object)
            const config = args[0];
            if (!config?.dbConfig) {
                throw new Error('Database configuration is required when using withDB mixin');
            }

            this.db = new DatabaseService(config.dbConfig);
        }

        async onError(): Promise<void> {
            logger.debug('Error occurred, disconnecting from database...');
            await super.onError();
            await this.db.disconnect();
        }

        async onInit(): Promise<void> {
            logger.debug('Initializing database...');
            await super.onInit();
            // Connect to database first
            await this.db.connect();
        }

        async onShutdown(): Promise<void> {
            logger.debug('Shutting down database...');
            await super.onShutdown();
            // Then disconnect from database
            await this.db.disconnect();
        }
    }

    return WithDBClass;
}

/**
 * Mixin to add queue functionality to a class
 */
export function withQueue<TBase extends Constructor<{
    onError(): Promise<void>;
    onInit(): Promise<void>;
    onShutdown(): Promise<void>;
}>>(Base: TBase) {
    abstract class WithQueueClass extends Base implements WithQueueMixin {
        public queueService: QueueService;

        constructor(...args: any[]) {
            super(...args);

            // Extract queueConfig from the first argument (config object)
            const config = args[0];
            if (!config?.queueConfig) {
                throw new Error('Queue configuration is required when using withQueue mixin');
            }

            this.queueService = new QueueService(config.queueConfig);
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
