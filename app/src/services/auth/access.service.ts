import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AccessDB} from '../../db';
import {RedisService} from "../redis.service";
import {BaseEntityService} from "../entities";

@injectable()
export class AccessService extends BaseEntityService<any> {
    constructor(
        private accessDB: AccessDB,
        redis: RedisService,
    ) {
        super(redis, {prefix: 'access', ttl: 120});
    }

    async hasAccess(orgId: string, userId: string, applicationId: string): Promise<boolean> {
        const key = `${this.config.prefix}:${userId}:${applicationId}`;
        const cached = await this.redis.get<boolean>(key);
        if (cached !== null) return cached;

        const result = await this.accessDB.hasAccess(orgId, userId, applicationId);
        await this.redis.set(key, result, this.config.ttl);
        return result;
    }

    async hasModelAccess(orgId: string, userId: string, applicationId: string, accessModel: string): Promise<boolean> {
        const key = `${this.config.prefix}:model:${userId}:${applicationId}:${accessModel}`;
        const cached = await this.redis.get<boolean>(key);
        if (cached !== null) return cached;

        const result = await this.accessDB.hasModelAccess(orgId, userId, applicationId, accessModel);
        await this.redis.set(key, result, this.config.ttl);
        return result;
    }

    async getAccessibleApplicationIds(userId: string, orgId: string): Promise<string[]> {
        return await this.cached(`${this.config.prefix}:${userId}:org:${orgId}`,
            () => this.accessDB.getAccessibleApplicationIds(userId, orgId)) ?? [];
    }

    async getUserEmailById(orgId: string, userId: string): Promise<string | null> {
        return this.cached(`${this.config.prefix}:userId:${userId}`,
            () => this.accessDB.getUserEmailById(orgId, userId));
    }

    async getUserIdByEmail(orgId: string, email: string): Promise<string | null> {
        return this.cached(`${this.config.prefix}:email:${email.trim().toLowerCase()}`,
            () => this.accessDB.getUserIdByEmail(orgId, email.trim()));
    }

    async invalidateUser(userId: string): Promise<void> {
        const keys = await this.redis.keys(`${this.config.prefix}:${userId}:*`);
        for (const key of keys) await this.redis.del(key);
    }

    async invalidateEmail(email: string): Promise<void> {
        await this.redis.del(`${this.config.prefix}:email:${email.trim().toLowerCase()}`);
    }
}
