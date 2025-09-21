import {inject, injectable} from 'tsyringe';
import {EventEmitter} from 'events';
import {AnnouncementMessage, AnnouncementType} from '../../types';
import {QueueService} from '../../services';
import {env} from '../../env';
import logger from '../../utils/logger';

import {ConfigLoader, ConfigLoaderEvents, HoloConfig} from "../types";
import {HoloConfigValidator} from "../../admin/validators";
import {ArkErrors} from "arktype";
import {AdminConfigError} from "../../admin/types";

export interface MqConfigLoaderEvents extends ConfigLoaderEvents {
    'announcement:sent': (serverId: string) => void;
}

@injectable()
export class MqConfigLoader extends EventEmitter implements ConfigLoader {
    private configLoadPromise: Promise<HoloConfig> | null = null;
    private serverId: string;
    private platformCommandRoutingKey: string;
    private announcementRoutingKey: string;
    private managementQueue: string;
    private hasReceivedInitial: boolean = false;
    private initialConfigTimeout: NodeJS.Timeout | null = null;

    constructor(
        @inject(QueueService) private queueService: QueueService,
        serverId?: string
    ) {
        super();
        this.serverId = serverId || env.api.apiServerId;
        this.platformCommandRoutingKey = `server.proxy.${this.serverId}`;
        this.announcementRoutingKey = `announcement.${this.serverId}`;
        this.managementQueue = `${env.queue.managementQueue}.${this.serverId}`;
        this.setMaxListeners(10); // Allow up to 10 listeners
    }

    async loadConfig(): Promise<HoloConfig> {
        // Ensure we only load config once
        if (this.configLoadPromise) {
            return this.configLoadPromise;
        }

        this.configLoadPromise = this._loadConfigInternal();
        return this.configLoadPromise;
    }

    private async _loadConfigInternal(): Promise<HoloConfig> {
        try {
            logger.info(`MQ Config Loader: Starting configuration load for server: ${this.serverId}`);

            // Setup platform exchange and queue
            await this._setupPlatformInfrastructure();

            // Start listening for config messages
            await this.startConfigUpdateListener();

            // Send announcement message
            await this._sendProxyAnnouncementMessage();

            // Wait for initial config with timeout
            const config = await this._waitForInitialConfig();

            logger.info(`MQ Config Loader: Successfully loaded configuration with ${config.data.length} applications`);

            return config;

        } catch (error) {
            logger.error(`MQ Config Loader: Failed to load configuration: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Wait for initial config with 60-second timeout
     */
    private async _waitForInitialConfig(): Promise<HoloConfig> {
        return new Promise((resolve, reject) => {
            const timeout = 60000; // 60 seconds

            // Set up timeout timer
            this.initialConfigTimeout = setTimeout(() => {
                const error = new Error(`Timeout: Initial configuration not received within ${timeout}ms`);
                logger.error(error.message);
                this.emit('config:error', error);
                reject(error);
            }, timeout);

            // Listen for initial config event
            const handleInitialConfig = (config: HoloConfig) => {
                if (this.initialConfigTimeout) {
                    clearTimeout(this.initialConfigTimeout);
                    this.initialConfigTimeout = null;
                }
                this.off('config:initial', handleInitialConfig);
                this.off('config:error', handleConfigError);
                resolve(config);
            };

            // Listen for config errors
            const handleConfigError = (error: Error) => {
                if (this.initialConfigTimeout) {
                    clearTimeout(this.initialConfigTimeout);
                    this.initialConfigTimeout = null;
                }
                this.off('config:initial', handleInitialConfig);
                this.off('config:error', handleConfigError);
                reject(error);
            };

            this.on('config:initial', handleInitialConfig);
            this.on('config:error', handleConfigError);

            logger.info(`MQ Config Loader: Waiting for initial configuration (timeout: ${timeout}ms)`);
        });
    }

    private async _setupPlatformInfrastructure(): Promise<void> {
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

    private async _sendProxyAnnouncementMessage(): Promise<void> {
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

    /**
     * Start listening for ongoing config updates after initial load
     */
    async startConfigUpdateListener(): Promise<void> {
        logger.info(`MQ Config Loader: Starting config update listener on queue: ${this.managementQueue}`);

        await this.queueService.consume(
            this.managementQueue,
            async (messageId: string, content: any) => {
                try {
                    logger.debug(`MQ Config Loader: Received update message: ${messageId}`);

                    // Check if this is a ProxyConfig message
                    if (this._isProxyConfigMessage(content)) {
                        const config = HoloConfigValidator(content as HoloConfig);

                        if (config instanceof ArkErrors) {
                            throw new AdminConfigError('Invalid Holo Config', config);
                        }

                        // Update cache
                        // cacheService.setApplications(config.data);

                        logger.info(`MQ Config Loader: Configuration updated with ${config.data.length} applications`);
                        if (this.hasReceivedInitial) {
                            this.emit('config:updated', config);
                        } else {
                            this.hasReceivedInitial = true;
                            this.emit('config:initial', config);
                        }
                    } else {
                        logger.debug(`MQ Config Loader: Received non-config message in update listener, ignoring`);
                    }
                } catch (error) {
                    logger.error(`MQ Config Loader: Error processing config update: ${(error as Error).message}`);
                    this.emit('config:error', error as Error);
                }
            },
            true, // ignore errors for non-config messages
            {noAck: false}
        );
    }

    /**
     * Stop listening for config updates
     */
    async stopConfigUpdateListener(): Promise<void> {
        // Clear initial config timeout if still running
        if (this.initialConfigTimeout) {
            clearTimeout(this.initialConfigTimeout);
            this.initialConfigTimeout = null;
            logger.debug('MQ Config Loader: Cleared initial config timeout');
        }

        await this.queueService.stop();
        logger.info('MQ Config Loader: Stopped config update listener');
    }

    /**
     * Cleanup method to clear timeouts and listeners
     */
    cleanup(): void {
        if (this.initialConfigTimeout) {
            clearTimeout(this.initialConfigTimeout);
            this.initialConfigTimeout = null;
        }
        this.removeAllListeners();
        logger.debug('MQ Config Loader: Cleaned up timeouts and listeners');
    }

    private _isProxyConfigMessage(content: any): boolean {
        return (
            content &&
            typeof content === 'object' &&
            content.entity_type &&
            content.action &&
            Array.isArray(content.data)
        );
    }
}
