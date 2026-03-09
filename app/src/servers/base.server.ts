import 'reflect-metadata';
import {ClassLogger} from "@holokai/sdk";
import {ServerType} from "@holokai/types/entities";

export interface IAppServer {
    onError(error: Error): Promise<void>;

    onInit(): Promise<void>;

    onShutdown(): Promise<void>;
}

export class BaseServer extends ClassLogger implements IAppServer {
    id!: string;
    type!: ServerType;
    protected initialized = false;

    constructor(...args: any[]) {
        super();
        this.id = args[0];
        this.type = args[1];
        // logger.debug(`Server (${this.id}) Config: ${JSON.stringify(env, null, 2)}`)
        this.__className = `${this.constructor.name}-${this.id}`;
    }

    async init() {
        const logger = this.mlog(this.init);
        await this.onInit();
        this.initialized = true;
        logger.info(`Server (${this.id}) started successfully.`);
    }

    async shutdown() {
        const logger = this.mlog(this.shutdown);
        await this.onShutdown();
        logger.info('Server shutdown gracefully.');
        process.exit(0);
    }

    async start() {
        const logger = this.mlog(this.start);
        try {
            await this.init();

            for (const signal of ['SIGINT', 'SIGTERM']) {
                process.on(signal, async () => {
                    logger.info(`${signal} received, shutting down server gracefully...`);
                    await this.shutdown();
                    process.exit(0);
                });
            }
            logger.info('Server is running...');

        } catch (error) {
            await this.handleError(error as Error);
        }
    }

    //required to resolve so that mixins can all call super.x
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
        const logger = this.mlog(this.handleError);
        logger.error(`Server error: ${(error as Error).message}`, {
            stack: (error as Error).stack
        });
        await this.onError(error);
    }
}
