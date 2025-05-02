const rabbitMQConnection = require('./connection');
const { config } = require('../config/config');
const logger = require('../utils/logger');

/**
 * RabbitMQ consumer for processing messages from queues
 */
class Consumer {
  constructor() {
    this.channel = null;
    this.initialized = false;
    this.messageHandlers = new Map();
  }

  /**
   * Initialize the consumer
   */
  async init() {
    if (this.initialized) {
      return;
    }
    
    try {
      this.channel = await rabbitMQConnection.getChannel();
      
      // Set prefetch count to limit concurrent processing
      await this.channel.prefetch(config.worker.prefetch);
      
      this.initialized = true;
      logger.info('RabbitMQ consumer initialized');
    } catch (error) {
      logger.error(`Failed to initialize consumer: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get the RabbitMQ channel
   * @returns {Promise<Channel>} - RabbitMQ channel
   */
  async getChannel() {
    if (!this.initialized) {
      await this.init();
    }
    
    return this.channel;
  }

  /**
   * Register a message handler for a specific message type
   * @param {string} messageType - Type of message to handle
   * @param {function} handler - Handler function
   */
  registerHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
    logger.info(`Registered handler for message type: ${messageType}`);
  }

  /**
   * Start consuming messages from a queue
   * @param {string} queue - Queue name
   */
  async consume(queue) {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
      logger.info(`Starting to consume messages from queue: ${queue}`);
      
      // Start consuming messages
      await this.channel.consume(queue, async (message) => {
        if (!message) {
          logger.warn('Received null message, ignoring');
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          const { type, id } = content;
          
          logger.debug(`Received message (${id}) of type: ${type}`);
          
          // Find handler for message type
          const handler = this.messageHandlers.get(type);
          
          if (!handler) {
            logger.warn(`No handler registered for message type: ${type}`);
            // Acknowledge the message to remove it from the queue
            this.channel.ack(message);
            return;
          }
          
          // Process the message
          await handler(content);
          
          // Acknowledge successful processing
          this.channel.ack(message);
          logger.debug(`Successfully processed message: ${id}`);
        } catch (error) {
          logger.error(`Error processing message: ${error.message}`);
          
          // In case of processing error, we have different strategies:
          // 1. Reject and requeue for transient errors
          // 2. Reject without requeue for permanent errors
          // 3. Move to a dead-letter queue for later analysis
          
          // For now, we'll use a simple approach:
          if (error.retryable) {
            // Reject and requeue
            this.channel.nack(message, false, true);
            logger.info('Message requeued for retry');
          } else {
            // Reject without requeue
            this.channel.nack(message, false, false);
            logger.info('Message rejected (not requeued)');
          }
        }
      }, { noAck: false }); // Manual acknowledgment
      
      logger.info(`Successfully started consuming from queue: ${queue}`);
    } catch (error) {
      logger.error(`Error setting up consumer for queue ${queue}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop consuming messages
   */
  async stop() {
    if (this.channel) {
      try {
        await this.channel.cancel();
        logger.info('Stopped consuming messages');
      } catch (error) {
        logger.error(`Error stopping consumer: ${error.message}`);
      }
    }
  }
  
  /**
   * Get number of active connections
   * @returns {Promise<number>} - Number of active connections
   */
  async getActiveConnectionCount() {
    try {
      if (!this.initialized) {
        await this.init();
      }
      
      // This is an estimate - in a production environment, you might
      // want to get this information from the RabbitMQ management API
      return this.channel ? 1 : 0;
    } catch (error) {
      logger.error(`Error getting active connection count: ${error.message}`);
      return 0;
    }
  }
}

// Create a singleton instance
const consumer = new Consumer();

module.exports = consumer;
