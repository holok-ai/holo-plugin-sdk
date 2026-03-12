import 'reflect-metadata';
import {AppDB} from "./app.db";
import {injectable} from "tsyringe";
import {Provider} from "@holokai/types/entities";

export interface ProviderWithCredential extends Provider {
    encrypted_value?: string;
    initialization_vector?: string;
}

@injectable()
export class ProviderDB {
    constructor(private db: AppDB) {

    }

    async list(): Promise<ProviderWithCredential[]> {
        const query = `
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.enabled = true
              AND p.available = true
            ORDER BY p.name
        `;
        return this.db.systemQuery<ProviderWithCredential>(query);
    }

    async get(name: string): Promise<ProviderWithCredential | null> {
        const query = `
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.name = $1
              AND p.enabled = true
              AND p.available = true
        `;
        return this.db.systemQueryOne<ProviderWithCredential>(query, [name]);
    }

    async getById(id: string): Promise<ProviderWithCredential | null> {
        const query = `
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.id = $1
              AND p.active = true
        `;
        return this.db.systemQueryOne<ProviderWithCredential>(query, [id]);
    }

    async findByPluginId(pluginId: string): Promise<ProviderWithCredential[]> {
        return this.db.systemQuery(`
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.plugin_id = $1
              AND p.active = true
        `, [pluginId])
    }

    async migrateToLatestPlugin(family: string, latestPluginId: string): Promise<number> {
        const result = await this.db.systemQuery(
            `UPDATE providers p
             SET plugin_id = $2, updated_at = now()
             FROM plugins pl
             WHERE p.plugin_id = pl.id
               AND pl.family = $1
               AND pl.version != 'latest'
               AND p.active = true`,
            [family.toUpperCase(), latestPluginId]
        );
        return (result as any).length ?? 0;
    }

    async listPaginated(filters: {
        org_id?: string; enabled?: boolean; search?: string;
    }, limit: number, offset: number, sortBy: string, sortDir: string): Promise<{ rows: Provider[]; total: number }> {
        const conditions: string[] = ['p.active = true'];
        const params: any[] = [];
        let idx = 1;

        if (filters.org_id) { conditions.push(`p.organization_id = $${idx++}`); params.push(filters.org_id); }
        if (filters.enabled !== undefined) { conditions.push(`p.enabled = $${idx++}`); params.push(filters.enabled); }
        if (filters.search) { conditions.push(`p.name ILIKE $${idx++}`); params.push(`%${filters.search}%`); }

        const where = conditions.join(' AND ');
        const allowedSorts = new Set(['name', 'created_at', 'updated_at', 'type']);
        const col = allowedSorts.has(sortBy) ? sortBy : 'created_at';
        const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const limitIdx = idx++;
        const offsetIdx = idx++;
        return this.db.asSystem(async (client) => {
            const [rowsResult, countResult] = await Promise.all([
                client.query(
                    `SELECT p.* FROM providers p WHERE ${where} ORDER BY p.${col} ${dir} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
                    [...params, limit, offset]
                ),
                client.query(
                    `SELECT COUNT(*)::text as count FROM providers p WHERE ${where}`, params
                ),
            ]);
            return {
                rows: rowsResult.rows as Provider[],
                total: parseInt(countResult.rows[0]?.count ?? '0'),
            };
        });
    }

    async create(provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<Provider | null> {
        return this.db.systemQueryOne<Provider>(
            `INSERT INTO providers (organization_id, name, type, description, config, api_credential_id, plugin_id, pricing_plan_id, enabled, available, deleted, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [provider.organization_id, provider.name, provider.type, provider.description ?? null,
             JSON.stringify(provider.config), provider.api_credential_id ?? null, provider.plugin_id,
             provider.pricing_plan_id ?? null, provider.enabled, provider.available, provider.deleted, provider.active]
        );
    }

    async update(id: string, fields: Partial<Provider>): Promise<Provider | null> {
        const sets: string[] = [];
        const params: any[] = [];
        let idx = 1;

        const updatable: (keyof Provider)[] = ['name', 'type', 'description', 'enabled', 'available', 'plugin_id', 'pricing_plan_id', 'api_credential_id'];
        for (const key of updatable) {
            if (fields[key] !== undefined) {
                sets.push(`${key} = $${idx++}`);
                params.push(fields[key]);
            }
        }
        if (fields.config !== undefined) {
            sets.push(`config = $${idx++}`);
            params.push(JSON.stringify(fields.config));
        }

        if (sets.length === 0) return this.db.systemQueryOne<Provider>(`SELECT * FROM providers WHERE id = $1`, [id]);

        sets.push(`updated_at = now()`);
        params.push(id);
        return this.db.systemQueryOne<Provider>(
            `UPDATE providers SET ${sets.join(', ')} WHERE id = $${idx} AND active = true RETURNING *`, params
        );
    }

    async softDelete(id: string): Promise<boolean> {
        const result = await this.db.systemQueryOne<Provider>(
            `UPDATE providers SET active = false, deleted = true, updated_at = now() WHERE id = $1 RETURNING id`, [id]
        );
        return result !== null;
    }

    async findByPluginFamily(family: string, excludePluginId?: string): Promise<ProviderWithCredential[]> {
        if (excludePluginId) {
            return this.db.systemQuery(`
                SELECT p.*, ac.encrypted_value, ac.initialization_vector
                FROM providers p
                    LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
                    JOIN plugins pl ON p.plugin_id = pl.id
                WHERE pl.family = $1
                  AND p.plugin_id != $2
                  AND p.active = true
            `, [family.toUpperCase(), excludePluginId]);
        }
        return this.db.systemQuery(`
            SELECT p.*, ac.encrypted_value, ac.initialization_vector
            FROM providers p
                LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
                JOIN plugins pl ON p.plugin_id = pl.id
            WHERE pl.family = $1
              AND p.active = true
        `, [family.toUpperCase()]);
    }
}
