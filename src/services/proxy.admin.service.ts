import 'reflect-metadata';
import { injectable, inject } from 'tsyringe';
import { QueueService } from './queue.service';
import { env } from '../env';
import logger from '../utils/logger';
import { ConsumeMessage } from 'amqplib';
import { ConfigLoader, ConfigLoaderFactory } from './config-loader';

export interface AdminMessage {
    type: string;
    messageId: string;
    timestamp: string;
    [key: string]: any;
}

export interface MessageHandler {
    handle(message: AdminMessage, rawMessage: ConsumeMessage): Promise<void>;
}

@injectable()
export class ProxyAdminService {
    private messageHandlers: Map<string, MessageHandler> = new Map();
    private isConsuming: boolean = false;
    private serverId: string = env.api.apiServerId;

    constructor(
        @inject(QueueService) private queueService: QueueService, 
    ) {}

    /**
     * Initialize the ProxyAdminService with default handlers and start consuming
     */
    async init(): Promise<void> {
        try {
            logger.info('Initializing ProxyAdminService...');

            const configLoader: ConfigLoader = ConfigLoaderFactory.createConfigLoader(this.serverId);

            await configLoader.loadConfig();
         
            // Register default handlers
            await this.registerDefaultHandlers();

            // Start consuming messages
            await this.startConsuming();

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
            this.registerHandler('config_update', configHandler);

            // Import and register JwtInvalidationHandler
            const { JwtInvalidationHandler } = await import('./handlers/jwt-invalidation.handler');
            const jwtHandler = container.resolve(JwtInvalidationHandler);
            this.registerHandler('jwt_invalidation', jwtHandler);

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
     * Start consuming admin messages from the management queue
     */
    async startConsuming(): Promise<void> {
        if (this.isConsuming) {
            logger.warn('ProxyAdminService is already consuming messages');
            return;
        }

        try {
            logger.info('Starting ProxyAdminService message consumption...');
            
            // Ensure queue service is connected
            if (!this.queueService.isConnected) {
                await this.queueService.connect();
            }

            // Assert the management queue exists
            await this.queueService.assertQueue(env.queue.managementQueue);

            // Start consuming messages
            await this.queueService.consume(
                env.queue.managementQueue,
                this.handleMessage.bind(this),
                false, // Don't ignore errors
                { noAck: false } // Require acknowledgment
            );

            this.isConsuming = true;
            logger.info(`ProxyAdminService started consuming from queue: ${env.queue.managementQueue}`);

        } catch (error) {
            logger.error(`Failed to start ProxyAdminService: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Stop consuming messages
     */
    async stopConsuming(): Promise<void> {
        if (!this.isConsuming) {
            return;
        }

        try {
            await this.queueService.stop();
            this.isConsuming = false;
            logger.info('ProxyAdminService stopped consuming messages');
        } catch (error) {
            logger.error(`Error stopping ProxyAdminService: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Handle incoming admin messages and route to appropriate handlers
     */
    private async handleMessage(messageId: string, content: AdminMessage, rawMessage: ConsumeMessage): Promise<void> {
        try {
            logger.debug(`Received admin message of type: ${content.type} with ID: ${messageId}`);

            // Validate message structure
            if (!content.type) {
                logger.error(`Message ${messageId} missing required 'type' field`);
                return;
            }

            // Find appropriate handler
            const handler = this.messageHandlers.get(content.type);
            if (!handler) {
                logger.warn(`No handler registered for message type: ${content.type}`);
                return;
            }

            // Process message with handler
            await handler.handle(content, rawMessage);
            logger.debug(`Successfully processed message ${messageId} of type: ${content.type}`);

        } catch (error) {
            logger.error(`Error processing admin message ${messageId}: ${(error as Error).message}`, {
                messageType: content.type,
                error: (error as Error).stack
            });
            throw error; // Re-throw to let queue service handle retry logic
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
     * Check if service is currently consuming messages
     */
    get consuming(): boolean {
        return this.isConsuming;
    }
}