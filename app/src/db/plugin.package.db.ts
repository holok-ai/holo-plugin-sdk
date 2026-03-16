import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';

export interface PluginPackage {
    id: string;
    package_name: string;
    version: string;
    family: string;
    source: 'builtin' | 'installed';
    tarball: Buffer;
    sha256: string;
    size_bytes: number;
    enabled: boolean;
    installed_by: string | null;
    enabled_by: string | null;
    enabled_at: Date | null;
    created_at: Date;
}

export type PluginPackageMeta = Omit<PluginPackage, 'tarball'>;

@injectable()
export class PluginPackageDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async store(
        packageName: string,
        version: string,
        family: string,
        tarball: Buffer,
        sha256: string,
        source: 'builtin' | 'installed',
        installedBy?: string
    ): Promise<PluginPackageMeta> {
        const enabled = source === 'builtin';
        const row = await this.db.queryOne<PluginPackageMeta>(`
            INSERT INTO holokai.plugin_packages
                (package_name, version, family, source, tarball, sha256, size_bytes, enabled, installed_by, enabled_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (package_name, version) DO UPDATE
                SET tarball      = EXCLUDED.tarball,
                    sha256       = EXCLUDED.sha256,
                    size_bytes   = EXCLUDED.size_bytes,
                    source       = EXCLUDED.source
            RETURNING id, package_name, version, family, source, sha256, size_bytes, enabled,
                      installed_by, enabled_by, enabled_at, created_at
        `, [
            packageName, version, family, source, tarball, sha256,
            tarball.length, enabled, installedBy ?? null,
            enabled ? new Date() : null
        ]);
        return row!;
    }

    async enable(packageName: string, enabledBy: string): Promise<void> {
        await this.db.query(`
            UPDATE holokai.plugin_packages
            SET enabled = true, enabled_by = $2, enabled_at = now()
            WHERE package_name = $1
        `, [packageName, enabledBy]);
    }

    async disable(packageName: string): Promise<void> {
        await this.db.query(`
            UPDATE holokai.plugin_packages
            SET enabled = false
            WHERE package_name = $1
        `, [packageName]);
    }

    async getEnabled(): Promise<PluginPackageMeta[]> {
        return this.db.query<PluginPackageMeta>(`
            SELECT id, package_name, version, family, source, sha256, size_bytes, enabled,
                   installed_by, enabled_by, enabled_at, created_at
            FROM holokai.plugin_packages
            WHERE enabled = true
        `);
    }

    async getTarball(packageName: string, version: string): Promise<Buffer | null> {
        const row = await this.db.queryOne<{ tarball: Buffer }>(`
            SELECT tarball FROM holokai.plugin_packages
            WHERE package_name = $1 AND version = $2
        `, [packageName, version]);
        return row?.tarball ?? null;
    }

    async getByName(packageName: string): Promise<PluginPackageMeta | null> {
        return this.db.queryOne<PluginPackageMeta>(`
            SELECT id, package_name, version, family, source, sha256, size_bytes, enabled,
                   installed_by, enabled_by, enabled_at, created_at
            FROM holokai.plugin_packages
            WHERE package_name = $1
            ORDER BY created_at DESC LIMIT 1
        `, [packageName]);
    }

    async list(): Promise<PluginPackageMeta[]> {
        return this.db.query<PluginPackageMeta>(`
            SELECT id, package_name, version, family, source, sha256, size_bytes, enabled,
                   installed_by, enabled_by, enabled_at, created_at
            FROM holokai.plugin_packages
            ORDER BY family, created_at DESC
        `);
    }

    async remove(packageName: string): Promise<void> {
        await this.db.query(`
            DELETE FROM holokai.plugin_packages WHERE package_name = $1
        `, [packageName]);
    }

    async hasVersion(packageName: string, version: string): Promise<boolean> {
        const count = await this.db.queryScalar<number>(`
            SELECT COUNT(*) FROM holokai.plugin_packages
            WHERE package_name = $1 AND version = $2
        `, [packageName, version]);
        return (count ?? 0) > 0;
    }
}
