import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {EventEmitter} from 'events';
import {AnnouncementMessage, AnnouncementType, ConfigLoader} from '../types';
import {QueueService} from '../../services';
import {env} from '../../env';
import logger from '../../utils/logger';
import {ConfigService} from "./config.service";


@injectable()
export class ConfigQueueLoaderFactory {
    constructor(
        queueService: QueueService,
        configService: ConfigService,
    ) {
        return new ConfigQueueLoader(queueService, configService, env.api.apiServerId);
    }
}

export class ConfigQueueLoader extends EventEmitter implements ConfigLoader {

    private readonly platformCommandRoutingKey: string;
    private readonly announcementRoutingKey: string;
    private readonly managementQueue: string;

    constructor(
        private queueService: QueueService,
        private configService: ConfigService,
        private readonly serverId = env.api.apiServerId
    ) {
        super();
        this.serverId = serverId;
        this.platformCommandRoutingKey = `server.proxy.${this.serverId}`;
        this.announcementRoutingKey = `announcement.${this.serverId}`;
        this.managementQueue = `${env.queue.managementQueue}.${this.serverId}`;
        this.setMaxListeners(10); // Allow up to 10 listeners
    }

    async loadConfig(): Promise<void> {
        logger.info(`MQ Config Loader: Starting configuration load for server: ${this.serverId}`);
        await this.setupPlatformInfrastructure();
        await this.startConfigUpdateListener();
        await this.registerWithMoku();
    }

    /**
     * Start listening for ongoing config updates after initial load
     */
    async startConfigUpdateListener(): Promise<void> {
        logger.info(`MQ Config Loader: Starting config update listener on queue: ${this.managementQueue}`);

        await this.queueService.consume(
            this.managementQueue,
            async (messageId: string, content: any) => {
                const msgId = messageId || 'unknown';
                const configType = content?.configType || 'unknown';
                logger.debug(`MQ Config Loader: Received update message: ${msgId} (type: ${configType})`);
                if (!(await this.configService.processConfig(content))) {
                    logger.error(`MQ Config Loader: Failed to process config message: ${msgId} (type: ${configType})`);
                }
            },
            true, // ignore errors for non-config messages
            {noAck: false}
        );
    }

    private async setupPlatformInfrastructure(): Promise<void> {
        logger.debug('MQ Config Loader: Setting up platform infrastructure...');

        // Ensure queue service is connected
        if (!this.queueService.isConnected) {
            await this.queueService.connect();
        }

        // Setup platform exchange
        await this.queueService.assertExchange(env.queue.platformExchange, 'topic');

        // Setup platform command queue for this server
        await this.queueService.assertQueue(
            this.managementQueue,
            {
                durable: true,
                arguments: {
                    'x-expires': env.queue.queueExpiration
                }
            },
            env.queue.platformExchange,
            this.platformCommandRoutingKey
        );

        logger.debug(`MQ Config Loader: Platform infrastructure setup complete. Queue: ${this.managementQueue}, Routing Key: ${this.platformCommandRoutingKey}`);
        this.emit('platform:ready');
        this.emit('loader:ready');
    }

    private async registerWithMoku(): Promise<void> {
        const announcementMessage: AnnouncementMessage = {
            type: AnnouncementType.PROXY,
            serverId: this.serverId,
            timestamp: new Date().toISOString()
        };

        logger.info(`MQ Config Loader: Sending proxy announcement message for server: ${this.serverId} with key ${this.announcementRoutingKey}`);
        await this.queueService.sendToExchange(
            env.queue.platformExchange,
            this.announcementRoutingKey,
            announcementMessage
        );
        logger.debug(`MQ Config Loader: Proxy announcement sent to platform exchange with routing key: ${this.announcementRoutingKey}`);
        this.emit('announcement:sent', this.serverId);
    }
}
