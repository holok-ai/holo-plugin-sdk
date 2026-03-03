import 'reflect-metadata';
import {DatabaseConfig} from "../../types";
import logger from "../../utils/logger";
import {AppDB} from "../../db";
import {container, injectable} from "tsyringe";
import {IAppServer} from "../base.server";
import {env} from "../../env";
import {Constructor} from "../../utils/mixins";

/**
 * Mixin to add database functionality to a class
 */
export function withDB<TBase extends Constructor<IAppServer>>(Base: TBase) {
    @injectable()
    class WithDBServer extends Base implements IAppServer {
        db: AppDB;

        constructor(...args: any[]) {
            super(...args);

            this.db = container.resolve(AppDB);

            if (!this.db) {
                logger.debug('No Database found in container, initializing from config file.');
                // Extract dbConfig from the first argument (config object)
                if (env.appDb) {
                    throw new Error('Database configuration is required when using withDB mixin');
                }

                this.db = new AppDB(env.appDb as DatabaseConfig);
            }

            if (!this.db) {
                throw new Error('Database is required when using withDB mixin');
            }
        }

        async onError(error: Error): Promise<void> {
            await super.onError(error);
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

    return WithDBServer;
}
