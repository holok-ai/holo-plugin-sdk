import type {IProvider, ProviderCapabilities as ProviderFeatures} from '../provider/types.js';
import {IPlugin} from "./base";

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
export interface IProviderPlugin<TProvider = IProvider> extends IPlugin {
    /**
     * Create a provider instance with the given configuration.
     * @param config Provider configuration including API keys and model settings.
     * @returns Promise resolving to a provider instance.
     */
    createProvider(config: any): Promise<TProvider>;

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
