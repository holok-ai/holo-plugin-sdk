import 'reflect-metadata';
import {ClassLogger} from '@holokai/sdk';
import {RedisService} from "../redis.service";


export interface EntityCacheConfig {
    prefix: string;
    ttl: number;
}

export abstract class BaseEntityService<T> extends ClassLogger {
    protected constructor(
        protected redis: RedisService,
        protected config: EntityCacheConfig,
    ) {
        super();
    }

    protected async cached(key: string, query: () => Promise<T | null>): Promise<T | null> {
        const cached = await this.redis.get<T>(key);
        if (cached) {
            this.log.info(`Cache ${key}: true`);
            return cached;
        }

        const result = await query();
        if (!result) return null;

        await this.redis.set(key, result, this.config.ttl);
        return result;
    }

    async invalidate(id: string, orgId: string): Promise<void> {
        const logger = this.mlog(this.invalidate);
        logger.info(`Invalidating ${this.config.prefix}:${id} for org ${orgId}`);
        await this.redis.del(this.key(orgId, id));
    }

    async invalidateByOrg(orgId: string): Promise<void> {
        const keys = await this.redis.keys(this.key(orgId, '*'));
        for (const key of keys) await this.redis.del(key);
    }

    protected key(orgId: string, suffix: string): string {
        return `org:${orgId}:${this.config.prefix}:${suffix}`;
    }
}
