import "reflect-metadata";
import {container} from "tsyringe";
import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './utils/logger';
import {errorMiddleware, nocorsMiddleware} from "./api/middleware";
import {parseBoolean, parseNumber} from "./utils";
import {AppConfig} from "./types";
import {InitService, QueueService, ResponseService} from "./services";
import {CONTAINER_TOKENS} from "./config";
import {LLMController} from "./api/controllers/llm.controller";
import routes from "./api/routes";
import {AppDB} from "./db/app.db";

export const appConfig: AppConfig = {
    serverId: process.env.SERVER_ID || `server_${Math.random().toString(36).substring(2, 10)}`,
    port: 3000,
    dbConfig: {
        host: process.env.AUDIT_PG_HOST || 'localhost',
        port: parseNumber(process.env.AUDIT_PG_PORT, 5432),
        database: process.env.AUDIT_PG_DATABASE || 'llm_audit',
        user: process.env.AUDIT_PG_USER || 'postgres',
        password: process.env.AUDIT_PG_PASSWORD || 'postgrespassword',
        ssl: parseBoolean(process.env.AUDIT_PG_SSL, false),
        max: parseNumber(process.env.AUDIT_PG_MAX_CONNECTIONS, 20),
        idleTimeoutMillis: parseNumber(process.env.AUDIT_PG_IDLE_TIMEOUT, 30000)
    },
    queueConfig: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        reconnectAttempts: parseNumber(process.env.RABBITMQ_RECONNECT_ATTEMPTS, 5),
        reconnectDelayMs: parseNumber(process.env.RABBITMQ_RECONNECT_DELAY_MS, 5000)
    },
    requestQueue: process.env.RABBITMQ_REQUEST_QUEUE || 'llm_requests',
    requestExchange: process.env.RABBITMQ_REQUEST_EXCHANGE || 'llm_requests',
    responseQueue: process.env.RABBITMQ_RESPONSE_QUEUE || 'llm_responses',
    responseExchange: process.env.RABBITMQ_RESPONSE_EXCHANGE || 'llm_responses',
    queueExpiration: 3600000
}

container.register(CONTAINER_TOKENS.APP_CONFIG, {useValue: appConfig});
container.register(CONTAINER_TOKENS.SERVER_ID, {useValue: appConfig.serverId});
container.register(CONTAINER_TOKENS.DB_CONFIG, {useValue: appConfig.dbConfig});
container.register(CONTAINER_TOKENS.QUEUE_CONFIG, {useValue: appConfig.queueConfig});
container.register(CONTAINER_TOKENS.REQUEST_QUEUE, {useValue: appConfig.requestQueue});
container.register('QueueService', QueueService);
container.register('InitService', InitService);
container.register('AppDB', AppDB);
container.register('ResponseService', ResponseService);
container.register('LLMController', LLMController);


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

app.use('/api', routes);

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
const PORT: number = appConfig.port || 3000;

// Initialize app with async components
async function initApp(): Promise<void> {
    try {
        // Initialize response controller (this sets up the consumer)
        // await createResponseStream('init');
        logger.info('Response controller initialized successfully');

        // const queueService = container.resolve(QueueService);
        const initService = container.resolve(InitService);

        await initService.setupQueues();

        // Start the HTTP server
        const server = app.listen(PORT, (): void => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException): void => {
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
        // Close database connections, RabbitMQ connections, etc.
        logger.info('Closed model registry connections');

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

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error): void => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
initApp().catch((error: Error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
});

export default app;
