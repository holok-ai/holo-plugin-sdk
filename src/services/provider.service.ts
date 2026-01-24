import 'reflect-metadata';
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";
import {ClassLogger, IProvider} from "@holokai/sdk";
import {ProviderPluginRegistry} from "./plugin/provider-registry.service";
import {Provider} from "@holokai/sdk/dist/core/entities";

@injectable()
export class ProviderService extends ClassLogger {
    private providers: Map<string, IProvider> = new Map();

    constructor(
        private providerRegistry: ProviderPluginRegistry,
        private providerDB: ProviderDB) {
        super();

    }

    async init(serverId: string): Promise<void> {
        const logger = this.mlog(this.init);
        const plugins = this.providerRegistry.listPlugins();
        logger.debug(`Registered plugins: ${plugins.map(p => `${p.manifest.name}@${p.manifest.version}`).join(', ')}`);
        await this.refreshAvailableProviders(serverId);
    }

    async getProviders(): Promise<Provider[]> {
        return this.providerDB.list();
    }

    async refreshAvailableProviders(_serverId: string) {
        const logger = this.mlog(this.refreshAvailableProviders);
        const providers: Provider[] = await this.getProviders();
        logger.debug(`Refreshing available providers: ${providers.map(p => p.name)}`);
        if (providers.length === 0) return;
        for (const provider of providers) {
            let plugin = this.providerRegistry.getByFamily(provider.type);
            if (plugin) {
                try {
                    let p = await plugin.createProvider(provider.config);
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
}
