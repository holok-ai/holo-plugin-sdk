const rabbitMQConnection = require('./connection');
const logger = require('../utils/logger');

/**
 * RabbitMQ producer for sending messages to queues
 */
class Producer {
  constructor() {
    this.channel = null;
    this.initialized = false;
  }

  /**
   * Initialize the producer
   */
  async init() {
    if (this.initialized) {
      return;
    }
    
    try {
      this.channel = await rabbitMQConnection.getChannel();
      this.initialized = true;
      logger.info('RabbitMQ producer initialized');
    } catch (error) {
      logger.error(`Failed to initialize producer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a message to a queue
   * @param {string} queue - Queue name
   * @param {object} message - Message to send
   * @param {object} options - Message options
   */
  async sendToQueue(queue, message, options = {}) {
    if (!this.initialized) {
      await this.init();
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
      const messageOptions = { ...defaultOptions, ...options };
      
      // Send to queue
      const sent = this.channel.sendToQueue(queue, buffer, messageOptions);
      
      if (sent) {
        logger.debug(`Message sent to queue ${queue} with ID: ${message.id}`);
      } else {
        logger.warn(`Failed to send message to queue ${queue}, channel back-pressured`);
        // Handle back-pressure, perhaps by implementing a retry mechanism
      }
      
      return sent;
    } catch (error) {
      logger.error(`Error sending message to queue ${queue}: ${error.message}`);
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
  async sendToExchange(exchange, routingKey, message, options = {}) {
    if (!this.initialized) {
      await this.init();
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
      const messageOptions = { ...defaultOptions, ...options };
      
      // Send to exchange
      const sent = this.channel.publish(exchange, routingKey, buffer, messageOptions);
      
      if (sent) {
        logger.debug(`Message published to exchange ${exchange} with routing key ${routingKey}`);
      } else {
        logger.warn(`Failed to publish message to exchange ${exchange}, channel back-pressured`);
        // Handle back-pressure
      }
      
      return sent;
    } catch (error) {
      logger.error(`Error publishing message to exchange ${exchange}: ${error.message}`);
      throw error;
    }
  }
}

// Create a singleton instance
const producer = new Producer();

module.exports = producer;
