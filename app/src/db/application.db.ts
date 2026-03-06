import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import type {Application} from '@holokai/types/entities';

const POPULATED_APPLICATION_QUERY = `
    SELECT a.*,
           row_to_json(p.*)           AS provider,
           (SELECT coalesce(json_agg(m.*), '[]'::json)
            FROM models m
                     JOIN application_models am ON m.id = am.model_id
            WHERE am.application_id = a.id
              AND m.active = true)    AS models,
           row_to_json(sp.*)          AS system_prompt,
           (SELECT coalesce(json_agg(gp.*), '[]'::json)
            FROM prompts gp
                     JOIN application_guards ag ON gp.id = ag.prompt_id
            WHERE ag.application_id = a.id
              AND gp.active = true)   AS guards,
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

@injectable()
export class ApplicationDB {
    constructor(private db: AppDB) {}

    async getById(id: string): Promise<Application | null> {
        return this.db.queryOne<Application>(POPULATED_APPLICATION_QUERY + ` AND a.id = $1`, [id]);
    }

    async getBySlug(orgId: string, urlSlug: string): Promise<Application | null> {
        return this.db.queryOne<Application>(
            POPULATED_APPLICATION_QUERY + ` AND a.organization_id = $1 AND a.url_slug = $2`,
            [orgId, urlSlug],
        );
    }

    async getBySlugUnscoped(urlSlug: string): Promise<Application | null> {
        return this.db.queryOne<Application>(POPULATED_APPLICATION_QUERY + ` AND a.url_slug = $1`, [urlSlug]);
    }

    async getAllByOrg(orgId: string): Promise<Application[]> {
        return this.db.query<Application>(POPULATED_APPLICATION_QUERY + ` AND a.organization_id = $1 ORDER BY a.name`, [orgId]);
    }
}
