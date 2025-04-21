const { Transform } = require('stream');
const consumer = require('../queue/consumer');
const { config } = require('../config/config');
const logger = require('./logger');

/**
 * Transform stream for handling LLM response chunks
 */
class ResponseTransform extends Transform {
  constructor(requestId) {
    super({ objectMode: true });
    this.requestId = requestId;
    this.consumerId = null;
    this.channelClosed = false;
    this.setupConsumer();
  }

  /**
   * Set up a consumer for this request's response messages
   */
  async setupConsumer() {
    try {
      // Initialize the RabbitMQ consumer
      await consumer.init();
      
      // Create a unique consumer for this response stream
      this.consumerId = `response-${this.requestId}`;
      
      const channel = await consumer.channel;
      
      // Create a temporary queue for this response stream
      const { queue } = await channel.assertQueue('', { 
        exclusive: true, 
        autoDelete: true 
      });
      
      // Bind to the response exchange with the request ID as routing key
      await channel.bindQueue(queue, config.rabbitMq.exchanges.llmResponses, '');
      
      // Start consuming from the temporary queue
      await channel.consume(queue, (message) => {
        if (!message) {
          return;
        }
        
        try {
          // Parse message content
          const content = JSON.parse(message.content.toString());
          
          // Only process messages for this request
          if (content.requestId === this.requestId) {
            // Process message based on type
            switch (content.type) {
              case 'token':
                // Format the SSE message for tokens
                this.push(`data: ${JSON.stringify(content)}\n\n`);
                break;
                
              case 'done':
                // Send final message and end stream
                this.push(`data: ${JSON.stringify(content)}\n\n`);
                this.push(`data: [DONE]\n\n`);
                this.end();
                break;
                
              case 'error':
                // Send error message and end stream
                this.push(`data: ${JSON.stringify(content)}\n\n`);
                this.push(`data: [DONE]\n\n`);
                this.end();
                break;
                
              default:
                logger.warn(`Unknown message type: ${content.type}`);
            }
          }
          
          // Acknowledge the message
          channel.ack(message);
        } catch (error) {
          logger.error(`Error processing response message: ${error.message}`);
          channel.ack(message);
        }
      }, { noAck: false });
      
      logger.info(`Response stream setup for request ${this.requestId}`);
    } catch (error) {
      logger.error(`Error setting up response stream: ${error.message}`);
      this.emit('error', error);
    }
  }

  /**
   * Transform implementation (required by Transform stream)
   */
  _transform(chunk, encoding, callback) {
    // This simply passes data through, actual processing is in setupConsumer
    callback(null, chunk);
  }

  /**
   * Clean up resources when stream is ending
   */
  _final(callback) {
    // Clean up RabbitMQ resources when stream ends
    if (this.consumerId && !this.channelClosed) {
      try {
        this.channelClosed = true;
        logger.info(`Closing response stream for request ${this.requestId}`);
      } catch (error) {
        logger.error(`Error closing response stream: ${error.message}`);
      }
    }
    
    callback();
  }
}

/**
 * Create a response stream for a request
 * @param {string} requestId - Request ID
 * @returns {Transform} - Response stream
 */
function createResponseStream(requestId) {
  return new ResponseTransform(requestId);
}

module.exports = {
  createResponseStream
};
