import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger, sanitizeObject} from "@holokai/sdk";
import {IProvider, IProviderPlugin} from "@holokai/types";
import {ProviderService} from "../entities";
import {ProviderWithCredential} from "../../db/provider.db";
import {CryptoService} from "../auth";

@injectable()
export class ProviderImplService extends ClassLogger {

    private providerImpls: Map<string, IProvider> = new Map();

    constructor(
        private providerService: ProviderService,
        private cryptoService: CryptoService
    ) {
        super();
    }


    async createProviderImpls(pluginId: string, plugin: IProviderPlugin) {
        const logger = this.mlog(this.createProviderImpls);
        const providers = await this.providerService.findByPluginId(pluginId);
        logger.debug(`Creating provider impls for ${plugin.name}:${plugin.version}: ${providers.map(p => p.name)}`);
        if (providers.length === 0) return;
        for (const provider of providers) {
            const cleanConfig = sanitizeObject(provider.config);
            const configWithApiKey = await this.decryptAndInjectApiKey(provider, cleanConfig);
            let p = await plugin.createProvider(
                provider.id,
                provider.name,
                configWithApiKey);
            this.providerImpls.set(provider.id, p);
        }
    }

    async getProviderImplById(id: string): Promise<IProvider> {
        const logger = this.mlog(this.getProviderImplById);
        const provider = this.providerImpls.get(id);

        if (!provider) {
            logger.error(`Provider ${id} not found. Available providers: ${JSON.stringify(this.providerImpls, null, 2)}`);
            throw new Error(`Provider ${id} not found`);
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
}