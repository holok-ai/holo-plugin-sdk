import "reflect-metadata";
import {Channel, ChannelModel, connect, ConsumeMessage} from 'amqplib';
import logger from '../utils/logger';
import {RabbitConfig} from "../types";
import {env} from "../env";
import {injectable} from "tsyringe";

/**
 * RabbitMQ queue management service
 */
@injectable()
export class QueueService {
    private readonly config: RabbitConfig = env.queue.config
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    public isConnected: boolean = false;
    public reconnectAttempts = 0;

    constructor() {

    }

    public async connect(): Promise<void> {
        try {
            if (this.connection && this.channel) {
                this.isConnected = true;
                return;
            }

            this.connection = await connect(this.config.url);
            logger.info('Successfully connected to RabbitMQ');


            // Create a channel
            this.channel = await this.connection.createChannel();
            logger.info('Successfully created RabbitMQ channel');

            // Handle connection errors and automatically reconnect
            this.connection.on('error', (err) => {
                logger.error(`RabbitMQ connection error: ${err.message}`);
                this.isConnected = false;
                this.reconnect();
            });

            this.connection.on('close', () => {
                if (this.isConnected) {
                    logger.warn('RabbitMQ connection closed unexpectedly');
                    this.isConnected = false;
                    this.reconnect();
                }
            });

            this.channel.on('error', (err) => {
                this.isConnected = false;
                logger.error(`RabbitMQ channel error: ${err.message}`);
            });
            this.isConnected = true;
        } catch (error) {
            logger.error(`Failed to connect to RabbitMQ: ${(error as Error).message}`);
            throw error;
        }
    }

    public async reconnect(): Promise<void> {
        if (!this.isConnected) {
            if (this.reconnectAttempts >= this.config.reconnectAttempts) {
                logger.error(`Failed to reconnect to RabbitMQ after ${this.reconnectAttempts} attempts`);
                return;
            }

            this.reconnectAttempts++;
            const delay = this.config.reconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1);

            logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);

            setTimeout(async () => {
                try {
                    await this.connect();
                } catch (error) {
                    // Error handling is done in the connect method
                }
            }, delay);
        }
    }

    public async disconnect() {
        if (this.channel) {
            await this.channel.close();
        }

        if (this.connection) {
            await this.connection.close();
        }

        this.isConnected = false;
        logger.info('Disconnected from RabbitMQ');
    }

    public async consume(queueName: string, callback: (messageId: string, content: any, message: ConsumeMessage) => void, ignoreErrors: boolean = false, options = {noAck: false}): Promise<void> {
        if (!this.isConnected) {
            await this.connect();
        }
        logger.info(`Consuming messages from queue: ${queueName}`);

        try {
            await this.channel!.consume(queueName, async (message) => {
                if (!message) {
                    logger.warn(`Received null message from queue: ${queueName}`);
                    return;
                }
                try {
                    const content = JSON.parse(message.content.toString());
                    logger.debug(`Received message from queue: ${queueName} with ${message.content.toString()})`);
                    const {requestId} = content;
                    logger.debug(`Received message from queue: ${queueName} with requestId: (${requestId})`);
                    callback(requestId, content, message);
                    this.channel!.ack(message);
                    logger.debug(`Successfully processed message from queue: ${queueName} with requestId (${requestId})`);

                } catch (error) {
                    logger.error(`Error processing message from queue: ${queueName}: ${(error as Error).message}`);

                    if (ignoreErrors) {
                        this.channel!.ack(message);
                    } else {
                        if (message.fields.redelivered) {
                            this.channel!.nack(message, false, false);
                            logger.warn('Rejected problematic message after redelivery');
                        } else {
                            this.channel!.nack(message, false, true);
                            logger.info('Message re-queued for retry');
                        }
                    }
                }

            }, options);
        } catch (error) {
            logger.error(`Error setting up consumer for queue ${queueName}: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Send a message to a queue
     * @param {string} queue - Queue name
     * @param {object} message - Message to send
     * @param {object} options - Message options
     */
    async sendToQueue(queue: string, message: { id: string }, options: object = {}): Promise<boolean> {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Convert message to buffer
            const buffer = Buffer.from(JSON.stringify(message));

            // Default options
            const defaultOptions = {
                persistent: true,
                contentType: 'application/json'
            };

            // Merge options
            const messageOptions = {...defaultOptions, ...options};

            // Send to queue
            const sent = this.channel!.sendToQueue(queue, buffer, messageOptions);

            if (sent) {
                logger.debug(`Message sent to queue ${queue} with ID: ${message.id}`);
            } else {
                logger.warn(`Failed to send message to queue ${queue}, channel back-pressured`);
                // Handle back-pressure, perhaps by implementing a retry mechanism
            }

            return sent;
        } catch (error) {
            logger.error(`Error sending message to queue ${queue}: ${(error as Error).message}`);
            throw error;
        }
    }


    /**
     * Send a message to an exchange
     * @param {string} exchange - Exchange name
     * @param {string} routingKey - Routing key
     * @param {object} message - Message to send
     * @param {object} options - Message options
     */
    async sendToExchange(exchange: string, routingKey: string, message: {}, options: object = {}): Promise<boolean> {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Convert message to buffer
            const buffer = Buffer.from(JSON.stringify(message));

            // Default options
            const defaultOptions = {
                persistent: true,
                contentType: 'application/json'
            };

            // Merge options
            const messageOptions = {...defaultOptions, ...options};

            // Send to exchange
            const sent = this.channel!.publish(exchange, routingKey, buffer, messageOptions);

            if (sent) {
                logger.debug(`Message published to exchange ${exchange} with routing key ${routingKey}`);
            } else {
                logger.warn(`Failed to publish message to exchange ${exchange}, channel back-pressured`);
                // Handle back-pressure
            }

            return sent;
        } catch (error) {
            logger.error(`Error publishing message to exchange ${exchange}: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * Stop consuming messages
     */
    async stop() {
        if (this.channel) {
            try {
                await this.channel.cancel('Stopping consumer');
                logger.info('Stopped consuming messages');
            } catch (error) {
                logger.error(`Error stopping consumer: ${(error as Error).message}`);
            }
        }
    }

    async assertExchange(exchange: string, type: string, options: object = {durable: true}) {
        if (!this.isConnected) {
            await this.connect();
        }

        logger.debug(`Asserting exchange ${exchange} with type ${type}`);
        await this.channel!.assertExchange(exchange, type, options);
    }

    async assertQueue(queue: string, options: object = {durable: true}, exchange?: string, pattern?: string) {
        if (!this.isConnected) {
            await this.connect();
        }
        logger.debug(`Asserting queue ${queue}`);
        await this.channel!.assertQueue(queue, options);

        if (exchange) {
            await this.bindQueue(queue, exchange, pattern || '');
        }
    }

    async bindQueue(queue: string, exchange: string, pattern: string) {
        if (!this.isConnected) {
            await this.connect();
        }
        logger.debug(`Binding queue ${queue} to exchange ${exchange} with pattern ${pattern}`);
        await this.channel!.bindQueue(queue, exchange, pattern);
    }
}
