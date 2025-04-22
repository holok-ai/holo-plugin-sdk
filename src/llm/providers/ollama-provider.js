const LLMProviderInterface = require('../provider-interface');
const logger = require('../../utils/logger');
const { Ollama } = require('ollama');

/**
 * Ollama provider for connecting to Ollama API
 */
class OllamaProvider extends LLMProviderInterface {
  constructor(config = {}) {
    super();
    this.config = {
      baseUrl: 'http://localhost:11434',
      timeout: 60000,
      ...config
    };
    this.ollama = null;
  }

  /**
   * Initialize the provider
   */
  async init() {
    try {
      // Initialize the Ollama client
      this.ollama = new Ollama({
        host: this.config.baseUrl
      });
      
      // Test connection by fetching models
      await this.getModels();
      
      logger.info(`Ollama provider initialized at ${this.config.baseUrl}`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Ollama provider: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available models from Ollama
   */
  async getModels() {
    try {
      if (!this.ollama) {
        await this.init();
      }
      
      const response = await this.ollama.list();
      
      // Map to common format
      return response.models.map(model => ({
        id: model.name,
        name: model.name,
        modified_at: new Date().toISOString(),
        size: model.size || 0
      }));
    } catch (error) {
      logger.error(`Error fetching Ollama models: ${error.message}`);
      throw error;
    }
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
      if (!this.ollama) {
        await this.init();
      }
      
      const { model, prompt, options = {}, stream } = params;
      let streaming = stream;
      // Map options to Ollama format
      const ollamaOptions = {
        model,
        prompt,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          top_k: options.top_k,
          num_predict: options.max_tokens,
          stop: options.stop,
          ...options
        },
        stream
      };
      let fullResponse = '';
      const response = await this.ollama.generate(ollamaOptions);
      if(streaming) {
        // Use Ollama streaming API
        
        for await (const chunk of response) {
          if (chunk.done) {
            onComplete(fullResponse, chunk);
            break;
          }
          
          const token = chunk.response;
          fullResponse += token;
          
          if (token) {
            onToken(chunk);
          }
        }
      }
      else{
        logger.info(JSON.stringify(response));
        onComplete(response.response, response);
      }
      
      logger.info(`Generated response with Ollama model ${model}, length: ${fullResponse.length}`);
    } catch (error) {
      logger.error(`Ollama generate error: ${error.message}`);
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
      if (!this.ollama) {
        await this.init();
      }
      
      const { model, messages, options = {} } = params;
      
      // Map options to Ollama format
      const ollamaOptions = {
        model,
        messages,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          top_k: options.top_k,
          num_predict: options.max_tokens,
          stop: options.stop,
          ...options
        },
        stream: true
      };
      
      // Use Ollama chat API
      const stream = await this.ollama.chat(ollamaOptions);
      
      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.done) {
          onComplete({
            model,
            finish_reason: 'stop'
          });
          break;
        }
        
        // Get the content from the assistant's message
        const token = chunk.message?.content || '';
        fullResponse += token;
        
        if (token) {
          // Format in OpenAI compatible delta format
          onToken(token, {
            delta: {
              content: token
            },
            model
          });
        }
      }
      
      logger.info(`Generated chat response with Ollama model ${model}, length: ${fullResponse.length}`);
    } catch (error) {
      logger.error(`Ollama chat error: ${error.message}`);
      onError(error);
    }
  }
}

module.exports = OllamaProvider;