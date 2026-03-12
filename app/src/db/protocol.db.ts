import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';
import type {Protocol} from '@holokai/types/entities';

@injectable()
export class ProtocolDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async upsert(pluginId: string, name: string, capability: string, path?: string): Promise<Protocol> {
        const query = `
            INSERT INTO protocols (plugin_id, name, capability, path)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (plugin_id, name) DO UPDATE SET
                name = EXCLUDED.name,
                capability = EXCLUDED.capability,
                path = EXCLUDED.path
            RETURNING *
        `;
        const result = await this.db.queryOne<Protocol>(query, [pluginId, name, capability, path || null]);
        return result!;
    }

    async getByPluginAndKey(pluginId: string, name: string): Promise<Protocol | null> {
        return this.db.queryOne<Protocol>(
            `SELECT * FROM protocols WHERE plugin_id = $1 AND name = $2`,
            [pluginId, name]
        );
    }

    async getByPlugin(pluginId: string): Promise<Protocol[]> {
        return this.db.query<Protocol>(
            `SELECT * FROM protocols WHERE plugin_id = $1 AND active = true ORDER BY name`,
            [pluginId]
        );
    }
}
