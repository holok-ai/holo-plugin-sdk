const LLMProviderInterface = require('../provider-interface');
const logger = require('../../utils/logger');
const { Anthropic } = require('@anthropic-ai/sdk');

/**
 * Claude provider for connecting to Anthropic's Claude API
 */
class ClaudeProvider extends LLMProviderInterface {
  constructor(config = {}) {
    super();
    this.config = {
      apiKey: process.env.ANTHROPIC_API_KEY || config.apiKey,
      ...config
    };
    
    this.client = null;
    
    // Available models (these are just for reference, actual models come from the API)
    this.models = {
      'claude-3-opus-20240229': {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus'
      },
      'claude-3-sonnet-20240229': {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet'
      },
      'claude-3-haiku-20240307': {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku'
      },
      'claude-2.1': {
        id: 'claude-2.1',
        name: 'Claude 2.1'
      },
      'claude-2.0': {
        id: 'claude-2.0',
        name: 'Claude 2.0'
      },
      'claude-instant-1.2': {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2'
      },
      'claude-3-5-sonnet-latest': {
        id: 'claude-3-5-sonnet-latest',
        name: 'Claude 3.5 Latest'
      }
    };
  }

  /**
   * Initialize the provider
   */
  async init() {
    try {
      if (!this.config.apiKey) {
        throw new Error('Anthropic API key is required');
      }
      
      // Initialize the client
      this.client = new Anthropic({
        apiKey: this.config.apiKey
      });
      
      logger.info('Claude provider initialized');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Claude provider: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      // Return pre-defined models
      // For a production system, we would call the Anthropic API to get current models
      return Object.values(this.models).map(model => ({
        id: model.id,
        name: model.name,
        modified_at: new Date().toISOString()
      }));
    } catch (error) {
      logger.error(`Error fetching Claude models: ${error.message}`);
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
      
      // Convert text generation to chat format for Claude API
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
      logger.error(`Claude generate error: ${error.message}`);
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
        max_tokens: options.max_tokens || 4096,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        top_p: options.top_p !== undefined ? options.top_p : 0.9,
        top_k: options.top_k,
        stop_sequences: options.stop || []
      };
      
      // Handle streaming response
      if (stream) {
        const messageStream = await this.client.messages.create({
          ...requestParams,
          messages,
          stream: true
        });
        
        for await (const chunk of messageStream) {
          // Pass the raw chunk directly to the onToken callback
          onToken(chunk);
        }
        
        // Call onComplete
        onComplete({
          type: 'message',
          model,
          status: 'complete'
        });
      } else {
        // Handle non-streaming response
        const response = await this.client.messages.create({
          ...requestParams,
          messages,
          stream: false
        });
        
        // Call onComplete with the full response
        onComplete(response);
      }
    } catch (error) {
      logger.error(`Claude chat error: ${error.message}`);
      onError(error);
    }
  }

  /**
   * The following methods are not typically supported by cloud API providers
   * but are included to satisfy the interface.
   */
  
  async loadModel() {
    logger.info('Model loading is not supported for Claude API');
    return { status: 'not_supported' };
  }

  async unloadModel() {
    logger.info('Model unloading is not supported for Claude API');
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

module.exports = ClaudeProvider;