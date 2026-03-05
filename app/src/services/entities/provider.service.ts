import 'reflect-metadata';
import {ProviderDB, ProviderWithCredential} from "../../db/provider.db";
import {injectable} from "tsyringe";
import type {IProvider} from "@holokai/types/provider";
import {ProviderPluginRegistry} from "../plugin/provider.registry.service";
import {CryptoService} from "../auth/crypto.service";
import {BaseEntityService} from "./base.entity.service";
import {Provider} from "@holokai/types";
import {RedisService} from "../redis.service";

@injectable()
export class ProviderService extends BaseEntityService<Provider>{
    serverId: string | undefined;
    private providers: Map<string, IProvider> = new Map();

    constructor(
        private providerRegistry: ProviderPluginRegistry,
        private providerDB: ProviderDB,
        redis: RedisService,
        private cryptoService: CryptoService
    ) {
        super(redis, {prefix: 'provider', ttl: 300});
    }

    get availableProviders(): string[] {
        return this.providers.keys().toArray();
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

    async matchProvider(name: string): Promise<IProvider> {
        const logger = this.mlog(this.matchProvider);
        const provider = this.providers.get(name);

        if (!provider) {
            logger.error(`Provider ${name} not found. Available providers: ${JSON.stringify(this.providers, null, 2)}`);
            throw new Error(`Provider ${name} not found`);
        }

        return provider;
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

    async getByName(orgId: string, providerName: string): Promise<Provider | null> {
        return this.cached(this.key(orgId, `name:${providerName}`), async () => {
            const provider = await this.providerDB.get(providerName);
            return (provider && provider.organization_id === orgId) ? provider : null;
        });
    }

    async getById(id: string): Promise<Provider | null> {
        return this.cached(`provider:${id}`, () => this.providerDB.getById(id));
    }
}
