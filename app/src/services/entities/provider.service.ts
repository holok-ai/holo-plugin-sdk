import 'reflect-metadata';
import {ProviderDB, ProviderWithCredential} from "../../db/provider.db";
import {injectable} from "tsyringe";
import {BaseEntityService} from "./base.entity.service";
import {Provider} from "@holokai/types";
import {RedisService} from "../redis.service";

@injectable()
export class ProviderService extends BaseEntityService<Provider> {
    serverId: string | undefined;

    constructor(
        private providerDB: ProviderDB,
        redis: RedisService,
    ) {
        super(redis, {prefix: 'provider', ttl: 300});
    }

    async getProviders(): Promise<ProviderWithCredential[]> {
        return this.providerDB.list();
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

    async findByPluginId(pluginId: string): Promise<ProviderWithCredential[]> {
        return this.providerDB.findByPluginId(pluginId);
    }

    async migrateToLatestPlugin(family: string, latestPluginId: string): Promise<number> {
        return this.providerDB.migrateToLatestPlugin(family, latestPluginId);
    }

    async findByPluginFamily(family: string, excludePluginId?: string): Promise<ProviderWithCredential[]> {
        return this.providerDB.findByPluginFamily(family, excludePluginId);
    }
}
