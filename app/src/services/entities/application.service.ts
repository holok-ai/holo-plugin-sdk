import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ApplicationDB} from '../../db';
import {BaseEntityService} from './base.entity.service';
import type {Application} from '@holokai/types/entities';
import {RedisService} from "../redis.service";

@injectable()
export class ApplicationService extends BaseEntityService<Application> {
    constructor(
        redis: RedisService,
        private applicationDB: ApplicationDB,
    ) {
        super(redis, {prefix: 'application', ttl: 120});
    }

    async getBySlug(orgId: string, urlSlug: string): Promise<Application | null> {
        return this.cached(this.key(orgId, urlSlug), () => this.applicationDB.getBySlug(orgId, urlSlug));
    }

    async getBySlugs(orgId: string, slugs: string[]): Promise<Application[]> {
        const results: Application[] = [];
        for (const slug of slugs) {
            const app = await this.getBySlug(orgId, slug);
            if (app) results.push(app);
        }
        return results;
    }

    async getById(applicationId: string): Promise<Application | null> {
        return this.cached(`app:id:${applicationId}`, () => this.applicationDB.getById(applicationId));
    }

    async getBySlugUnscoped(urlSlug: string): Promise<Application | null> {
        return this.cached(`app:slug:${urlSlug}`, () => this.applicationDB.getBySlugUnscoped(urlSlug));
    }

    override async invalidate(id: string, orgId: string): Promise<void> {
        await super.invalidate(id, orgId);
        const authKeys = await this.redis.keys(`auth:*:${id}`);
        for (const key of authKeys) await this.redis.del(key);
    }

    async getAllByOrg(orgId: string): Promise<Application[]> {
        return this.applicationDB.getAllByOrg(orgId);
    }
}
