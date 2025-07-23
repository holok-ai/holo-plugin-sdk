import 'reflect-metadata';
import logger from '../utils/logger';
import {env} from '../env';

export interface IAppServer {
    onError(): Promise<void>;

    onInit(): Promise<void>;

    onShutdown(): Promise<void>;
}

export class BaseServer implements IAppServer {

    protected initialized = false;

    constructor(readonly id: string) {
        logger.debug(`Server (${this.id}) Config: ${JSON.stringify(env, null, 2)}`)
    }

    private async init() {
        await this.onInit();
        this.initialized = true;
        logger.info(`Server (${this.id}) started successfully.`);
    }

    private async shutdown() {
        await this.onShutdown();
        logger.info('Server shutdown gracefully.');
        process.exit(0);
    }

    private async handleError(error: any) {
        logger.error(`Server error: ${(error as Error).message}`);
        await this.onError();
        process.exit(1);
    }

    async start() {
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
            await this.handleError(error);
        }
    }

    //required to resolve so that mixins can all call super.x
    onInit(): Promise<void> {
        return Promise.resolve();
    }

    onShutdown(): Promise<void> {
        return Promise.resolve();
    }

    onError(): Promise<void> {
        return Promise.resolve();
    }
}
