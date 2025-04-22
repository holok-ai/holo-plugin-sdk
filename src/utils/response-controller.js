const { config } = require('../config/config');
const logger = require('./logger');
const consumer = require('../queue/consumer');
const { Transform } = require('stream');

/**
 * Response stream for transforming LLM tokens into SSE
 */
class ResponseStream extends Transform {
  constructor(requestId) {
    super({ objectMode: true });
    this.requestId = requestId;
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
}

/**
 * Central controller for managing all response streams
 * Uses a single consumer for the response queue
 */
class ResponseController {
  constructor() {
    this.activeStreams = new Map();
    this.initialized = false;
    this.channel = null;
  }

  /**
   * Initialize the response controller and set up the shared consumer
   */
  async init() {
    if (this.initialized) return;

    try {
      // Initialize RabbitMQ consumer
      await consumer.init();
      this.channel = consumer.channel;
      
      // Set up a single consumer for all responses
      const queue = config.rabbitMq.queues.llmResponses;
      
      await this.channel.consume(queue, (message) => {
        if (!message) return;
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          const { requestId } = content;
          
          // Find the corresponding response stream
          const stream = this.activeStreams.get(requestId);
          
          if (stream) {
            // Process message based on type
            switch (content.type) {
              case 'token':
                // Send token to the stream
                stream.push(`data: ${JSON.stringify(content)}\n\n`);
                break;
                
              case 'done':
                // Send final message and mark as completed
                stream.push(`data: ${JSON.stringify(content)}\n\n`);
                stream.push(`data: [DONE]\n\n`);
                stream.end();
                this.removeStream(requestId);
                break;
                
              case 'error':
                // Send error and end stream
                stream.push(`data: ${JSON.stringify(content)}\n\n`);
                stream.push(`data: [DONE]\n\n`);
                stream.end();
                this.removeStream(requestId);
                break;
              
              default:
                logger.warn(`Unknown message type: ${content.type}`);
            }
          } else {
            logger.warn(`Received response for unknown request: ${requestId}`);
          }
          
          // Acknowledge the message
          this.channel.ack(message);
        } catch (error) {
          logger.error(`Error processing response: ${error.message}`);
          this.channel.ack(message); // Still ack to avoid blocking queue
        }
      }, { noAck: false });
      
      this.initialized = true;
      logger.info('Response controller initialized with shared consumer');
    } catch (error) {
      logger.error(`Failed to initialize response controller: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a response stream for a request
   * @param {string} requestId - Request ID
   * @returns {Transform} - Response stream
   */
  async createResponseStream(requestId) {
    // Ensure controller is initialized fully before proceeding
    if (!this.initialized) {
      await this.init();
    }
    
    // Special case for initialization only
    if (requestId === 'init') {
      logger.info('Response controller initialized');
      return null;
    }
    
    // Create a new transform stream for this request
    const responseStream = new ResponseStream(requestId);
    
    // Store the stream in the map
    this.activeStreams.set(requestId, responseStream);
    
    // Set up auto-cleanup on stream end or error
    responseStream.on('end', () => this.removeStream(requestId));
    responseStream.on('error', () => this.removeStream(requestId));
    
    logger.info(`Created response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
    return responseStream;
  }

  /**
   * Remove a response stream
   * @param {string} requestId - Request ID
   */
  removeStream(requestId) {
    if (this.activeStreams.has(requestId)) {
      this.activeStreams.delete(requestId);
      logger.info(`Removed response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
    }
  }

  /**
   * Get the number of active streams
   * @returns {number} - Count of active streams
   */
  get activeStreamCount() {
    return this.activeStreams.size;
  }
}

// Create a singleton instance
const responseController = new ResponseController();

module.exports = {
  createResponseStream: async (requestId) => await responseController.createResponseStream(requestId),
  getActiveStreamCount: () => responseController.activeStreamCount
};