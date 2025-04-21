const amqp = require('amqplib');
const { config } = require('../config/config');
const logger = require('../utils/logger');

/**
 * RabbitMQ connection manager
 */
class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = config.rabbitMq.url;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = 5000; // 5 seconds
  }

  /**
   * Connect to RabbitMQ
   */
  async connect() {
    try {
      // If already connected, return existing connection
      if (this.connection && this.channel) {
        return {
          connection: this.connection,
          channel: this.channel
        };
      }

      logger.info(`Connecting to RabbitMQ at ${this.url}`);
      this.connection = await amqp.connect(this.url);
      
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
      
      // Create a channel
      this.channel = await this.connection.createChannel();
      this.channel.on('error', (err) => {
        logger.error(`RabbitMQ channel error: ${err.message}`);
      });
      
      // Set up exchanges and queues
      await this._setupExchangesAndQueues();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Successfully connected to RabbitMQ');
      
      return {
        connection: this.connection,
        channel: this.channel
      };
    } catch (error) {
      logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      this.isConnected = false;
      this.reconnect();
      throw error;
    }
  }

  /**
   * Reconnect to RabbitMQ with exponential backoff
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Failed to reconnect to RabbitMQ after ${this.reconnectAttempts} attempts`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // Error handling is done in the connect method
      }
    }, delay);
  }

  /**
   * Set up exchanges and queues
   */
  async _setupExchangesAndQueues() {
    // Create exchanges
    await this.channel.assertExchange(
      config.rabbitMq.exchanges.llmRequests, 
      'direct', 
      { durable: true }
    );
    
    await this.channel.assertExchange(
      config.rabbitMq.exchanges.llmResponses, 
      'direct', 
      { durable: true }
    );
    
    // Create queues
    await this.channel.assertQueue(
      config.rabbitMq.queues.llmRequests,
      { durable: true }
    );
    
    await this.channel.assertQueue(
      config.rabbitMq.queues.llmResponses,
      { durable: true }
    );
    
    // Bind queues to exchanges
    await this.channel.bindQueue(
      config.rabbitMq.queues.llmRequests,
      config.rabbitMq.exchanges.llmRequests,
      ''
    );
    
    await this.channel.bindQueue(
      config.rabbitMq.queues.llmResponses,
      config.rabbitMq.exchanges.llmResponses,
      ''
    );
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect() {
    if (this.channel) {
      await this.channel.close();
    }
    
    if (this.connection) {
      await this.connection.close();
    }
    
    this.isConnected = false;
    logger.info('Disconnected from RabbitMQ');
  }

  /**
   * Get the channel
   */
  async getChannel() {
    if (!this.isConnected) {
      await this.connect();
    }
    
    return this.channel;
  }
}

// Create a singleton instance
const rabbitMQConnection = new RabbitMQConnection();

module.exports = rabbitMQConnection;
