const logger = require('../utils/logger');
const { config } = require('../config/config');
const MockProvider = require('./providers/mock-provider');

/**
 * Factory class for creating LLM provider instances
 */
class LLMProviderFactory {
  constructor() {
    this.provider = null;
    this.providerName = config.llm?.provider || 'mock';
    this.availableProviders = {
      'mock': () => require('./providers/mock-provider'),
      'ollama': () => require('./providers/ollama-provider')
    };
  }

  /**
   * Get the configured LLM provider instance
   * @returns {Promise<LLMProviderInterface>} Provider instance
   */
  async getProvider() {
    // Return cached provider if available
    if (this.provider) {
      return this.provider;
    }
    
    try {
      const name = this.providerName;
      
      // Get provider configuration
      const providerSettings = config.llm?.providers?.[name] || {};
      
      // Check if the provider is supported
      if (!this.availableProviders[name]) {
        throw new Error(`Unknown LLM provider: ${name}`);
      }
      
      // Dynamically require the provider module
      const ProviderModule = this.availableProviders[name]();
      const provider = new ProviderModule(providerSettings);
      
      // Initialize the provider
      await provider.init();
      
      // Cache the provider instance
      this.provider = provider;
      
      logger.info(`LLM provider '${name}' initialized`);
      return provider;
    } catch (error) {
      logger.error(`Failed to initialize LLM provider '${this.providerName}': ${error.message}`);
      
      // Fall back to mock provider if the requested one fails
      if (this.providerName !== 'mock') {
        logger.info('Falling back to mock provider');
        this.providerName = 'mock';
        return this.getProvider();
      }
      
      // If even the mock provider fails, create a basic instance
      const mockProvider = new MockProvider();
      this.provider = mockProvider;
      return mockProvider;
    }
  }

  /**
   * Get a list of available models from the configured provider
   * @returns {Promise<Array>} List of available models
   */
  async getModels() {
    const provider = await this.getProvider();
    return provider.getModels();
  }

  /**
   * Clear provider cache to force re-initialization
   */
  clearCache() {
    this.provider = null;
  }
}

// Create a singleton instance
const factory = new LLMProviderFactory();
module.exports = factory;