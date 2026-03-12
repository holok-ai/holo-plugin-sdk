import 'reflect-metadata';
import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import listEndpoints from 'express-list-endpoints';
import {injectable} from 'tsyringe';
import {BaseServer} from './base.server';
import {withAdmin, withDB} from './mixins';
import {env} from '../env';
import logger from '../utils/logger';
import {ServerType} from '@holokai/types/entities';
import {InitService} from '../services';
import {errorMiddleware, nocorsMiddleware} from '../api/middleware';
import {createProviderProxyRoutes, createHoloRoutes} from '../api/routes';

@injectable()
export class ApiServer extends withAdmin(withDB(BaseServer)) {
    private readonly expressApp: Application;
    private httpServer?: ReturnType<Application['listen']>;

    constructor(
        private initService: InitService,
    ) {
        super(env.api.apiServerId, ServerType.API);
        this.expressApp = express();
        this.setupMiddleware();
    }

    private setupMiddleware() {
        this.expressApp.use(morgan('dev'));
        this.expressApp.use(bodyParser.json({limit: '10mb'}));
        this.expressApp.use(nocorsMiddleware);
        this.expressApp.use(errorMiddleware);
        this.expressApp.use(express.static('src/public'));

        this.expressApp.get('/health', (_req: Request, res: Response): void => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.initService.init(this.id);

        this.expressApp.use('/api', await createProviderProxyRoutes());
        this.expressApp.use('/holo/api', createHoloRoutes());
        await this.startListening();
    }

    async onShutdown(): Promise<void> {
        if (this.httpServer) {
            await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
        }
        await super.onShutdown();
    }

    private startListening(): Promise<void> {
        const port = env.api.port || 3000;
        return new Promise((resolve, reject) => {
            this.httpServer = this.expressApp.listen(port, () => {
                logger.info(`API server running on port ${port}`);
                logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                const endpoints = listEndpoints(this.expressApp);
                console.table(endpoints);
                resolve();
            });

            this.httpServer.on('error', (error: Error & { code?: string; syscall?: string }) => {
                if (error.syscall === 'listen') {
                    if (error.code === 'EACCES') {
                        logger.error(`Port ${port} requires elevated privileges`);
                    } else if (error.code === 'EADDRINUSE') {
                        logger.error(`Port ${port} is already in use`);
                    }
                }
                reject(error);
            });
        });
    }
}
