import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';
import type {Plugin} from '@holokai/types/entities';

@injectable()
export class PluginDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async upsert(family: string, name: string, version: string): Promise<Plugin> {
        const query = `
            INSERT INTO plugins (family, version, name, is_latest)
            VALUES ($1, $2, $3, false)
            ON CONFLICT (family, version) DO UPDATE SET name       = EXCLUDED.name,
                                                        updated_at = now()
            RETURNING *
        `;
        const result = await this.db.queryOne<Plugin>(query, [
            family.toUpperCase(), version, name
        ]);
        return result!;
    }

    async setLatest(family: string, version: string): Promise<void> {
        await this.db.query(
            `UPDATE plugins
             SET is_latest = false
             WHERE family = $1
               AND is_latest = true`,
            [family.toUpperCase()]
        );
        await this.db.query(
            `UPDATE plugins
             SET is_latest = true
             WHERE family = $1
               AND version = $2`,
            [family.toUpperCase(), version]
        );
    }

    async getLatest(family: string): Promise<Plugin | null> {
        return this.db.queryOne<Plugin>(
            `SELECT *
             FROM plugins
             WHERE family = $1
               AND is_latest = true`,
            [family.toUpperCase()]
        );
    }

    async getByFamilyAndVersion(family: string, version: string): Promise<Plugin | null> {
        return this.db.queryOne<Plugin>(
            `SELECT *
             FROM plugins
             WHERE family = $1
               AND version = $2`,
            [family.toUpperCase(), version]
        );
    }
}
