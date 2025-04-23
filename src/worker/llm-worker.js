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
      
      // Get appropriate LLM provider
      const llmProvider = await this.getLLMProvider(request);
      
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
