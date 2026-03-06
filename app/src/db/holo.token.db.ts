import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';
import {HoloToken} from '@holokai/types/entities';

@injectable()
export class HoloTokenDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async getById(id: string): Promise<HoloToken | null> {
        const query = `
            SELECT *
            FROM holo_tokens
            WHERE id = $1
        `;
        return this.db.queryOne<HoloToken>(query, [id]);
    }

    async getByHash(keyHash: string): Promise<HoloToken | null> {
        const query = `
            SELECT *
            FROM holo_tokens
            WHERE key_hash = $1
              AND active = true
        `;
        return this.db.queryOne<HoloToken>(query, [keyHash]);
    }

    async getByUser(userId: string): Promise<HoloToken[]> {
        const query = `
            SELECT *
            FROM holo_tokens
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;
        return this.db.query<HoloToken>(query, [userId]);
    }

    async getByApplication(applicationId: string): Promise<HoloToken[]> {
        const query = `
            SELECT *
            FROM holo_tokens
            WHERE application_id = $1
            ORDER BY created_at DESC
        `;
        return this.db.query<HoloToken>(query, [applicationId]);
    }

    async getByOrganization(orgId: string): Promise<HoloToken[]> {
        const query = `
            SELECT *
            FROM holo_tokens
            WHERE organization_id = $1
            ORDER BY created_at DESC
        `;
        return this.db.query<HoloToken>(query, [orgId]);
    }

    async create(token: Pick<HoloToken, 'organization_id' | 'user_id' | 'application_id' | 'key_hash' | 'key_prefix' | 'key_suffix' | 'name' | 'expires_at'>): Promise<HoloToken> {
        const query = `
            INSERT INTO holo_tokens (organization_id, user_id, application_id, key_hash, key_prefix, key_suffix, name, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await this.db.queryOne<HoloToken>(query, [
            token.organization_id,
            token.user_id || null,
            token.application_id || null,
            token.key_hash,
            token.key_prefix,
            token.key_suffix,
            token.name || null,
            token.expires_at || null,
        ]);
        return result!;
    }

    async deactivate(id: string): Promise<void> {
        const query = `
            UPDATE holo_tokens
            SET active     = false,
                updated_at = now()
            WHERE id = $1
        `;
        await this.db.query(query, [id]);
    }

    async updateLastUsed(id: string): Promise<void> {
        const query = `
            UPDATE holo_tokens
            SET last_used_at = now(),
                updated_at   = now()
            WHERE id = $1
        `;
        await this.db.query(query, [id]);
    }
}
