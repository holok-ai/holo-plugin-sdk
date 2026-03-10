import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {ProviderRequest} from "@holokai/types/entities";
import {ClassLogger} from "@holokai/sdk";

@injectable()
export class RequestDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async getById(id: string): Promise<ProviderRequest | null> {
        return this.db.queryOne<ProviderRequest>(`SELECT * FROM provider_requests WHERE id = $1`, [id]);
    }

    async getByRequestId(requestId: string): Promise<ProviderRequest | null> {
        return this.db.queryOne<ProviderRequest>(`SELECT * FROM provider_requests WHERE request_id = $1`, [requestId]);
    }

    async listPaginated(filters: {
        org_id?: string; application_id?: string; provider_id?: string;
        access_model?: string; user_id?: string; from?: string; to?: string;
    }, limit: number, offset: number, sortBy: string, sortDir: string): Promise<{ rows: ProviderRequest[]; total: number }> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (filters.org_id) { conditions.push(`organization_id = $${idx++}`); params.push(filters.org_id); }
        if (filters.application_id) { conditions.push(`application_id = $${idx++}`); params.push(filters.application_id); }
        if (filters.provider_id) { conditions.push(`provider_id = $${idx++}`); params.push(filters.provider_id); }
        if (filters.access_model) { conditions.push(`access_model = $${idx++}`); params.push(filters.access_model); }
        if (filters.user_id) { conditions.push(`user_id = $${idx++}`); params.push(filters.user_id); }
        if (filters.from) { conditions.push(`timestamp >= $${idx++}`); params.push(filters.from); }
        if (filters.to) { conditions.push(`timestamp < $${idx++}`); params.push(filters.to); }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const allowedSorts = new Set(['timestamp', 'created_at', 'access_model']);
        const col = allowedSorts.has(sortBy) ? sortBy : 'timestamp';
        const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const [rows, countResult] = await Promise.all([
            this.db.query<ProviderRequest>(`SELECT * FROM provider_requests ${where} ORDER BY ${col} ${dir} LIMIT $${idx++} OFFSET $${idx++}`, [...params, limit, offset]),
            this.db.queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM provider_requests ${where}`, params),
        ]);
        return {rows, total: parseInt(countResult?.count ?? '0')};
    }

    async insert(request: Omit<ProviderRequest, 'id'>) {
        const {
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            user_id,
            client_identifier,
            access_model,
            thread_id,
            timestamp,
            metadata
        } = request;

        const query = `
            INSERT INTO provider_requests
            (organization_id, request_id, application_id, provider_id, protocol_id, user_id, client_identifier,
             access_model, thread_id, timestamp, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await this.db.query(query, [
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            user_id,
            client_identifier,
            access_model,
            thread_id,
            timestamp,
            JSON.stringify(metadata)
        ]);
    }
}
