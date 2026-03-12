import 'reflect-metadata';
import {DatabaseConfig} from "../../types";
import logger from "../../utils/logger";
import {AppDB, ServerDB} from "../../db";
import {container, injectable} from "tsyringe";
import {IAppServer} from "../base.server";
import {env} from "../../env";
import {Constructor} from "../../utils";
import {ServerType} from "@holokai/types/entities";

const PING_INTERVAL_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 10 * 60_000;

export function withDB<TBase extends Constructor<IAppServer>>(Base: TBase) {
    @injectable()
    class WithDBServer extends Base implements IAppServer {
        db: AppDB;
        id!: string;
        type!: ServerType;
        serverDB: ServerDB;
        pingTimer?: ReturnType<typeof setInterval>;
        heartbeatTimer?: ReturnType<typeof setInterval>;
        serverId?: string;

        constructor(...args: any[]) {
            super(...args);

            this.db = container.resolve(AppDB);

            if (!this.db) {
                logger.debug('No Database found in container, initializing from config file.');
                if (env.appDb) {
                    throw new Error('Database configuration is required when using withDB mixin');
                }
                this.db = new AppDB(env.appDb as DatabaseConfig);
            }

            if (!this.db) {
                throw new Error('Database is required when using withDB mixin');
            }

            this.serverDB = container.resolve(ServerDB);
        }

        async onError(error: Error): Promise<void> {
            await super.onError(error);
        }

        async onInit(): Promise<void> {
            logger.debug('Initializing database...');
            await super.onInit();
            await this.db.connect();

            const server = await this.serverDB.upsert(this.id, this.type);
            if (!server) {
                throw new Error(`Unable to register server: ${this.id}`);
            }
            this.serverId = server.id;
            logger.info(`Registered server: ${this.id} (${this.type})`);

            await this.serverDB.recordHeartbeat(server.id);

            this.pingTimer = setInterval(async () => {
                try {
                    await this.serverDB.ping(this.serverId!);
                } catch (err) {
                    logger.error(`Server ping failed: ${(err as Error).message}`);
                }
            }, PING_INTERVAL_MS);

            this.heartbeatTimer = setInterval(async () => {
                try {
                    await this.serverDB.recordHeartbeat(this.serverId!);
                } catch (err) {
                    logger.error(`Heartbeat failed: ${(err as Error).message}`);
                }
            }, HEARTBEAT_INTERVAL_MS);
        }

        async onShutdown(): Promise<void> {
            logger.debug('Shutting down database...');
            if (this.pingTimer) clearInterval(this.pingTimer);
            if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
            await super.onShutdown();
            await this.db.disconnect();
        }
    }

    return WithDBServer;
}
