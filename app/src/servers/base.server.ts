import 'reflect-metadata';
import {ClassLogger} from "@holokai/sdk";
import {ServerType} from "@holokai/types/entities";
import logger from "../utils/logger";

export interface IAppServer {
    onError(error: Error): Promise<void>;

    onInit(): Promise<void>;

    onShutdown(): Promise<void>;
}

export class BaseServer extends ClassLogger implements IAppServer {
    id!: string;
    type!: ServerType;
    protected initialized = false;
    private shuttingDown = false;

    constructor(...args: any[]) {
        super();
        this.id = args[0];
        this.type = args[1];
        this.__className = `${this.constructor.name}-${this.id}`;
    }

    async init() {
        const log = this.mlog(this.init);
        await this.onInit();
        this.initialized = true;
        log.info(`Server (${this.id}) started successfully.`);
    }

    async shutdown() {
        if (this.shuttingDown) return;
        this.shuttingDown = true;
        const log = this.mlog(this.shutdown);
        log.info(`Shutting down server (${this.id})...`);
        await this.onShutdown();
        log.info('Server shutdown gracefully.');
    }

    async start() {
        const log = this.mlog(this.start);

        this.registerProcessHandlers();

        try {
            await this.init();
            log.info('Server is running...');
        } catch (error) {
            await this.handleError(error as Error);
            process.exit(1);
        }
    }

    private registerProcessHandlers() {
        for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
            process.on(signal, async () => {
                logger.info(`${signal} received, shutting down ${this.id}...`);
                await this.shutdown();
                process.exit(0);
            });
        }

        process.on('uncaughtException', (err) => {
            logger.error(`Uncaught exception in ${this.id}: ${err.message}`, {stack: err.stack});
            process.exit(1);
        });

        process.on('unhandledRejection', (reason) => {
            logger.error(`Unhandled rejection in ${this.id}: ${reason}`);
            process.exit(1);
        });
    }

    onInit(): Promise<void> {
        return Promise.resolve();
    }

    onShutdown(): Promise<void> {
        return Promise.resolve();
    }

    onError(_error: Error): Promise<void> {
        return Promise.resolve();
    }

    private async handleError(error: Error) {
        const log = this.mlog(this.handleError);
        log.error(`Server error: ${error.message}`, {stack: error.stack});
        await this.onError(error);
    }
}
