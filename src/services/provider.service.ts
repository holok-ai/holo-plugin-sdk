import 'reflect-metadata';
import {ClaudeProvider, OllamaProvider, OpenAIProvider} from "../providers";
import logger from "../utils/logger";
import {Provider} from "../db/types";
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";
import {ProviderType} from "../providers/types";
import {ResponseService} from "./response.service";
import {PerplexityProvider} from "../providers/perplexity/perplexity.provider";
import {IProvider} from "../providers/ai.provider";
import {ProviderPluginRegistry} from "./plugin/provider-registry.service";
import type {ProviderConfig} from "@holokai/common/provider";

@injectable()
export class ProviderService {
    private aiProviders: Map<string, IProvider> = new Map();

    constructor(
        private providerDB: ProviderDB,
        private responseService: ResponseService,
        private providerPluginRegistry: ProviderPluginRegistry) {

    }

    async init(serverId: string): Promise<void> {
        await this.refreshAvailableProviders(serverId);
    }

    async getProviders(): Promise<Provider[]> {
        return this.providerDB.list();
    }

    async refreshAvailableProviders(serverId: string) {
        const providers: Provider[] = await this.getProviders();
        logger.debug(`Refreshing available providers: ${providers.map(p => p.name)}`);
        if (providers.length === 0) return;
        let aiProvider;
        for (const provider of providers) {
            switch (provider.type) {
                case ProviderType.OPENAI:
                    // Try to load from plugin system first
                    aiProvider = await this.loadProviderFromPlugin('openai', provider);
                    if (!aiProvider) {
                        // Fallback to legacy provider
                        logger.warn(`OpenAI plugin not found, using legacy provider`);
                        aiProvider = new OpenAIProvider(provider, this.responseService, serverId);
                    }
                    break;
                case ProviderType.CLAUDE:
                    aiProvider = new ClaudeProvider(provider, this.responseService, serverId);
                    break;
                case ProviderType.OLLAMA:
                    aiProvider = new OllamaProvider(provider, this.responseService, serverId);
                    break;
                case ProviderType.PERPLEXITY:
                    aiProvider = new PerplexityProvider(provider, this.responseService, serverId);
                    break;
                default:
                    break;
            }
            if (!aiProvider) {
                logger.warn(`No provider found for ${provider.name} (${provider.id}) with type ${provider.type}. Skipping...`);
                continue;
            }
            await aiProvider.init();
            this.aiProviders.set(provider.type, aiProvider);
        }
        logger.debug(`Available providers: ${Array.from(this.aiProviders.keys())}`);
    }

    private async loadProviderFromPlugin(providerType: string, provider: Provider): Promise<IProvider | null> {
        const plugin = this.providerPluginRegistry.getByProviderType(providerType);
        if (!plugin) {
            logger.debug(`No plugin found for provider type: ${providerType}`);
            return null;
        }

        logger.info(`Loading ${providerType} provider from plugin: ${plugin.manifest.name}`);

        // Convert legacy Provider to PluginConfig
        const pluginConfig: ProviderConfig = {
            id: provider.id,
            provider_type: providerType,
            api_key: provider.config.apiKey || '',
            base_url: provider.config.baseUrl,
            model: provider.config.model || 'gpt-4'
        };

        // Create provider instance from plugin
        const providerInstance = await plugin.createProvider(pluginConfig);

        logger.info(`Successfully loaded ${providerType} provider from plugin`);
        return providerInstance as unknown as IProvider;
    }

    async matchProvider(key: string): Promise<IProvider | undefined> {
        return this.aiProviders.get(key);
    }
}
