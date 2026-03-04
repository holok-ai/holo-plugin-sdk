import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {RedisService} from '../admin/services/redis.service';
import {AppDB} from '../db/app.db';
import {BaseEntityCacheService} from './base.entity.cache.service';
import type {Application} from '@holokai/types/entities';

@injectable()
export class ApplicationService extends BaseEntityCacheService<Application> {
    constructor(
        redis: RedisService,
        private db: AppDB,
    ) {
        super(redis, {prefix: 'application', ttl: 120});
    }

    async getBySlug(orgId: string, urlSlug: string): Promise<Application | null> {
        return this.cached(this.key(orgId, urlSlug), () => this.queryBySlug(orgId, urlSlug));
    }

    async getBySlugs(orgId: string, slugs: string[]): Promise<Application[]> {
        const results: Application[] = [];
        for (const slug of slugs) {
            const app = await this.getBySlug(orgId, slug);
            if (app) results.push(app);
        }
        return results;
    }

    async getAllByOrg(orgId: string): Promise<Application[]> {
        return this.db.query<Application>(POPULATED_APPLICATION_QUERY + ` AND a.organization_id = $1 ORDER BY a.name`, [orgId]);
    }

    private async queryBySlug(orgId: string, urlSlug: string): Promise<Application | null> {
        return this.db.queryOne<Application>(
            POPULATED_APPLICATION_QUERY + ` AND a.organization_id = $1 AND a.url_slug = $2`,
            [orgId, urlSlug],
        );
    }
}

const POPULATED_APPLICATION_QUERY = `
    SELECT a.*,
           row_to_json(p.*) AS provider,
           (SELECT coalesce(json_agg(m.*), '[]'::json)
            FROM models m
                     JOIN application_models am ON m.id = am.model_id
            WHERE am.application_id = a.id
              AND m.active = true) AS models,
           row_to_json(sp.*) AS system_prompt,
           (SELECT coalesce(json_agg(gp.*), '[]'::json)
            FROM prompts gp
                     JOIN application_guards ag ON gp.id = ag.prompt_id
            WHERE ag.application_id = a.id
              AND gp.active = true) AS guards,
           (SELECT coalesce(json_agg(e.*), '[]'::json)
            FROM evaluators e
                     JOIN evaluator_applications ea ON e.id = ea.evaluator_id
            WHERE ea.application_id = a.id
              AND e.enabled = true
              AND e.available = true) AS evaluators
    FROM applications a
             JOIN providers p ON a.provider_id = p.id
             LEFT JOIN prompts sp ON a.system_prompt_id = sp.id
    WHERE a.active = true
`;
