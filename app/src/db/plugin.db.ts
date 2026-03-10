import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';
import type {Plugin} from '@holokai/types/entities';
import {PluginType} from "@holokai/types/plugin";

@injectable()
export class PluginDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async upsert(family: string, name: string, version: string, type: PluginType): Promise<Plugin | null> {
        const query = `
            INSERT INTO plugins (family, version, name, type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (family, version) DO UPDATE SET name       = EXCLUDED.name,
                                                        updated_at = now()
            RETURNING *
        `;
        return this.db.queryOne<Plugin>(query, [
            family.toUpperCase(), version, name, type.toUpperCase()
        ]);
    }

    async upsertLatest(family: string, name: string, type: PluginType): Promise<Plugin | null> {
        const query = `
            INSERT INTO plugins (family, version, name, type)
            VALUES ($1, 'latest', $2, $3)
            ON CONFLICT (family, version) DO UPDATE SET name       = EXCLUDED.name,
                                                        updated_at = now()
            RETURNING *
        `;
        return this.db.queryOne<Plugin>(query, [
            family.toUpperCase(), name, type.toUpperCase()
        ]);
    }

    async setDefault(family: string, version: string): Promise<void> {
        await this.db.query(
            `UPDATE plugins
             SET is_default = (version = $2)
             WHERE family = $1`,
            [family.toUpperCase(), version]
        );
    }

    async listByType(type: PluginType, active = true): Promise<Plugin[]> {
        return this.db.query(
            `SELECT *
             FROM plugins
             WHERE type = $1
               and active = $2`, [type, active]
        )
    }

    async getDefault(family: string): Promise<Plugin | null> {
        return this.db.queryOne<Plugin>(
            `SELECT *
             FROM plugins
             WHERE family = $1
               AND is_default = true`,
            [family.toUpperCase()]
        );
    }

    async setDefaultPricingPlan(pluginId: string, planId: string): Promise<void> {
        await this.db.query(
            `UPDATE plugins SET default_pricing_plan_id = $1, updated_at = now() WHERE id = $2`,
            [planId, pluginId]
        );
    }

    async deactivateUnusedVersions(family: string): Promise<void> {
        await this.db.query(
            `UPDATE plugins
             SET active = false, updated_at = now()
             WHERE family = $1
               AND version != 'latest'
               AND active = true
               AND id NOT IN (SELECT DISTINCT plugin_id FROM providers WHERE plugin_id IS NOT NULL)`,
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
