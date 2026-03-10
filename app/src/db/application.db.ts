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

    async listPaginated(filters: {
        org_id?: string; provider_id?: string; search?: string;
    }, limit: number, offset: number, sortBy: string, sortDir: string): Promise<{ rows: Application[]; total: number }> {
        const conditions: string[] = ['a.active = true'];
        const params: any[] = [];
        let idx = 1;

        if (filters.org_id) { conditions.push(`a.organization_id = $${idx++}`); params.push(filters.org_id); }
        if (filters.provider_id) { conditions.push(`a.provider_id = $${idx++}`); params.push(filters.provider_id); }
        if (filters.search) { conditions.push(`(a.name ILIKE $${idx} OR a.url_slug ILIKE $${idx})`); params.push(`%${filters.search}%`); idx++; }

        const where = conditions.join(' AND ');
        const allowedSorts = new Set(['name', 'url_slug', 'created_at', 'updated_at']);
        const col = allowedSorts.has(sortBy) ? sortBy : 'created_at';
        const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const [rows, countResult] = await Promise.all([
            this.db.query<Application>(
                `SELECT a.*, row_to_json(p.*) AS provider
                 FROM applications a JOIN providers p ON a.provider_id = p.id
                 WHERE ${where} ORDER BY a.${col} ${dir} LIMIT $${idx++} OFFSET $${idx++}`,
                [...params, limit, offset]
            ),
            this.db.queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM applications a WHERE ${where}`, params),
        ]);
        return {rows, total: parseInt(countResult?.count ?? '0')};
    }

    async create(app: Record<string, any>): Promise<Application | null> {
        return this.db.queryOne<Application>(
            `INSERT INTO applications (organization_id, name, url_slug, description, provider_id, system_prompt_id, enabled, available, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
             RETURNING *`,
            [app.organization_id, app.name, app.url_slug, app.description ?? null,
             app.provider_id, app.system_prompt_id ?? null, app.enabled ?? true, app.available ?? true]
        );
    }

    async update(id: string, fields: Record<string, any>): Promise<Application | null> {
        const sets: string[] = [];
        const params: any[] = [];
        let idx = 1;

        const updatable = ['name', 'url_slug', 'description', 'provider_id', 'system_prompt_id', 'enabled', 'available'];
        for (const key of updatable) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }

        if (sets.length === 0) return this.getById(id);

        sets.push(`updated_at = now()`);
        params.push(id);
        return this.db.queryOne<Application>(`UPDATE applications SET ${sets.join(', ')} WHERE id = $${idx} AND active = true RETURNING *`, params);
    }

    async softDelete(id: string): Promise<boolean> {
        const result = await this.db.queryOne<Application>(`UPDATE applications SET active = false, updated_at = now() WHERE id = $1 RETURNING id`, [id]);
        return result !== null;
    }
}
