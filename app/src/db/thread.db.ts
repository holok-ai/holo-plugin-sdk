import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {ClassLogger} from "@holokai/sdk";
import type {HoloThread, HoloThreadMessage, HoloThreadCreateParams, HoloThreadUpdateParams} from "@holokai/types/holo";

@injectable()
export class ThreadDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async listByUser(
        userId: string,
        filters: { type?: string | undefined; project_id?: string | undefined },
        limit: number,
        offset: number,
    ): Promise<{ rows: HoloThread[]; total: number }> {
        const conditions: string[] = ['user_id = $1', 'deleted_at IS NULL'];
        const params: unknown[] = [userId];
        let idx = 2;

        if (filters.type) {
            conditions.push(`type = $${idx++}::holokai.thread_types`);
            params.push(filters.type);
        }
        if (filters.project_id) {
            conditions.push(`project_id = $${idx++}`);
            params.push(filters.project_id);
        }

        const where = 'WHERE ' + conditions.join(' AND ');

        const [rows, countResult] = await Promise.all([
            this.db.query<HoloThread>(
                `SELECT id, title, description, type, status, project_id, metadata, created_at, updated_at
                 FROM desktop_threads ${where}
                 ORDER BY updated_at DESC
                 LIMIT $${idx++} OFFSET $${idx++}`,
                [...params, limit, offset],
            ),
            this.db.queryOne<{ count: string }>(
                `SELECT COUNT(*)::text as count FROM desktop_threads ${where}`,
                params,
            ),
        ]);

        return {rows, total: parseInt(countResult?.count ?? '0')};
    }

    async getById(id: string): Promise<HoloThread | null> {
        return this.db.queryOne<HoloThread>(
            `SELECT id, title, description, type, status, project_id, metadata, created_at, updated_at
             FROM desktop_threads
             WHERE id = $1 AND deleted_at IS NULL`,
            [id],
        );
    }

    async create(userId: string, params: HoloThreadCreateParams): Promise<HoloThread> {
        const row = await this.db.queryOne<HoloThread>(
            `INSERT INTO desktop_threads (user_id, title, description, status, type, project_id, created_user_id, metadata)
             VALUES ($1, $2, $3, $4::holokai.thread_statuses, $5::holokai.thread_types, $6, $1, $7)
             RETURNING id, title, description, type, status, project_id, metadata, created_at, updated_at`,
            [
                userId,
                params.title,
                params.description ?? '',
                'active',
                params.type ?? 'personal',
                params.project_id ?? null,
                params.metadata ? JSON.stringify(params.metadata) : null,
            ],
        );
        return row!;
    }

    async update(id: string, params: HoloThreadUpdateParams): Promise<HoloThread | null> {
        const sets: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (params.title !== undefined) {
            sets.push(`title = $${idx++}`);
            values.push(params.title);
        }
        if (params.status !== undefined) {
            sets.push(`status = $${idx++}::holokai.thread_statuses`);
            values.push(params.status);
        }
        if (params.metadata !== undefined) {
            sets.push(`metadata = $${idx++}`);
            values.push(JSON.stringify(params.metadata));
        }

        if (sets.length === 0) return this.getById(id);

        sets.push(`updated_at = NOW()`);
        values.push(id);

        return this.db.queryOne<HoloThread>(
            `UPDATE desktop_threads SET ${sets.join(', ')}
             WHERE id = $${idx} AND deleted_at IS NULL
             RETURNING id, title, description, type, status, project_id, metadata, created_at, updated_at`,
            values,
        );
    }

    async softDelete(id: string): Promise<boolean> {
        const result = await this.db.queryOne<{ id: string }>(
            `UPDATE desktop_threads
             SET deleted_at = NOW(), status = 'deleted'::holokai.thread_statuses, updated_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id],
        );
        return !!result;
    }

    async listMessages(
        threadId: string,
        limit: number,
        offset: number,
    ): Promise<{ rows: HoloThreadMessage[]; total: number }> {
        const [rows, countResult] = await Promise.all([
            this.db.query<HoloThreadMessage>(
                `SELECT
                     req.id,
                     req.request_id,
                     req.thread_id,
                     req.metadata->>'branch_id' as branch_id,
                     req.access_model as model,
                     prov.name as provider,
                     req.metadata->>'user_prompt' as user_prompt,
                     resp.response,
                     resp.status,
                     resp.input_tokens,
                     resp.output_tokens,
                     resp.cost,
                     req.timestamp as created_at
                 FROM provider_requests req
                 LEFT JOIN provider_responses resp ON req.request_id = resp.request_id
                 LEFT JOIN providers prov ON req.provider_id = prov.id
                 WHERE req.thread_id = $1
                 ORDER BY req.timestamp ASC
                 LIMIT $2 OFFSET $3`,
                [threadId, limit, offset],
            ),
            this.db.queryOne<{ count: string }>(
                `SELECT COUNT(*)::text as count FROM provider_requests WHERE thread_id = $1`,
                [threadId],
            ),
        ]);

        return {rows, total: parseInt(countResult?.count ?? '0')};
    }
}
