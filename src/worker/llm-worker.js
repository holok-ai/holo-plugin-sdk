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
    
    // Initialize handlers for different request types
    this.handlers = {
      'generate': this.handleGenerateRequest.bind(this),
      'chat': this.handleChatRequest.bind(this)
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
      
      // Register handlers
      Object.entries(this.handlers).forEach(([type, handler]) => {
        consumer.registerHandler(type, handler);
      });
      
      // Start consuming from the request queue
      await consumer.consume(config.rabbitMq.queues.llmRequests);
      
      logger.info(`LLM worker ${this.workerId} initialized and ready to process requests`);
    } catch (error) {
      logger.error(`Failed to initialize LLM worker: ${error.message}`);
      throw error;
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
    
    try {
      // Extract parameters
      const { model, prompt, options, stream } = payload;
      
      // Get appropriate LLM provider
      const llmProvider = await this.getLLMProvider(request);
      
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
          this.sendResponseChunk(id, {
            type: 'done',
            response: chunk,
            requestId: id, 
          }, sourceId);
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
    }
  }

  /**
   * Handle a chat completion request
   * @param {object} request - Request data
   */
  async handleChatRequest(request) {
    const { id, sourceId, payload } = request;
    logger.info(`Worker ${this.workerId} handling chat request: ${id} from server ${sourceId}`);
    
    try {
      // Extract parameters
      const { model, messages, options, stream } = payload;
      
      if (!stream) {
        // Non-streaming response (not implemented yet)
        throw new Error('Non-streaming responses not implemented');
      }
      
      // Get appropriate LLM provider
      const llmProvider = await this.getLLMProvider(request);
      
      // Process chat using the provider
      await llmProvider.chat(
        { model, messages, options },
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
        (metadata = {}) => {
          this.sendResponseChunk(id, {
            type: 'done',
            requestId: id,
            // OpenAI compatible format
            model,
            finish_reason: metadata.finish_reason || 'stop'
          }, sourceId);
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
    }
  }

  /**
   * Send a response chunk
   * @param {string} requestId - Request ID
   * @param {object} data - Response data
   */
  async sendResponseChunk(requestId, data, sourceId) {
    try {
      // Send to the response exchange with the source server ID as routing key
      await producer.sendToExchange(
        config.rabbitMq.exchanges.llmResponses,
        sourceId, // Use source ID as routing key
        data,
        { correlationId: requestId }
      );
      
      logger.debug(`Sent response chunk for ${requestId} to server ${sourceId}`);
    } catch (error) {
      logger.error(`Error sending response chunk for ${requestId}: ${error.message}`);
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
