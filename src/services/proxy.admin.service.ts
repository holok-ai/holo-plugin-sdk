import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';
import { QueueService } from './queue.service';
import { env } from '../env';
import logger from '../utils/logger';
import { ConfigLoader, ConfigLoaderFactory } from './config-loader';
import { ProxyConfig } from '../types';
export interface MessageHandler {
    handle(message: ProxyConfig): Promise<void>;
}

@injectable()
export class ProxyAdminService {
    private messageHandlers: Map<string, MessageHandler> = new Map();
    private isListening: boolean = false;
    private serverId: string = env.api.apiServerId;
    private configLoader: ConfigLoader | null = null;
    
    constructor(
        @inject(QueueService) private queueService: QueueService, 
    ) {}

    /**
     * Initialize the ProxyAdminService with default handlers and start listening for config events
     */
    async init(): Promise<void> {
        try {
            logger.info('Initializing ProxyAdminService...');

            // Create config loader
            this.configLoader = ConfigLoaderFactory.createConfigLoader(this.serverId);

            // Register default handlers
            await this.registerDefaultHandlers();

            // Setup event listeners
            await this.setupConfigEventListeners();

            // Load initial configuration (this will trigger events)
            await this.configLoader.loadConfig();

            logger.info('ProxyAdminService initialized successfully');
        } catch (error) {
            logger.error(`Failed to initialize ProxyAdminService: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Register default message handlers
     */
    private async registerDefaultHandlers(): Promise<void> {
        const { container } = await import('tsyringe');
        
        try {
            // Import and register ConfigUpdateHandler
            const { ConfigUpdateHandler } = await import('./handlers/config-update.handler');
            const configHandler = container.resolve(ConfigUpdateHandler);
            this.registerHandler('APPLICATION', configHandler);

            // Import and register JwtInvalidationHandler
            const { JwtInvalidationHandler } = await import('./handlers/jwt-invalidation.handler');
            const jwtHandler = container.resolve(JwtInvalidationHandler);
            this.registerHandler('JWT', jwtHandler);

            logger.debug('Default admin message handlers registered');
        } catch (error) {
            logger.error(`Failed to register default handlers: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Register a handler for a specific message type
     */
    registerHandler(messageType: string, handler: MessageHandler): void {
        logger.debug(`Registering handler for message type: ${messageType}`);
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * Setup event listeners for ConfigLoader events
     */
    private async setupConfigEventListeners(): Promise<void> {
        if (!this.configLoader) {
            throw new Error('ConfigLoader not initialized');
        }

        logger.debug('Setting up config event listeners...');

        // Listen for initial config
        this.configLoader.on('config:initial', (config: ProxyConfig) => {
            logger.info(`ProxyAdminService received initial config with ${config.data.length} applications`);
            this.handleConfigMessage('INITIAL', config);
        });

        // Listen for config updates
        this.configLoader.on('config:updated', (config: ProxyConfig) => {
            logger.info(`ProxyAdminService received config update with ${config.data.length} applications`);
            this.handleConfigMessage('UPDATE', config);
        });

        // Listen for config errors
        this.configLoader.on('config:error', (error: Error) => {
            logger.error(`ProxyAdminService received config error: ${error.message}`);
            this.handleConfigError(error);
        });

        // Listen for loader ready
        this.configLoader.on('loader:ready', () => {
            logger.debug('Config loader is ready');
        });

        this.isListening = true;
        logger.debug('Config event listeners setup complete');
    }

    /**
     * Handle config messages from ConfigLoader events
     */
    private async handleConfigMessage(eventType: string, config: ProxyConfig): Promise<void> {
        try {
            logger.debug(`Handling config message of type: ${config.entity_type} from event: ${eventType}`);

            // Find appropriate handler based on entity_type
            const handler = this.messageHandlers.get(config.entity_type);
            if (!handler) {
                logger.warn(`No handler registered for config type: ${config.entity_type}`);
                return;
            }

            // Process config with handler
            await handler.handle(config);
            logger.debug(`Successfully processed config of type: ${config.entity_type} from event: ${eventType}`);

        } catch (error) {
            logger.error(`Error processing config message from event ${eventType}: ${(error as Error).message}`, {
                configType: config.entity_type,
                error: (error as Error).stack
            });
            throw error;
        }
    }

    /**
     * Handle config errors from ConfigLoader events
     */
    private handleConfigError(error: Error): void {
        logger.error(`Config error received: ${error.message}`, {
            error: error.stack
        });
        // Could emit events here for other services to react to config errors
    }

    /**
     * Stop listening for config events
     */
    async stopListening(): Promise<void> {
        if (!this.isListening) {
            return;
        }

        try {
            if (this.configLoader) {
                this.configLoader.removeAllListeners();
            }
            this.isListening = false;
            logger.info('ProxyAdminService stopped listening for config events');
        } catch (error) {
            logger.error(`Error stopping ProxyAdminService: ${(error as Error).message}`);
            throw error;
        }
    }


    /**
     * Send a response message back through the admin response exchange
     */
    async sendResponse(routingKey: string, response: any): Promise<void> {
        try {
            const responseMessage = {
                ...response,
                proxyId: env.api.apiServerId,
                timestamp: new Date().toISOString()
            };

            await this.queueService.sendToExchange(
                env.queue.adminResponseExchange,
                routingKey,
                responseMessage
            );

            logger.debug(`Sent admin response with routing key: ${routingKey}`);
        } catch (error) {
            logger.error(`Failed to send admin response: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Get list of registered message types
     */
    getRegisteredMessageTypes(): string[] {
        return Array.from(this.messageHandlers.keys());
    }

    /**
     * Check if service is currently listening for config events
     */
    get listening(): boolean {
        return this.isListening;
    }

    /**
     * Get the current config loader instance
     */
    get currentConfigLoader(): ConfigLoader | null {
        return this.configLoader;
    }
}