import 'reflect-metadata';
import {AppDB} from "./app.db";
import {injectable} from "tsyringe";
import {Model} from "@holokai/types/entities";

@injectable()
export class ModelDB {
    constructor(private db: AppDB) {

    }

    async list(): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE enabled = true
              AND available = true
            ORDER BY name
        `;
        return this.db.systemQuery<Model>(query);
    }

    async get(name: string): Promise<Model | null> {
        const query = `SELECT *
                       FROM models
                       WHERE name = $1
                         AND available = true
                         AND enabled = true`;
        return this.db.systemQueryOne<Model>(query, [name]);
    }

    async getById(id: string): Promise<Model | null> {
        const query = `
            SELECT *
            FROM models
            WHERE id = $1 AND active = true
        `;
        return this.db.systemQueryOne<Model>(query, [id]);
    }

    async listByProvider(providerId: string): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE provider_id = $1 AND active = true
            ORDER BY name
        `;
        return this.db.systemQuery<Model>(query, [providerId]);
    }

    async listByOrganization(orgId: string): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE organization_id = $1 AND active = true
            ORDER BY name
        `;
        return this.db.systemQuery<Model>(query, [orgId]);
    }

    async listPaginated(filters: {
        org_id?: string; provider_id?: string; search?: string;
    }, limit: number, offset: number, sortBy: string, sortDir: string): Promise<{ rows: Model[]; total: number }> {
        const conditions: string[] = ['active = true'];
        const params: any[] = [];
        let idx = 1;

        if (filters.org_id) { conditions.push(`organization_id = $${idx++}`); params.push(filters.org_id); }
        if (filters.provider_id) { conditions.push(`provider_id = $${idx++}`); params.push(filters.provider_id); }
        if (filters.search) { conditions.push(`(name ILIKE $${idx} OR access_model ILIKE $${idx})`); params.push(`%${filters.search}%`); idx++; }

        const where = conditions.join(' AND ');
        const allowedSorts = new Set(['name', 'access_model', 'created_at', 'updated_at']);
        const col = allowedSorts.has(sortBy) ? sortBy : 'created_at';
        const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const limitIdx = idx++;
        const offsetIdx = idx++;
        return this.db.asSystem(async (client) => {
            const [rowsResult, countResult] = await Promise.all([
                client.query(`SELECT * FROM models WHERE ${where} ORDER BY ${col} ${dir} LIMIT $${limitIdx} OFFSET $${offsetIdx}`, [...params, limit, offset]),
                client.query(`SELECT COUNT(*)::text as count FROM models WHERE ${where}`, params),
            ]);
            return {
                rows: rowsResult.rows as Model[],
                total: parseInt(countResult.rows[0]?.count ?? '0'),
            };
        });
    }

    async create(model: Omit<Model, 'id' | 'created_at' | 'updated_at'>): Promise<Model | null> {
        return this.db.systemQueryOne<Model>(
            `INSERT INTO models (name, access_model, provider_id, organization_id, version, description, context_length, modalities, parameters, metadata, pricing_per_tokens, benchmarks, customization, enabled, available, deleted, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [model.name, model.access_model ?? null, model.provider_id, model.organization_id, model.version,
             model.description ?? null, model.context_length ?? null, JSON.stringify(model.modalities ?? []),
             JSON.stringify(model.parameters), JSON.stringify(model.metadata),
             JSON.stringify(model.pricing_per_tokens ?? {}), JSON.stringify(model.benchmarks ?? {}),
             JSON.stringify(model.customization ?? {}), model.enabled, model.available, model.deleted, model.active]
        );
    }

    async update(id: string, fields: Partial<Model>): Promise<Model | null> {
        const sets: string[] = [];
        const params: any[] = [];
        let idx = 1;

        const simple: (keyof Model)[] = ['name', 'access_model', 'version', 'description', 'context_length', 'enabled', 'available', 'provider_id'];
        for (const key of simple) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(fields[key]); }
        }
        const json: (keyof Model)[] = ['modalities', 'parameters', 'metadata', 'pricing_per_tokens', 'benchmarks', 'customization'];
        for (const key of json) {
            if (fields[key] !== undefined) { sets.push(`${key} = $${idx++}`); params.push(JSON.stringify(fields[key])); }
        }

        if (sets.length === 0) return this.db.systemQueryOne<Model>(`SELECT * FROM models WHERE id = $1`, [id]);

        sets.push(`updated_at = now()`);
        params.push(id);
        return this.db.systemQueryOne<Model>(`UPDATE models SET ${sets.join(', ')} WHERE id = $${idx} AND active = true RETURNING *`, params);
    }

    async softDelete(id: string): Promise<boolean> {
        const result = await this.db.systemQueryOne<Model>(`UPDATE models SET active = false, deleted = true, updated_at = now() WHERE id = $1 RETURNING id`, [id]);
        return result !== null;
    }
}
