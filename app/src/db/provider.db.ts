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
        return this.db.query<ProviderWithCredential>(query);
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
        return this.db.queryOne<ProviderWithCredential>(query, [name]);
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
        return this.db.queryOne<ProviderWithCredential>(query, [id]);
    }

    async findByPluginId(pluginId: string): Promise<ProviderWithCredential[]> {
        return this.db.query(`
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
        const result = await this.db.query(
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

    async findByPluginFamily(family: string, excludePluginId?: string): Promise<ProviderWithCredential[]> {
        if (excludePluginId) {
            return this.db.query(`
                SELECT p.*, ac.encrypted_value, ac.initialization_vector
                FROM providers p
                    LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
                    JOIN plugins pl ON p.plugin_id = pl.id
                WHERE pl.family = $1
                  AND p.plugin_id != $2
                  AND p.active = true
            `, [family.toUpperCase(), excludePluginId]);
        }
        return this.db.query(`
            SELECT p.*, ac.encrypted_value, ac.initialization_vector
            FROM providers p
                LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
                JOIN plugins pl ON p.plugin_id = pl.id
            WHERE pl.family = $1
              AND p.active = true
        `, [family.toUpperCase()]);
    }
}
