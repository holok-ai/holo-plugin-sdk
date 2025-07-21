import {DatabaseService} from "../../services";
import {Constructor} from "../../types";
import logger from "../../utils/logger";

export interface WithDBMixin {
    db: DatabaseService;
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
