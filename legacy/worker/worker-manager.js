/**
 * Worker Manager for communicating with LLM workers
 * Handles sending commands and receiving responses
 */
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const rabbitMQConnection = require('../queue/connection');

class WorkerManager {
  constructor() {
    this.channel = null;
    this.responseHandlers = new Map();
    this.responseQueue = null;
    this.initialized = false;
  }

  /**
   * Initialize the worker manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Get or create a RabbitMQ channel
      this.channel = await rabbitMQConnection.getChannel();
      logger.info('Worker manager connected to RabbitMQ');
      
      // Create admin exchanges
      await this.channel.assertExchange(
        config.rabbitMq.exchanges.admin,
        'topic',
        { durable: true }
      );
      
      await this.channel.assertExchange(
        config.rabbitMq.exchanges.adminResponses,
        'direct',
        { durable: true }
      );
      
      // Create server-specific response queue for admin commands
      const responseQueueName = `${config.rabbitMq.queues.adminResponsesPrefix}_${config.server.id}`;
      const queueResult = await this.channel.assertQueue(responseQueueName, {
        exclusive: false,
        durable: true,
        autoDelete: true,
        arguments: {
          'x-expires': config.rabbitMq.queueExpiration
        }
      });
      
      this.responseQueue = queueResult.queue;
      logger.info(`Created admin response queue: ${this.responseQueue}`);
      
      // Bind response queue to exchange
      await this.channel.bindQueue(
        this.responseQueue,
        config.rabbitMq.exchanges.adminResponses,
        config.server.id
      );
      
      // Set up consumer for responses
      await this.channel.consume(
        this.responseQueue,
        this._handleAdminResponse.bind(this),
        { noAck: false }
      );
      
      this.initialized = true;
      logger.info('Worker manager initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize worker manager: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle responses from workers
   * @param {Object} message - RabbitMQ message
   * @private
   */
  _handleAdminResponse(message) {
    if (!message) {
      return;
    }
    
    try {
      const content = JSON.parse(message.content.toString());
      const { messageId } = content;
      
      logger.debug(`Received admin response for message ${messageId}`);
      
      // Find and call the response handler if it exists
      const handler = this.responseHandlers.get(messageId);
      if (handler) {
        handler.resolve(content);
        this.responseHandlers.delete(messageId);
        logger.debug(`Processed admin response for message ${messageId}`);
      } else {
        logger.warn(`Received admin response for unknown message ID: ${messageId}`);
      }
      
      // Acknowledge the message
      this.channel.ack(message);
    } catch (error) {
      logger.error(`Error processing admin response: ${error.message}`);
      this.channel.nack(message, false, false); // Don't requeue problematic messages
    }
  }

  /**
   * Load a model on workers
   * @param {string} modelId - Model identifier
   * @param {Object} params - Optional parameters for loading
   * @returns {Promise<Object>} - Result of the operation
   */
  async loadModel(modelId, params = {}) {
    return this.sendCommand('model.load', { modelId, params });
  }

  /**
   * Unload a model from workers
   * @param {string} modelId - Model identifier
   * @returns {Promise<Object>} - Result of the operation
   */
  async unloadModel(modelId) {
    return this.sendCommand('model.unload', { modelId });
  }

  /**
   * Update a model's configuration on workers
   * @param {string} modelId - Model identifier
   * @param {Object} config - Configuration parameters
   * @returns {Promise<Object>} - Result of the operation
   */
  async updateModelConfig(modelId, config) {
    return this.sendCommand('model.config', { modelId, config });
  }

  /**
   * Get worker status information
   * @param {string} workerId - Optional specific worker ID
   * @returns {Promise<Object>} - Worker status information
   */
  async getWorkerStatus(workerId) {
    const payload = workerId ? { workerId } : {};
    return this.sendCommand('worker.status', payload, true);
  }

  /**
   * Restart a worker
   * @param {string} workerId - Worker identifier
   * @returns {Promise<Object>} - Result of the operation
   */
  async restartWorker(workerId) {
    return this.sendCommand('worker.restart', { workerId });
  }

  /**
   * Send an administrative command to workers
   * @param {string} action - Command action
   * @param {Object} payload - Command payload
   * @param {boolean} expectResponse - Whether to wait for response
   * @returns {Promise<Object>} - Result of the operation
   */
  async sendCommand(action, payload = {}, expectResponse = false) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const messageId = uuidv4();
    const message = {
      messageId,
      action,
      serverId: config.server.id,
      timestamp: Date.now(),
      ...payload
    };
    
    logger.info(`Sending admin command: ${action}, messageId: ${messageId}`);
    
    try {
      // Set up response handler if expecting a response
      let responsePromise = null;
      
      if (expectResponse) {
        responsePromise = new Promise((resolve, reject) => {
          // Store the handler with a timeout
          const timeout = setTimeout(() => {
            this.responseHandlers.delete(messageId);
            reject(new Error(`Command ${action} timed out after 30 seconds`));
          }, 30000);
          
          this.responseHandlers.set(messageId, {
            resolve: (result) => {
              clearTimeout(timeout);
              resolve(result);
            },
            timestamp: Date.now()
          });
        });
      }
      
      // Publish message to exchange with routing key based on action
      await this.channel.publish(
        config.rabbitMq.exchanges.admin,
        action, // Use action as routing key
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      
      logger.debug(`Admin command sent: ${action}, messageId: ${messageId}`);
      
      // Return the response or just the message ID
      if (expectResponse) {
        const response = await responsePromise;
        return response;
      } else {
        return { messageId, sent: true };
      }
    } catch (error) {
      logger.error(`Error sending admin command ${action}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old response handlers that have timed out
   * @private
   */
  _cleanupHandlers() {
    const now = Date.now();
    const expirationTime = 60000; // 1 minute
    
    for (const [messageId, handler] of this.responseHandlers.entries()) {
      if (now - handler.timestamp > expirationTime) {
        this.responseHandlers.delete(messageId);
        logger.debug(`Cleaned up expired handler for message ${messageId}`);
      }
    }
  }

  /**
   * Shutdown the worker manager
   */
  async shutdown() {
    if (this.channel) {
      try {
        // Cancel consumer
        await this.channel.cancel();
        logger.info('Stopped consuming admin responses');
        
        this.initialized = false;
      } catch (error) {
        logger.error(`Error shutting down worker manager: ${error.message}`);
      }
    }
  }
}

// Create a singleton instance
const workerManager = new WorkerManager();

module.exports = workerManager;