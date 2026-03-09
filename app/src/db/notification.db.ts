import 'reflect-metadata';
import {injectable} from "tsyringe";
import {pickDefined} from "@holokai/sdk";
import type {INotificationStore, NotificationEvent, NotificationQuery} from '@holokai/types/notification';
import {AppDB} from "./app.db";

@injectable()
export class PostgresNotificationStore implements INotificationStore {
    constructor(private readonly db: AppDB) {
    }

    async insert(event: NotificationEvent): Promise<void> {
        const {
            id,
            ts,
            organizationId,
            appSlug,
            userId,
            threadId,
            requestId,
            branchId,
            type,
            severity,
            message,
            payload,
        } = event;

        const query = `
            INSERT INTO notifications
            (id, ts, organization_id, app_slug, user_id, thread_id, request_id, branch_id, type, severity, message,
             payload)
            VALUES ($1, $2, $3::uuid, $4, $5, $6::uuid, $7::uuid, $8, $9, $10, $11, $12::jsonb)
            ON CONFLICT (id) DO NOTHING
        `;

        await this.db.query(query, [
            id,
            ts,
            organizationId,
            appSlug,
            userId,
            threadId,
            requestId,
            branchId,
            type,
            severity,
            message,
            JSON.stringify(payload),
        ]);
    }

    async query(params: NotificationQuery): Promise<NotificationEvent[]> {
        const {
            organizationId,
            appSlug,
            threadIds,
            requestIds,
            branchIds,
            types,
            afterId,
            limit,
        } = params;

        // Cursor: resolve afterId -> (ts,id) for stable pagination
        let afterTs: number | null = null;
        if (afterId) {
            const row = await this.db.queryOne<{ ts: number }>(
                `SELECT ts
                 FROM notifications
                 WHERE id = $1
                   AND organization_id = $2::uuid
                   AND app_slug = $3`,
                [afterId, organizationId, appSlug]
            );
            afterTs = row?.ts ?? null;
        }

        const where: string[] = [`organization_id = $1::uuid`, `app_slug = $2`];
        const values: any[] = [organizationId, appSlug];
        let i = values.length;

        if (threadIds?.length) {
            where.push(`thread_id = ANY($${++i}::uuid[])`);
            values.push(threadIds);
        }

        if (requestIds?.length) {
            where.push(`request_id = ANY($${++i}::uuid[])`);
            values.push(requestIds);
        }

        if (branchIds?.length) {
            where.push(`branch_id = ANY($${++i}::text[])`);
            values.push(branchIds);
        }

        if (types?.length) {
            where.push(`type = ANY($${++i}::text[])`);
            values.push(types);
        }

        // Exclusive cursor (DESC order): (ts,id) strictly less than cursor
        if (afterId && afterTs !== null) {
            where.push(`(ts < $${++i} OR (ts = $${i} AND id < $${++i}))`);
            values.push(afterTs, afterId);
        }

        values.push(Math.max(1, limit));

        const query = `
            SELECT id,
                   ts,
                   organization_id,
                   app_slug,
                   user_id,
                   thread_id,
                   request_id,
                   branch_id,
                   type,
                   severity,
                   message,
                   payload
            FROM notifications
            WHERE ${where.join(" AND ")}
            ORDER BY ts DESC, id DESC
            LIMIT $${++i}
    `;

        const rows = await this.db.query<any>(query, values);

        return rows.map((r) => (pickDefined({
            id: r.id,
            ts: Number(r.ts),
            organizationId: r.organization_id,
            appSlug: r.app_slug,
            userId: r.user_id,
            threadId: r.thread_id,
            requestId: r.request_id,
            branchId: r.branch_id,
            type: r.type,
            severity: r.severity,
            message: r.message,
            payload: r.payload,
        }) as NotificationEvent));
    }
}