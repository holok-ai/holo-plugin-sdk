import {IPlugin} from './index.js';
import type {ProviderCapabilities as ProviderFeatures, ProviderConfig} from '../provider/types.js';

/**
 * Provider plugin interface for LLM integrations.
 * @template TProvider The type of provider instance created by this plugin.
 *
 * @example
 * ```typescript
 * class OpenAIPlugin
 *   extends BasePlugin
 *   implements IProviderPlugin<OpenAIProvider>
 * {
 *   async createProvider(config: ProviderConfig): Promise<OpenAIProvider> {
 *     return new OpenAIProvider(config);
 *   }
 *
 *   async validateConfig(config: ProviderConfig): Promise<boolean> {
 *     return !!config.api_key && !!config.model;
 *   }
 *
 *   getCapabilities(): ProviderFeatures {
 *     return {
 *       streaming: true,
 *       embedding: true,
 *       vision: true,
 *       function_calling: true,
 *       supported_models: ['gpt-4', 'gpt-3.5-turbo']
 *     };
 *   }
 *
 *   getSupportedModels(): string[] {
 *     return this.getCapabilities().supported_models;
 *   }
 * }
 * ```
 */
export interface IProviderPlugin<TProvider = unknown> extends IPlugin {
    /**
     * Create a provider instance with the given configuration.
     * @param config Provider configuration including API keys and model settings.
     * @returns Promise resolving to a provider instance.
     */
    createProvider(config: ProviderConfig): Promise<TProvider>;

    /**
     * Validate provider configuration.
     * @param config Configuration to validate.
     * @returns Promise resolving to true if valid, false otherwise.
     */
    validateConfig(config: ProviderConfig): Promise<boolean>;

    /**
     * Get provider capabilities.
     * @returns Provider capabilities including supported features and models.
     */
    getCapabilities(): ProviderFeatures;

    /**
     * Get list of supported models.
     * @returns Array of supported model identifiers.
     */
    getSupportedModels(): string[];
}