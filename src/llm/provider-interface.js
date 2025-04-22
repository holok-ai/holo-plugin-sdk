/**
 * Base interface for LLM providers
 * All LLM implementations must implement these methods
 */
class LLMProviderInterface {
  /**
   * Initialize the provider
   */
  async init() {
    throw new Error('Method not implemented');
  }

  /**
   * Get available models from the provider
   * @returns {Promise<Array>} Array of available models
   */
  async getModels() {
    throw new Error('Method not implemented');
  }

  /**
   * Generate text from a prompt with streaming
   * @param {object} params - Generation parameters
   * @param {string} params.model - Model to use
   * @param {string} params.prompt - Input prompt
   * @param {object} params.options - Model-specific options
   * @param {function} onToken - Callback for each token
   * @param {function} onComplete - Callback when generation is complete
   * @param {function} onError - Callback for errors
   */
  async generate(params, onToken, onComplete, onError) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate chat completion with streaming
   * @param {object} params - Generation parameters
   * @param {string} params.model - Model to use
   * @param {Array<object>} params.messages - Chat messages
   * @param {object} params.options - Model-specific options
   * @param {function} onToken - Callback for each token
   * @param {function} onComplete - Callback when generation is complete
   * @param {function} onError - Callback for errors
   */
  async chat(params, onToken, onComplete, onError) {
    throw new Error('Method not implemented');
  }

  /**
   * Validate if model exists
   * @param {string} model - Model name
   * @returns {Promise<boolean>} Whether model exists
   */
  async validateModel(model) {
    const models = await this.getModels();
    return models.some(m => m.id === model);
  }
}

module.exports = LLMProviderInterface;