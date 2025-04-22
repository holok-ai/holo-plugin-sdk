const LLMProviderInterface = require('../provider-interface');
const logger = require('../../utils/logger');

/**
 * Mock LLM provider for testing and development
 */
class MockProvider extends LLMProviderInterface {
  constructor(config = {}) {
    super();
    this.config = config;
    this.models = {
      'mock-llama2-7b': {
        id: 'mock-llama2-7b',
        name: 'Llama 2 7B',
        tokenRate: 20, // tokens per second
      },
      'mock-mistral-7b': {
        id: 'mock-mistral-7b',
        name: 'Mistral 7B',
        tokenRate: 25, // tokens per second
      }
    };
  }

  /**
   * Initialize the provider
   */
  async init() {
    logger.info('Mock LLM provider initialized');
    return true;
  }

  /**
   * Get available models
   */
  async getModels() {
    return Object.values(this.models).map(model => ({
      id: model.id,
      name: model.name,
      modified_at: new Date().toISOString(),
      size: 7000000000
    }));
  }

  /**
   * Generate text from a prompt with streaming
   * @param {object} params - Generation parameters
   * @param {function} onToken - Callback for each token
   * @param {function} onComplete - Callback when generation is complete
   * @param {function} onError - Callback for errors
   */
  async generate(params, onToken, onComplete, onError) {
    try {
      const { model, prompt, options } = params;
      
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
    } catch (error) {
      logger.error(`MockProvider generate error: ${error.message}`);
      onError(error);
    }
  }

  /**
   * Generate chat completion with streaming
   * @param {object} params - Generation parameters
   * @param {function} onToken - Callback for each token
   * @param {function} onComplete - Callback when generation is complete
   * @param {function} onError - Callback for errors
   */
  async chat(params, onToken, onComplete, onError) {
    try {
      const { model, messages, options } = params;
      
      // Check if model exists
      if (!this.models[model]) {
        throw new Error(`Model ${model} not found`);
      }
      
      // Get the last message content as prompt
      const lastMessage = messages[messages.length - 1];
      const prompt = lastMessage.content;
      
      // Generate a mock response based on the prompt
      const modelInfo = this.models[model];
      const responseText = this.createMockResponse(prompt);
      const tokens = this.tokenize(responseText);
      
      logger.info(`Generating chat response with ${tokens.length} tokens using model ${model}`);
      
      // Stream tokens with a delay to simulate real LLM generation
      let tokenIndex = 0;
      const tokenDelay = 1000 / modelInfo.tokenRate;
      
      const streamTokens = () => {
        if (tokenIndex < tokens.length) {
          const token = tokens[tokenIndex];
          
          // Use OpenAI compatible delta format
          onToken(token, {
            delta: {
              content: token
            },
            model
          });
          
          tokenIndex++;
          setTimeout(streamTokens, tokenDelay);
        } else {
          // All tokens streamed
          onComplete({
            model,
            finish_reason: 'stop'
          });
        }
      };
      
      // Start streaming
      streamTokens();
    } catch (error) {
      logger.error(`MockProvider chat error: ${error.message}`);
      onError(error);
    }
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

module.exports = MockProvider;