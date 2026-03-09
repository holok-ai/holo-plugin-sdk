import "reflect-metadata";
import {container} from "tsyringe";
import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './utils/logger';
import {errorMiddleware, nocorsMiddleware} from "./api/middleware";
import {
    AccessService,
    ApplicationService,
    HoloTokenService,
    InitService,
    NotificationService,
    PluginDiscoveryService,
    PluginLoaderService,
    PluginService,
    ProviderImplService,
    ProviderPluginService,
    ProviderService,
    RedisService,
    ResponseService,
    TokenService
} from "./services";
import {AccessDB, AppDB, HoloTokenDB, ProviderDB} from "./db";
import {createRoutes} from "./api/routes";
import {env} from "./env";
import listEndpoints from "express-list-endpoints";
import {NotificationServiceToken, NotificationStoreToken} from '@holokai/sdk/notification';
import {PostgresNotificationStore} from "./db/notification.db";

const app: Application = express();

app.use(morgan('dev'));
app.use(bodyParser.json({limit: '10mb'}));
app.use(nocorsMiddleware);
app.use(errorMiddleware);
app.use(express.static('src/public'));

app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

const PORT: number = env.api.port || 3000;
container.registerSingleton(RedisService)
    .registerSingleton(ResponseService)
    .registerSingleton(AppDB)
    .registerSingleton(TokenService)
    .registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginService)
    .registerSingleton(ProviderImplService)
    .registerSingleton(NotificationServiceToken, NotificationService)
    .registerSingleton(NotificationStoreToken, PostgresNotificationStore)
    .registerSingleton(HoloTokenDB)
    .registerSingleton(HoloTokenService)
    .registerSingleton(ProviderDB)
    .registerSingleton(AccessDB)
    .registerSingleton(AccessService)
    .registerSingleton(ApplicationService)
    .registerSingleton(ProviderService)

async function initApp(): Promise<void> {
    try {
        const initService = container.resolve(InitService);

        logger.debug(`Creating API Server with id ${env.api.apiServerId}`);
        await initService.init(env.api.apiServerId);

        app.use('/api', await createRoutes());
        const server = app.listen(PORT, (): void => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            const endpoints = listEndpoints(app);
            console.log('\n📍 Registered routes:');
            console.table(endpoints);
        });

        server.on('error', (error: Error & { code?: string; syscall?: string }): void => {
            logger.error(`Server error: ${error.message}`);
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    logger.error(`Port ${PORT} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(`Port ${PORT} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

    } catch (error) {
        logger.error(`Failed to initialize application: ${(error as Error).message}`, {
            stack: (error as Error).stack
        });
        process.exit(1);
    }
}

async function gracefulShutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully`);

    try {
        const redisService = container.resolve(RedisService);
        await redisService.disconnect();
        logger.info('Closed Redis connection');

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

['SIGBREAK', 'SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down...`);
        gracefulShutdown(signal);
        process.exit(0);
    });
});

process.on('uncaughtException', (error: Error): void => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
    logger.error(`Unhandled Rejection: ${reason}`, promise, 'reason:', reason);
    process.exit(1);
});

initApp().catch((error: Error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});

export default app;
