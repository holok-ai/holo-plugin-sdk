import { injectable, inject } from 'tsyringe';
import { ProxyConfig, AnnouncementMessage, AnnouncementType } from '../../types';
import { ConfigLoader } from './config-loader.interface';
import { QueueService } from '../queue.service';
import { env } from '../../env';
import logger from '../../utils/logger';
import { ConsumeMessage } from 'amqplib';

@injectable()
export class MqConfigLoader implements ConfigLoader {
    private configLoadPromise: Promise<ProxyConfig> | null = null;
    private serverId: string;
    private platformCommandRoutingKey: string;
    private announcementRoutingKey: string;

    constructor(
        @inject(QueueService) private queueService: QueueService,
        serverId?: string
    ) {
        this.serverId = serverId || env.api.apiServerId;
        this.platformCommandRoutingKey = `server.proxy.${this.serverId}`;
        this.announcementRoutingKey = `announcement.${this.serverId}`;
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

            // Send announcement message
            await this._sendProxyAnnouncementMessage();

            // Start listening for config messages
            const config = await this._waitForConfigMessage();

            logger.info(`MQ Config Loader: Successfully loaded configuration with ${config.data.length} applications`);
            
            return config;

        } catch (error) {
            logger.error(`MQ Config Loader: Failed to load configuration: ${(error as Error).message}`);
            throw error;
        }
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
        const platformQueueName = `platform_commands.${this.serverId}`;
        await this.queueService.assertQueue(
            platformQueueName,
            {
                durable: true,
                arguments: {
                    'x-expires': env.queue.queueExpiration
                }
            },
            env.queue.platformExchange,
            this.platformCommandRoutingKey
        );

        logger.debug(`MQ Config Loader: Platform infrastructure setup complete. Queue: , Routing Key: ${this.platformCommandRoutingKey}`);
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
    }

    private async _waitForConfigMessage(): Promise<ProxyConfig> {
        return new Promise((resolve, reject) => {
            const platformQueueName = `platform_commands.${this.serverId}`;
            const timeout = 60000; // 60 second timeout

            logger.info(`MQ Config Loader: Waiting for configuration message on queue: ${platformQueueName}`);

            // Set up timeout
            const timeoutHandle = setTimeout(() => {
                reject(new Error(`Timeout waiting for configuration message after ${timeout}ms`));
            }, timeout);

            this.queueService.consume(
                platformQueueName,
                async (messageId: string, content: any, message: ConsumeMessage) => {
                    try {
                        logger.debug(`MQ Config Loader: Received message: ${JSON.stringify(content)} ${messageId} ${message}`);

                        // Check if this is a ProxyConfig message
                        if (this._isProxyConfigMessage(content)) {
                            clearTimeout(timeoutHandle);
                            
                            const config = content as ProxyConfig;
                            this._validateConfig(config);
                            
                            logger.info(`MQ Config Loader: Received valid proxy configuration`);
                            resolve(config);
                        } else {
                            logger.debug(`MQ Config Loader: Received non-config message, ignoring`);
                        }
                    } catch (error) {
                        clearTimeout(timeoutHandle);
                        logger.error(`MQ Config Loader: Error processing config message: ${(error as Error).message}`);
                        reject(error);
                    }
                },
                true, // ignore errors for non-config messages
                { noAck: false }
            ).catch((error) => {
                clearTimeout(timeoutHandle);
                reject(new Error(`Failed to start consuming config messages: ${error.message}`));
            });
        });
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