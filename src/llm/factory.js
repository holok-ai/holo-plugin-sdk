const logger = require('../utils/logger');
const { config } = require('../config/config');
const MockProvider = require('./providers/mock-provider');

/**
 * Factory class for creating LLM provider instances
 */
class LLMProviderFactory {
  constructor() {
    this.providers = {}; // Cache for provider instances
    this.defaultProviderName = config.llm?.provider || 'mock';
    this.availableProviders = {
      'mock': () => require('./providers/mock-provider'),
      'ollama': () => require('./providers/ollama-provider'),
      'claude': () => require('./providers/claude-provider'),
      'openai': () => require('./providers/openai-provider')
    };
  }

  /**
   * Get a specific LLM provider instance
   * @param {string} providerName - The name of the provider to get (uses default if not specified)
   * @returns {Promise<LLMProviderInterface>} Provider instance
   */
  async getProvider(providerName = null) {
    // Use the specified provider name or fall back to default
    const name = providerName || this.defaultProviderName;
    
    // Return cached provider if available
    if (this.providers[name]) {
      return this.providers[name];
    }
    
    try {
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
      this.providers[name] = provider;
      
      logger.info(`LLM provider '${name}' initialized`);
      return provider;
    } catch (error) {
      logger.error(`Failed to initialize LLM provider '${name}': ${error.message}`);
      
      // Fall back to mock provider if the requested one fails and it's not already mock
      if (name !== 'mock') {
        logger.info('Falling back to mock provider');
        return this.getProvider('mock');
      }
      
      // If even the mock provider fails, create a basic instance
      const mockProvider = new MockProvider();
      this.providers['mock'] = mockProvider;
      return mockProvider;
    }
  }

  /**
   * Get a list of available models from a specific provider
   * @param {string} providerName - The name of the provider to get models from
   * @returns {Promise<Array>} List of available models
   */
  async getModels(providerName = null) {
    const provider = await this.getProvider(providerName);
    return provider.getModels();
  }

  /**
   * Get a list of all available providers
   * @returns {Array<string>} List of available provider names
   */
  getAvailableProviders() {
    return Object.keys(this.availableProviders);
  }

  /**
   * Clear the entire provider cache or a specific provider
   * @param {string} providerName - Optional specific provider to clear from cache
   */
  clearCache(providerName = null) {
    if (providerName) {
      delete this.providers[providerName];
    } else {
      this.providers = {};
    }
  }
}

// Create a singleton instance
const factory = new LLMProviderFactory();
module.exports = factory;