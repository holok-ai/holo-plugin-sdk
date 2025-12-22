import 'reflect-metadata';
import {ProviderDB} from "../db";
import {injectable} from "tsyringe";
import {ClassLogger, IProvider, Provider} from "@holokai/sdk";
import {ProviderPluginRegistry} from "./plugin/provider-registry.service";

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
        // let aiProvider;
        // for (const provider of providers) {
        //     if (!aiProvider) {
        //         logger.warn(`No provider found for ${provider.name} (${provider.id}) with type ${provider.type}. Skipping...`);
        //         continue;
        //     }
        //     await aiProvider.init();
        //     this.providers.set(provider.type, aiProvider);
        // }
        logger.debug(`Available providers: ${Array.from(this.providers.keys())}`);
    }

    async matchProvider(key: string): Promise<IProvider | undefined> {
        return this.providers.get(key);
    }
}
