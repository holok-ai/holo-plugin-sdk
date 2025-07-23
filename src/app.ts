import "reflect-metadata";
import {container} from "tsyringe";
import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import logger from './utils/logger';
import {errorMiddleware, nocorsMiddleware} from "./api/middleware";
import {InitService, ResponseService} from "./services";
import {createRoutes} from "./api/routes";
import {env} from "./env";

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

app.use('/api', createRoutes());

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

// Initialize app with async components
async function initApp(): Promise<void> {
    try {
        // const queueService = container.resolve(QueueService);
        const initService = container.resolve(InitService);
        const responseService: ResponseService = container.resolve(ResponseService);

        await initService.setupQueues();
        await responseService.init();

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
