const LLMProviderInterface = require('../provider-interface');
const logger = require('../../utils/logger');
const OpenAI = require('openai');

/**
 * OpenAI provider for connecting to OpenAI API
 */
class OpenAIProvider extends LLMProviderInterface {
  constructor(config = {}) {
    super();
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || config.apiKey,
      ...config
    };
    
    this.client = null;
    
    // Available models (these are just for reference, actual models come from the API)
    this.models = {
      'gpt-4o': {
        id: 'gpt-4o',
        name: 'GPT-4o'
      },
      'gpt-4-turbo': {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo'
      },
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4'
      },
      'gpt-3.5-turbo': {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo'
      }
    };
  }

  /**
   * Initialize the provider
   */
  async init() {
    try {
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key is required');
      }
      
      // Initialize the client
      this.client = new OpenAI({
        apiKey: this.config.apiKey
      });
      
      logger.info('OpenAI provider initialized');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize OpenAI provider: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      if (!this.client) {
        await this.init();
      }
      
      // For a production system, we would call the OpenAI API to get current models
      // const response = await this.client.models.list();
      // return response.data.map(model => ({ id: model.id, name: model.id }));
      
      // For now, return pre-defined models
      return Object.values(this.models).map(model => ({
        id: model.id,
        name: model.name,
        modified_at: new Date().toISOString()
      }));
    } catch (error) {
      logger.error(`Error fetching OpenAI models: ${error.message}`);
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
      const { model, prompt, options = {}, stream = true } = params;
      
      // Check if model exists
      if (!this.models[model]) {
        throw new Error(`Model ${model} not found`);
      }
      
      // Convert text generation to chat format for OpenAI API
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];
      
      // Delegate to chat implementation
      await this.chat(
        { model, messages, options, stream },
        onToken,
        onComplete,
        onError
      );
    } catch (error) {
      logger.error(`OpenAI generate error: ${error.message}`);
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
      if (!this.client) {
        await this.init();
      }
      
      const { model, messages, options = {}, stream = true } = params;
      
      // Check if model exists
      if (!this.models[model]) {
        throw new Error(`Model ${model} not found`);
      }
      
      // Prepare request parameters
      const requestParams = {
        model,
        messages,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop,
        ...options
      };
      
      // Handle streaming response
      if (stream) {
        const stream = await this.client.chat.completions.create({
          ...requestParams,
          stream: true
        });
        
        for await (const chunk of stream) {
          // Pass the raw chunk directly to the onToken callback
          onToken(chunk);
        }
        
        // Call onComplete
        onComplete({
          type: 'chat.completion',
          model,
          status: 'complete'
        });
      } else {
        // Handle non-streaming response
        const response = await this.client.chat.completions.create({
          ...requestParams,
          stream: false
        });
        
        // Call onComplete with the full response
        onComplete(response);
      }
    } catch (error) {
      logger.error(`OpenAI chat error: ${error.message}`);
      onError(error);
    }
  }

  /**
   * The following methods are not typically supported by cloud API providers
   * but are included to satisfy the interface.
   */
  
  async loadModel() {
    logger.info('Model loading is not supported for OpenAI API');
    return { status: 'not_supported' };
  }

  async unloadModel() {
    logger.info('Model unloading is not supported for OpenAI API');
    return { status: 'not_supported' };
  }

  async getModelStatus(modelId) {
    const modelInfo = this.models[modelId];
    if (!modelInfo) {
      return { status: 'not_found' };
    }
    return { status: 'available', info: modelInfo };
  }

  async getModelDetails(modelId) {
    const modelInfo = this.models[modelId];
    if (!modelInfo) {
      return { status: 'not_found' };
    }
    return modelInfo;
  }
}

module.exports = OpenAIProvider;