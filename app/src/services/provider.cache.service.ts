import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {RedisService} from '../admin/services/redis.service';
import {ProviderDB} from '../db/provider.db';
import {BaseEntityCacheService} from './base.entity.cache.service';
import type {Provider} from '@holokai/types/entities';

@injectable()
export class ProviderCacheService extends BaseEntityCacheService<Provider> {
    constructor(
        redis: RedisService,
        private providerDB: ProviderDB,
    ) {
        super(redis, {prefix: 'provider', ttl: 300});
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
