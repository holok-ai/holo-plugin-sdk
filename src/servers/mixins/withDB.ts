import 'reflect-metadata';
import {Constructor, DatabaseConfig} from "../../types";
import logger from "../../utils/logger";
import {AppDB} from "../../db/app.db";
import {container, injectable} from "tsyringe";

/**
 * Mixin to add database functionality to a class
 */
export function withDB<TBase extends Constructor<{
    onError(): Promise<void>;
    onInit(): Promise<void>;
    onShutdown(): Promise<void>;
}>>(Base: TBase) {
    @injectable()
    class WithDBClass extends Base {
        db: AppDB;

        constructor(...args: any[]) {
            super(...args);

            this.db = container.resolve(AppDB);

            if(!this.db) {
                logger.debug('No Database found in container, initializing from config file.');
                // Extract dbConfig from the first argument (config object)
                const config = args[0];
                if (!config?.dbConfig) {
                    throw new Error('Database configuration is required when using withDB mixin');
                }

                this.db = new AppDB(config.dbConfig as DatabaseConfig);
            }

            if(!this.db) {
                throw new Error('Database is required when using withDB mixin');
            }
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
