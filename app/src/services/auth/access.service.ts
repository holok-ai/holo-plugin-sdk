import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClassLogger} from '@holokai/sdk';
import {AccessDB} from '../../db';
import {RedisService} from "../redis.service";

const CACHE_TTL = 120;
const CACHE_PREFIX = 'access';

@injectable()
export class AccessService extends ClassLogger {
    constructor(
        private accessDB: AccessDB,
        private redis: RedisService,
    ) {
        super();
    }

    async hasAccess(userId: string, applicationId: string): Promise<boolean> {
        const key = `${CACHE_PREFIX}:${userId}:${applicationId}`;
        const cached = await this.redis.get<boolean>(key);
        if (cached !== null) return cached;

        const result = await this.accessDB.hasAccess(userId, applicationId);
        await this.redis.set(key, result, CACHE_TTL);
        return result;
    }

    async getAccessibleApplicationIds(userId: string, orgId: string): Promise<string[]> {
        const key = `${CACHE_PREFIX}:${userId}:org:${orgId}`;
        const cached = await this.redis.get<string[]>(key);
        if (cached) return cached;

        const result = await this.accessDB.getAccessibleApplicationIds(userId, orgId);
        await this.redis.set(key, result, CACHE_TTL);
        return result;
    }

    async invalidateUser(userId: string): Promise<void> {
        const keys = await this.redis.keys(`${CACHE_PREFIX}:${userId}:*`);
        for (const key of keys) await this.redis.del(key);
    }
}
