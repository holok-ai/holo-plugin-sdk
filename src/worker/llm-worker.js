const consumer = require('../queue/consumer');
const producer = require('../queue/producer');
const { config } = require('../config/config');
const logger = require('../utils/logger');
const llmFactory = require('../llm/factory');

/**
 * Worker class that processes LLM requests
 */
class LLMWorker {
  constructor() {
    this.workerId = `worker-${Math.random().toString(36).substr(2, 9)}`;
    
    // Worker stats
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      processingTime: {
        generate: 0,
        chat: 0
      },
      requestsProcessed: {
        generate: 0,
        chat: 0
      },
      errors: 0,
      activeModels: []
    };
    
    // Initialize handlers for different request types
    this.handlers = {
      'generate': this.handleGenerateRequest.bind(this),
      'chat': this.handleChatRequest.bind(this)
    };
    
    // Initialize admin command handlers
    this.adminHandlers = {
      'model.load': this.handleModelLoad.bind(this),
      'model.unload': this.handleModelUnload.bind(this),
      'model.config': this.handleModelConfig.bind(this),
      'worker.status': this.handleWorkerStatus.bind(this),
      'worker.restart': this.handleWorkerRestart.bind(this)
    };
  }

  /**
   * Initialize the worker
   */
  async init() {
    try {
      // Initialize producer and consumer
      await producer.init();
      await consumer.init();
      
      // Register handlers for LLM requests
      Object.entries(this.handlers).forEach(([type, handler]) => {
        consumer.registerHandler(type, handler);
      });
      
      // Start consuming from the request queue
      await consumer.consume(config.rabbitMq.queues.llmRequests);
      
      // Setup admin commands
      await this.setupAdminCommands();
      
      // Initialize models
      await this.initializeModels();
      
      logger.info(`LLM worker ${this.workerId} initialized and ready to process requests`);
    } catch (error) {
      logger.error(`Failed to initialize LLM worker: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up admin command handling
   */
  async setupAdminCommands() {
    try {
      const channel = await consumer.getChannel();
      
      // Assert the admin exchange
      await channel.assertExchange(
        config.rabbitMq.exchanges.admin,
        'topic',
        { durable: true }
      );
      
      // Assert the admin response exchange
      await channel.assertExchange(
        config.rabbitMq.exchanges.adminResponses,
        'direct',
        { durable: true }
      );
      
      // Create worker-specific command queue
      const queueResult = await channel.assertQueue(
        `${config.rabbitMq.queues.adminCommands}_${this.workerId}`,
        {
          exclusive: false,
          durable: true,
          autoDelete: true
        }
      );
      
      this.adminQueue = queueResult.queue;
      logger.info(`Created admin command queue: ${this.adminQueue}`);
      
      // Bind queue to exchange for all relevant routing keys
      await channel.bindQueue(
        this.adminQueue,
        config.rabbitMq.exchanges.admin,
        'model.#'
      );
      
      await channel.bindQueue(
        this.adminQueue,
        config.rabbitMq.exchanges.admin,
        'worker.#'
      );
      
      // Set up consumer for admin commands
      await channel.consume(
        this.adminQueue,
        this.handleAdminCommand.bind(this),
        { noAck: false }
      );
      
      logger.info(`Admin command handling set up successfully`);
    } catch (error) {
      logger.error(`Error setting up admin commands: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Initialize models on startup
   */
  async initializeModels() {
    try {
      // Get all enabled models
      const llmProvider = await this.getLLMProvider();
      const models = await llmProvider.getModels();
      
      // Log model information
      logger.info(`LLM provider reports ${models.length} available models`);
      
      // Store active models in stats
      this.stats.activeModels = models.map(model => ({
        id: model.id,
        name: model.name,
        loaded: true
      }));
      
      return models;
    } catch (error) {
      logger.error(`Error initializing models: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the configured LLM provider
   * @returns {Promise<LLMProviderInterface>} - LLM provider instance
   */
  async getLLMProvider() {
    return llmFactory.getProvider();
  }

  /**
   * Handle a generate text request
   * @param {object} request - Request data
   */
  async handleGenerateRequest(request) {
    const { id, sourceId, payload } = request;
    logger.info(`Worker ${this.workerId} handling generate request: ${id} from server ${sourceId}`);
    
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      // Extract parameters
      const { model, prompt, options, stream } = payload;
      
      // Get appropriate LLM provider
      const llmProvider = await this.getLLMProvider();
      
      // Process generation using the provider
      await llmProvider.generate(
        { model, prompt, options, stream },
        // On token callback
        (token) => {
          this.sendResponseChunk(id, {
            type: 'token',
            token,
            requestId: id
          }, sourceId);
        },
        // On complete callback
        (fullResponse, chunk) => {
          logger.info(`full response: ${fullResponse} final chunk:`+ JSON.stringify(chunk));
          // Include all metrics for audit purposes
          this.sendResponseChunk(id, {
            type: 'done',
            response: chunk,
            requestId: id,
            fullResponse,
            // Extract Ollama metrics and populate them in a standard way
            ...(chunk && typeof chunk === 'object' ? {
              total_duration: chunk.total_duration,
              prompt_eval_count: chunk.prompt_eval_count,
              eval_count: chunk.eval_count,
              eval_duration: chunk.eval_duration
            } : {})
          }, sourceId);
          
          // Update stats
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.stats.processingTime.generate += duration;
          this.stats.requestsProcessed.generate++;
        },
        // On error callback
        (error) => {
          this.sendResponseChunk(id, {
            type: 'error',
            error: {
              message: error.message
            },
            requestId: id
          }, sourceId);
          
          // Update error stats
          this.stats.errors++;
        }
      );
    } catch (error) {
      logger.error(`Error processing generate request ${id}: ${error.message}`);
      
      // Send error response
      this.sendResponseChunk(id, {
        type: 'error',
        error: {
          message: error.message
        },
        requestId: id
      }, sourceId);
      
      // Update error stats
      this.stats.errors++;
    }
  }

  /**
   * Handle a chat completion request
   * @param {object} request - Request data
   */
  async handleChatRequest(request) {
    const { id, sourceId, payload } = request;
    logger.info(`Worker ${this.workerId} handling chat request: ${id} from server ${sourceId}`);
    
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      // Extract parameters
      const { model, messages, options, stream } = payload;
      
      // Get appropriate LLM provider
      const llmProvider = await this.getLLMProvider();
      
      // Process chat using the provider - passing along stream flag
      await llmProvider.chat(
        { model, messages, options, stream },
        // On token callback
        (token, metadata = {}) => {
          this.sendResponseChunk(id, {
            type: 'token',
            token,
            requestId: id,
            // OpenAI compatible format
            delta: metadata.delta || {
              content: token
            },
            model
          }, sourceId);
        },
        // On complete callback
        (response) => {
          // For streaming, response is just metadata
          // For non-streaming, response includes the complete message
          logger.debug(`Chat completion final response: ${JSON.stringify(response)}`);
          this.sendResponseChunk(id, {
            type: 'done',
            requestId: id,
            response: response,
            // Extract Ollama metrics and populate them in a standard way
            ...(response && typeof response === 'object' ? {
              total_duration: response.total_duration,
              prompt_eval_count: response.prompt_eval_count,
              eval_count: response.eval_count,
              eval_duration: response.eval_duration
            } : {})
          }, sourceId);
          
          // Update stats
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.stats.processingTime.chat += duration;
          this.stats.requestsProcessed.chat++;
        },
        // On error callback
        (error) => {
          this.sendResponseChunk(id, {
            type: 'error',
            error: {
              message: error.message
            },
            requestId: id
          }, sourceId);
          
          // Update error stats
          this.stats.errors++;
        }
      );
    } catch (error) {
      logger.error(`Error processing chat request ${id}: ${error.message}`);
      
      // Send error response
      this.sendResponseChunk(id, {
        type: 'error',
        error: {
          message: error.message
        },
        requestId: id
      }, sourceId);
      
      // Update error stats
      this.stats.errors++;
    }
  }

  /**
   * Send a response chunk
   * @param {string} requestId - Request ID
   * @param {object} data - Response data
   */
  async sendResponseChunk(requestId, data, sourceId) {
    try {
      // 1. Send to the response exchange with the source server ID as routing key
      // This goes to the client for streaming display
      await producer.sendToExchange(
        config.rabbitMq.exchanges.llmResponses,
        sourceId, // Use source ID as routing key
        data,
        { correlationId: requestId }
      );
      
      // 2. Also send to the audit queue for logging
      // Add timestamp and worker info to the audit record
      const auditData = {
        ...data,
        timestamp: Date.now(),
        workerId: this.workerId,
        // Add any other metadata needed for auditing
      };
      
      // Send to the response exchange with 'audit' routing key
      await producer.sendToExchange(
        config.rabbitMq.exchanges.llmResponses,
        'audit', // Special routing key for audit service
        auditData,
        { correlationId: requestId }
      );
      
      logger.debug(`Sent response chunk for ${requestId} to server ${sourceId} and audit queue`);
    } catch (error) {
      logger.error(`Error sending response chunk for ${requestId}: ${error.message}`);
    }
  }
  
  /**
   * Handle admin command
   * @param {object} message - RabbitMQ message
   * @private
   */
  async handleAdminCommand(message) {
    if (!message) {
      return;
    }
    
    const channel = await consumer.getChannel();
    
    try {
      const content = JSON.parse(message.content.toString());
      const { messageId, action, serverId, timestamp, ...payload } = content;
      
      logger.info(`Worker ${this.workerId} received admin command: ${action}, messageId: ${messageId}`);
      
      // Find appropriate handler
      const handler = this.adminHandlers[action];
      
      if (!handler) {
        logger.warn(`No handler for admin command: ${action}`);
        
        // Send error response
        await this.sendAdminResponse(messageId, serverId, {
          success: false,
          error: `Unsupported command: ${action}`
        });
        
        channel.ack(message);
        return;
      }
      
      // Execute handler
      const result = await handler(payload);
      
      // Send response
      await this.sendAdminResponse(messageId, serverId, {
        success: true,
        ...result
      });
      
      logger.info(`Processed admin command: ${action}`);
      channel.ack(message);
    } catch (error) {
      logger.error(`Error processing admin command: ${error.message}`);
      
      try {
        // Try to extract messageId and serverId from the message
        const content = JSON.parse(message.content.toString());
        const { messageId, serverId } = content;
        
        // Send error response if we have messageId and serverId
        if (messageId && serverId) {
          await this.sendAdminResponse(messageId, serverId, {
            success: false,
            error: error.message
          });
        }
      } catch {
        // If we can't even parse the message, there's not much we can do
        logger.error(`Could not parse admin command message`);
      }
      
      // Acknowledge the message even if it failed, to prevent redelivery
      channel.ack(message);
    }
  }
  
  /**
   * Send admin command response
   * @param {string} messageId - Original message ID
   * @param {string} serverId - Server ID to route response to
   * @param {object} data - Response data
   */
  async sendAdminResponse(messageId, serverId, data) {
    try {
      await producer.sendToExchange(
        config.rabbitMq.exchanges.adminResponses,
        serverId, // Use server ID as routing key
        {
          messageId,
          workerId: this.workerId,
          timestamp: Date.now(),
          ...data
        }
      );
      
      logger.debug(`Sent admin response for message ${messageId} to server ${serverId}`);
    } catch (error) {
      logger.error(`Error sending admin response: ${error.message}`);
    }
  }
  
  /**
   * Handle model load command
   * @param {object} payload - Command payload
   * @returns {Promise<object>} - Result of the operation
   */
  async handleModelLoad(payload) {
    const { modelId, params } = payload;
    
    try {
      logger.info(`Loading model: ${modelId}`);
      
      const llmProvider = await this.getLLMProvider();
      const result = await llmProvider.loadModel(modelId, params);
      
      // Update active models in stats
      const existingModelIndex = this.stats.activeModels.findIndex(m => m.id === modelId);
      
      if (existingModelIndex >= 0) {
        this.stats.activeModels[existingModelIndex].loaded = true;
      } else {
        this.stats.activeModels.push({
          id: modelId,
          name: modelId.split(':').pop(),
          loaded: true
        });
      }
      
      logger.info(`Successfully loaded model: ${modelId}`);
      
      return {
        modelId,
        status: 'loaded',
        metadata: result
      };
    } catch (error) {
      logger.error(`Error loading model ${modelId}: ${error.message}`);
      
      // Update model status in stats
      const existingModelIndex = this.stats.activeModels.findIndex(m => m.id === modelId);
      
      if (existingModelIndex >= 0) {
        this.stats.activeModels[existingModelIndex].loaded = false;
        this.stats.activeModels[existingModelIndex].error = error.message;
      }
      
      throw error;
    }
  }
  
  /**
   * Handle model unload command
   * @param {object} payload - Command payload
   * @returns {Promise<object>} - Result of the operation
   */
  async handleModelUnload(payload) {
    const { modelId } = payload;
    
    try {
      logger.info(`Unloading model: ${modelId}`);
      
      const llmProvider = await this.getLLMProvider();
      const result = await llmProvider.unloadModel(modelId);
      
      // Update active models in stats
      const existingModelIndex = this.stats.activeModels.findIndex(m => m.id === modelId);
      
      if (existingModelIndex >= 0) {
        this.stats.activeModels[existingModelIndex].loaded = false;
      }
      
      logger.info(`Successfully unloaded model: ${modelId}`);
      
      return {
        modelId,
        status: 'unloaded',
        metadata: result
      };
    } catch (error) {
      logger.error(`Error unloading model ${modelId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Handle model configuration update
   * @param {object} payload - Command payload
   * @returns {Promise<object>} - Result of the operation
   */
  async handleModelConfig(payload) {
    const { modelId, config } = payload;
    
    try {
      logger.info(`Updating config for model: ${modelId}`);
      
      // For now, just log the configuration update
      // In the future, this could be used to modify provider settings
      
      logger.info(`Model ${modelId} configuration updated`);
      
      return {
        modelId,
        status: 'configured',
        config
      };
    } catch (error) {
      logger.error(`Error configuring model ${modelId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Handle worker status request
   * @param {object} payload - Command payload
   * @returns {Promise<object>} - Worker status
   */
  async handleWorkerStatus(payload) {
    try {
      // Calculate uptime
      const uptime = Date.now() - this.stats.startTime;
      
      // Get active connections from consumer
      const activeConnections = await consumer.getActiveConnectionCount();
      
      // Get memory usage
      const memoryUsage = process.memoryUsage();
      
      // Return status information
      return {
        workerId: this.workerId,
        status: 'active',
        uptime,
        stats: this.stats,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        },
        connections: {
          active: activeConnections
        }
      };
    } catch (error) {
      logger.error(`Error getting worker status: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Handle worker restart command
   * @param {object} payload - Command payload
   * @returns {Promise<object>} - Result of the operation
   */
  async handleWorkerRestart(payload) {
    try {
      logger.info(`Received restart command for worker ${this.workerId}`);
      
      // Send success response before shutting down
      const response = {
        workerId: this.workerId,
        status: 'restarting'
      };
      
      // Schedule shutdown after response is sent
      setTimeout(() => {
        logger.info(`Worker ${this.workerId} shutting down after restart command`);
        process.exit(0);
      }, 1000);
      
      return response;
    } catch (error) {
      logger.error(`Error handling restart command: ${error.message}`);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const worker = new LLMWorker();
    await worker.init();
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down worker gracefully');
      await consumer.stop();
      process.exit(0);
    });
    
    logger.info(`Worker started successfully`);
  } catch (error) {
    logger.error(`Failed to start worker: ${error.message}`);
    process.exit(1);
  }
}

// Start the worker
main();