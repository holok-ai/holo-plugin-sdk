import 'reflect-metadata';
import logger from '../utils/logger';

export interface IAppServer {
    onError(error: Error): Promise<void>;

    onInit(): Promise<void>;

    onShutdown(): Promise<void>;
}

export class BaseServer implements IAppServer {

    protected initialized = false;

    constructor(readonly id: string) {
        // logger.debug(`Server (${this.id}) Config: ${JSON.stringify(env, null, 2)}`)
    }

    async init() {
        await this.onInit();
        this.initialized = true;
        logger.info(`Server (${this.id}) started successfully.`);
    }

    async shutdown() {
        await this.onShutdown();
        logger.info('Server shutdown gracefully.');
        process.exit(0);
    }

    private async handleError(error: Error) {
        logger.error(`Server error: ${(error as Error).message}`);
        await this.onError(error);
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
}
