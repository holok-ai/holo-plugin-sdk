const consumer = require('../queue/consumer');
const producer = require('../queue/producer');
const { config } = require('../config/config');
const logger = require('../utils/logger');

/**
 * Mock LLM implementation that generates fake responses
 */
class MockLLM {
  constructor() {
    this.models = {
      'mock-llama2-7b': {
        name: 'Llama 2 7B',
        tokenRate: 20, // tokens per second
      },
      'mock-mistral-7b': {
        name: 'Mistral 7B',
        tokenRate: 25, // tokens per second
      }
    };
  }

  /**
   * Generate a response token by token
   * @param {object} params - Generation parameters
   * @param {function} onToken - Callback for each token
   * @param {function} onComplete - Callback when generation is complete
   */
  async generate(params, onToken, onComplete) {
    const { model, prompt } = params;
    
    // Check if model exists
    if (!this.models[model]) {
      throw new Error(`Model ${model} not found`);
    }
    
    // Generate a mock response based on the prompt
    const modelInfo = this.models[model];
    const responseText = this.createMockResponse(prompt);
    const tokens = this.tokenize(responseText);
    
    logger.info(`Generating response with ${tokens.length} tokens using model ${model}`);
    
    // Stream tokens with a delay to simulate real LLM generation
    let tokenIndex = 0;
    const tokenDelay = 1000 / modelInfo.tokenRate;
    
    const streamTokens = () => {
      if (tokenIndex < tokens.length) {
        const token = tokens[tokenIndex];
        onToken(token);
        tokenIndex++;
        
        setTimeout(streamTokens, tokenDelay);
      } else {
        // All tokens streamed
        onComplete();
      }
    };
    
    // Start streaming
    streamTokens();
  }

  /**
   * Create a mock response based on the prompt
   * @param {string} prompt - Input prompt
   * @returns {string} - Generated response
   */
  createMockResponse(prompt) {
    // This is a very simple mock implementation
    // In a real scenario, this would call an actual LLM
    
    const responses = [
      "I'm a mock LLM response. This is simulating what an actual LLM would generate. The system is working correctly if you're seeing this streaming token by token.",
      
      "Based on your request, I can provide the following information. Please note that this is a mock response to test the proxy server's functionality. In a production environment, this would be replaced with a real LLM response.",
      
      "Here's a demonstration of the streaming capability of this proxy server. Each token is being sent individually through RabbitMQ and then streamed back to you via Server-Sent Events (SSE). This allows for a realistic experience similar to what you'd get with a direct connection to an LLM API.",
      
      "The architecture we've implemented allows for horizontal scaling of worker nodes. Each request is processed by an available worker, which means you can add more workers as demand increases without modifying the API layer."
    ];
    
    // Select a response based on a hash of the prompt
    const hash = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const responseIndex = hash % responses.length;
    
    return responses[responseIndex];
  }

  /**
   * Simple tokenizer that splits text into words
   * @param {string} text - Input text
   * @returns {Array<string>} - Array of tokens
   */
  tokenize(text) {
    // This is a very simplistic tokenization
    // Real LLMs use subword tokenization like BPE, WordPiece, etc.
    return text.split(/\b/).filter(token => token.trim().length > 0);
  }
}

/**
 * Worker class that processes LLM requests
 */
class LLMWorker {
  constructor() {
    this.mockLLM = new MockLLM();
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
   * Handle a generate text request
   * @param {object} request - Request data
   */
  async handleGenerateRequest(request) {
    const { id, payload } = request;
    logger.info(`Worker ${this.workerId} handling generate request: ${id}`);
    
    try {
      // Extract parameters
      const { model, prompt, options } = payload;
      
      // Process generation
      await this.mockLLM.generate(
        { model, prompt, options },
        // On token callback
        (token) => {
          this.sendResponseChunk(id, {
            type: 'token',
            token,
            requestId: id
          });
        },
        // On complete callback
        () => {
          this.sendResponseChunk(id, {
            type: 'done',
            requestId: id
          });
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
      });
    }
  }

  /**
   * Handle a chat completion request
   * @param {object} request - Request data
   */
  async handleChatRequest(request) {
    const { id, payload } = request;
    logger.info(`Worker ${this.workerId} handling chat request: ${id}`);
    
    try {
      // Extract parameters
      const { model, messages, options, stream } = payload;
      
      // Get the last message content as prompt
      const lastMessage = messages[messages.length - 1];
      const prompt = lastMessage.content;
      
      if (stream) {
        // Stream response tokens
        await this.mockLLM.generate(
          { model, prompt, options },
          // On token callback
          (token) => {
            this.sendResponseChunk(id, {
              type: 'token',
              token,
              requestId: id,
              // OpenAI compatible format
              delta: {
                content: token
              },
              model
            });
          },
          // On complete callback
          () => {
            this.sendResponseChunk(id, {
              type: 'done',
              requestId: id,
              // OpenAI compatible format
              model,
              finish_reason: 'stop'
            });
          }
        );
      } else {
        // Non-streaming response (not implemented yet)
        throw new Error('Non-streaming responses not implemented');
      }
    } catch (error) {
      logger.error(`Error processing chat request ${id}: ${error.message}`);
      
      // Send error response
      this.sendResponseChunk(id, {
        type: 'error',
        error: {
          message: error.message
        },
        requestId: id
      });
    }
  }

  /**
   * Send a response chunk
   * @param {string} requestId - Request ID
   * @param {object} data - Response data
   */
  async sendResponseChunk(requestId, data) {
    try {
      await producer.sendToExchange(
        config.rabbitMq.exchanges.llmResponses,
        '',
        data,
        { correlationId: requestId }
      );
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
