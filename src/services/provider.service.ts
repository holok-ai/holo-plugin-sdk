import 'reflect-metadata';
import {ProviderDB, ProviderWithCredential} from "../db/provider.db";
import {injectable} from "tsyringe";
import {ClassLogger, IProvider} from "@holokai/sdk";
import {ProviderPluginRegistry} from "./plugin/provider-registry.service";
import {Provider} from "@holokai/sdk/dist/core/entities";
import {CryptoService} from "./crypto.service";

@injectable()
export class ProviderService extends ClassLogger {
    private providers: Map<string, IProvider> = new Map();
    serverId: string | undefined;

    constructor(
        private providerRegistry: ProviderPluginRegistry,
        private providerDB: ProviderDB,
        private cryptoService: CryptoService
    ) {
        super();

    }

    async init(serverId: string): Promise<void> {
        this.serverId = serverId;
        const logger = this.mlog(this.init);
        const plugins = this.providerRegistry.listPlugins();
        logger.debug(`Registered plugins: ${plugins.map(p => `${p.manifest.name}@${p.manifest.version}`).join(', ')}`);
        await this.refreshAvailableProviders();
    }

    async getProviders(): Promise<ProviderWithCredential[]> {
        return this.providerDB.list();
    }

    get availableProviders(): string[] {
        return this.providers.keys().toArray();
    }

    async refreshAvailableProviders() {
        const logger = this.mlog(this.refreshAvailableProviders);
        const providers = await this.getProviders();
        logger.debug(`Refreshing available providers: ${providers.map(p => p.name)}`);
        if (providers.length === 0) return;
        for (const provider of providers) {
            let plugin = this.providerRegistry.getByFamily(provider.type);
            if (plugin) {
                try {
                    const cleanConfig = this.sanitizeConfig(provider.config);
                    const configWithApiKey = await this.decryptAndInjectApiKey(provider, cleanConfig);
                    let p = await plugin.createProvider(configWithApiKey);
                    this.providers.set(provider.name, p);
                } catch (e) {
                    logger.error(e);
                    logger.error(`Error while creating provider ${provider.name}, config: ${JSON.stringify(provider.config)}`);
                }
            } else {
                logger.warn(`Unable to find plugin for provider ${provider.name}`);
            }
        }
        logger.debug(`Available providers: ${Array.from(this.providers.keys())}`);
    }

    private async decryptAndInjectApiKey(
        provider: ProviderWithCredential,
        config: Record<string, any>
    ): Promise<Record<string, any>> {
        const logger = this.mlog(this.decryptAndInjectApiKey);

        if (!provider.encrypted_value || !provider.initialization_vector) {
            logger.debug(`No encrypted credentials for provider ${provider.name}`);
            return config;
        }

        try {
            const decryptedApiKey = this.cryptoService.decrypt(
                provider.encrypted_value,
                provider.initialization_vector
            );
            return {
                ...config,
                apiKey: decryptedApiKey
            };
        } catch (error) {
            logger.error(`Failed to decrypt API key for provider ${provider.name}: ${(error as Error).message}`);
            throw new Error(`Failed to decrypt API key for provider ${provider.name}`);
        }
    }

    private sanitizeConfig(config: Record<string, any>): Record<string, any> {
        return Object.entries(config).reduce((acc, [key, value]) => {
            // Exclude null, undefined, and empty strings to use provider SDK defaults
            if (value != null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
    }

    async matchProvider(name: string): Promise<IProvider> {
        const logger = this.mlog(this.matchProvider);
        const provider = this.providers.get(name);

        if (!provider) {
            logger.error(`Provider ${name} not found. Available providers: ${JSON.stringify(this.providers, null, 2)}`);
            throw new Error(`Provider ${name} not found`);
        }

        return provider;
    }
}
