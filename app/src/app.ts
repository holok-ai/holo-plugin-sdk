// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import "reflect-metadata";
import {container} from "tsyringe";
import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './utils/logger';
import {errorMiddleware, nocorsMiddleware} from "./api/middleware";
import {InitService, ProviderService, ResponseService} from "./services";
import {createRoutes} from "./api/routes";
import {env} from "./env";
import listEndpoints from "express-list-endpoints";
import {AppDB} from "./db";
import {
    ConfigFileLoader,
    ConfigQueueLoader,
    ConfigQueueLoaderFactory,
    ConfigService,
    OrganizationConfigCacheService, RedisService,
    TokenService
} from './admin/services';
import {PluginService} from "./services/plugin/plugin.service";
import {PluginDiscoveryService} from "./services/plugin/discovery.service";
import {PluginLoaderService} from "./services/plugin/loader.service";
import {ProviderPluginRegistry} from "./services/plugin/provider.registry.service";
import {NotificationServiceToken, NotificationStoreToken} from '@holokai/sdk/notification';
import {QueueNotificationService} from "./services/notification/queue.notification.service";
import {PostgresNotificationStore} from "./db/notification.db";

// Initialize Express app
const app: Application = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json({limit: '10mb'}));

// Option 1: Disable CORS for local development by adding these headers to all responses
app.use(nocorsMiddleware);
app.use(errorMiddleware);
// Serve static files from the public directory
app.use(express.static('src/public'));


// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});


// Start server
const PORT: number = env.api.port || 3000;
container.registerSingleton(RedisService)
    .registerSingleton(ResponseService)
    .registerSingleton(AppDB)
    .registerSingleton(OrganizationConfigCacheService)
    .registerSingleton(ConfigService)
    .registerSingleton(TokenService)
    .registerSingleton(ConfigFileLoader)
    .registerSingleton(ConfigQueueLoader, ConfigQueueLoaderFactory)
    .registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginRegistry)
    .registerSingleton(NotificationServiceToken, QueueNotificationService)
    .registerSingleton(NotificationStoreToken, PostgresNotificationStore)
    .registerSingleton(ProviderService)

const configService: ConfigService = container.resolve(ConfigService);

async function waitForInitialConfig(timeoutMs: number = 60000) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {

            reject(new Error(`Timeout: Initial configuration not received within ${timeoutMs / 1000}s`));
        }, timeoutMs);

        configService.once('config:initialized', () => {
            clearTimeout(timer);
            resolve();
        });

        if (env.api.configMode === 'FILE') {
            const fileLoader = container.resolve(ConfigFileLoader);
            fileLoader.loadConfig();
        } else {
            const queueLoader = container.resolve(ConfigQueueLoader);
            queueLoader.loadConfig();
        }
    });
}


// Initialize app with async components
async function initApp(): Promise<void> {
    try {
        const initService = container.resolve(InitService);

        logger.debug(`Creating API Server with id ${env.api.apiServerId}`);
        await initService.init(env.api.apiServerId);

        // wait for initial config, or throw error for visibility
        try {
            await waitForInitialConfig(env.api.configTimeoutMs);
            logger.info('Initial configuration received, continuing startup...');
        } catch (e) {
            console.error('Startup failed:', (e as Error).message);
            process.exit(1);
        }

        app.use('/api', createRoutes());
        // Start the HTTP server
        const server = app.listen(PORT, (): void => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            const endpoints = listEndpoints(app);
            console.log('\n📍 Registered routes:');
            console.table(endpoints);
        });

        // Handle server errors
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

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully`);

    try {
        // TODO: Implement proper cleanup of database connections, RabbitMQ connections, and provider clients
        // This should include: AppDB.close(), QueueService.disconnect(), ProviderService.cleanup()
        const redisService = container.resolve(RedisService);
        await redisService.disconnect();
        logger.info('Closed Redis connection');

        // Add other cleanup tasks here
        // await database.close();
        // await rabbitMQ.close();

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

['SIGBREAK', 'SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down worker server...`);
        gracefulShutdown(signal);
        process.exit(0);
    });
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception in worker server: ${err.message}`);
    logger.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error): void => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
    logger.error(`Unhandled Rejection: ${reason}`, promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
initApp().catch((error: Error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});

export default app;
