import { injectable, inject } from 'tsyringe';
import { EventEmitter } from 'events';
import { ProxyConfig, AnnouncementMessage, AnnouncementType } from '../../types';
import { ConfigLoader, ConfigLoaderEvents } from './config-loader.interface';
import { QueueService } from '../queue.service';
import { env } from '../../env';
import logger from '../../utils/logger';

export interface MqConfigLoaderEvents extends ConfigLoaderEvents {
    'announcement:sent': (serverId: string) => void;
}

@injectable()
export class MqConfigLoader extends EventEmitter implements ConfigLoader {
    private configLoadPromise: Promise<ProxyConfig> | null = null;
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

    async loadConfig(): Promise<ProxyConfig> {
        // Ensure we only load config once
        if (this.configLoadPromise) {
            return this.configLoadPromise;
        }

        this.configLoadPromise = this._loadConfigInternal();
        return this.configLoadPromise;
    }

    private async _loadConfigInternal(): Promise<ProxyConfig> {
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
    private async _waitForInitialConfig(): Promise<ProxyConfig> {
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
            const handleInitialConfig = (config: ProxyConfig) => {
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
                        const config = content as ProxyConfig;
                        this._validateConfig(config);
                        
                        // Update cache
                        // cacheService.setApplications(config.data);
                        
                        logger.info(`MQ Config Loader: Configuration updated with ${config.data.length} applications`);
                          if(this.hasReceivedInitial){
                                this.emit('config:updated', config);
                            }else{
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
            { noAck: false }
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

    private _validateConfig(config: any): void {
        if (!config.entity_type) {
            throw new Error('Configuration must include entity_type');
        }

        if (!['APPLICATION', 'JWT_TOKEN'].includes(config.entity_type)) {
            throw new Error(`Invalid entity_type: ${config.entity_type}. Must be APPLICATION or JWT_TOKEN`);
        }

        if (!config.action) {
            throw new Error('Configuration must include action');
        }

        if (!['NEW', 'UPDATE', 'DELETE'].includes(config.action)) {
            throw new Error(`Invalid action: ${config.action}. Must be NEW, UPDATE, or DELETE`);
        }

        if (!Array.isArray(config.data)) {
            throw new Error('Configuration must include data array');
        }

        config.data.forEach((app: any, index: number) => {
            if (!app.urlSlug) {
                throw new Error(`Application at index ${index} must have a urlSlug`);
            }
            if (!app.organizationId) {
                throw new Error(`Application at index ${index} must have an organizationId`);
            }
            if (!app.providerType) {
                throw new Error(`Application at index ${index} must have a providerType`);
            }
            if (!Array.isArray(app.models) || app.models.length === 0) {
                throw new Error(`Application at index ${index} must have a models array with at least one model`);
            }
            
            app.models.forEach((model: any, modelIndex: number) => {
                if (!model.name || !model.accessModel) {
                    throw new Error(`Model at index ${modelIndex} in application ${index} must have both name and accessModel`);
                }
            });
        });
    }
}