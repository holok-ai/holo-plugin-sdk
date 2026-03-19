import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {ProviderResponse, ProviderResponseView} from "@holokai/types/entities";

@injectable()
export class ResponseDB {
    constructor(private db: AppDB) {

    }

    async getById(id: string): Promise<ProviderResponseView | null> {
        return this.db.queryOne<ProviderResponseView>(
            `SELECT pr.*,
                    a.name     as application_name,
                    prov.name  as provider_name,
                    pl.name as plugin_name,
                    pl.version as plugin_version,
                    prot.name as protocol_name
             FROM provider_responses pr
                      LEFT JOIN applications a ON pr.application_id = a.id
                      LEFT JOIN providers prov ON pr.provider_id = prov.id
                      LEFT JOIN plugins pl ON prov.plugin_id = pl.id
                      LEFT JOIN protocols prot ON pr.protocol_id = prot.id
             WHERE pr.id = $1`, [id]
        );
    }

    async listPaginated(filters: {
        org_id?: string; application_id?: string; provider_id?: string;
        access_model?: string; user_id?: string; client_identifier?: string;
        status?: string; from?: string; to?: string;
    }, limit: number, offset: number, sortBy: string, sortDir: string): Promise<{
        rows: ProviderResponseView[];
        total: number
    }> {
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (filters.org_id) {
            conditions.push(`pr.organization_id = $${idx++}`);
            params.push(filters.org_id);
        }
        if (filters.application_id) {
            conditions.push(`pr.application_id = $${idx++}`);
            params.push(filters.application_id);
        }
        if (filters.provider_id) {
            conditions.push(`pr.provider_id = $${idx++}`);
            params.push(filters.provider_id);
        }
        if (filters.access_model) {
            conditions.push(`pr.access_model = $${idx++}`);
            params.push(filters.access_model);
        }
        if (filters.user_id) {
            conditions.push(`pr.user_id = $${idx++}`);
            params.push(filters.user_id);
        }
        if (filters.client_identifier) {
            conditions.push(`pr.client_identifier = $${idx++}`);
            params.push(filters.client_identifier);
        }
        if (filters.status) {
            conditions.push(`pr.status = $${idx++}`);
            params.push(filters.status);
        }
        if (filters.from) {
            conditions.push(`pr.created_at >= $${idx++}`);
            params.push(filters.from);
        }
        if (filters.to) {
            conditions.push(`pr.created_at < $${idx++}`);
            params.push(filters.to);
        }

        const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const allowedSorts = new Set(['created_at', 'input_tokens', 'output_tokens', 'cost', 'score', 'status', 'access_model', 'total_processing_time']);
        const col = allowedSorts.has(sortBy) ? sortBy : 'created_at';
        const dir = sortDir === 'asc' ? 'ASC' : 'DESC';

        const baseQuery = `
            FROM provider_responses pr
                LEFT JOIN applications a ON pr.application_id = a.id
                LEFT JOIN providers prov ON pr.provider_id = prov.id
            ${where}`;

        const [rows, countResult] = await Promise.all([
            this.db.query<ProviderResponseView>(
                `SELECT pr.*, a.name as application_name, prov.name as provider_name ${baseQuery} ORDER BY pr.${col} ${dir} LIMIT $${idx++} OFFSET $${idx++}`,
                [...params, limit, offset]
            ),
            this.db.queryOne<{ count: string }>(`SELECT COUNT(*)::text as count ${baseQuery}`, params),
        ]);
        return {rows, total: parseInt(countResult?.count ?? '0')};
    }

    async getFilters(orgId?: string): Promise<{
        applications: string[];
        providers: string[];
        models: string[];
        statuses: string[]
    }> {
        const where = orgId ? 'WHERE pr.organization_id = $1' : '';
        const params = orgId ? [orgId] : [];

        const [applications, providers, models, statuses] = await Promise.all([
            this.db.query<{ name: string }>(`SELECT DISTINCT a.name
                                             FROM provider_responses pr
                                                      JOIN applications a ON pr.application_id = a.id ${where}
                                             ORDER BY a.name`, params),
            this.db.query<{ name: string }>(`SELECT DISTINCT prov.name
                                             FROM provider_responses pr
                                                      JOIN providers prov ON pr.provider_id = prov.id ${where}
                                             ORDER BY prov.name`, params),
            this.db.query<{ access_model: string }>(`SELECT DISTINCT pr.access_model
                                                     FROM provider_responses pr ${where}
                                                     ORDER BY pr.access_model`, params),
            this.db.query<{ status: string }>(`SELECT DISTINCT pr.status
                                               FROM provider_responses pr ${where}
                                               ORDER BY pr.status`, params),
        ]);
        return {
            applications: applications.map(r => r.name),
            providers: providers.map(r => r.name),
            models: models.map(r => r.access_model),
            statuses: statuses.map(r => r.status),
        };
    }

    async insert(response: Omit<ProviderResponse, 'id'>): Promise<{ id: string } | null> {
        const {
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            user_id,
            client_identifier,
            access_model,
            status,
            finish_reason,
            response: responseText,
            response_raw,
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            created_at,
            metadata,
            usage_raw,
            total_tokens
        } = response;

        const query = `
            INSERT INTO provider_responses
            (organization_id, request_id, application_id, provider_id, protocol_id, user_id, client_identifier,
             access_model,
             status, finish_reason, response, response_raw, input_tokens, output_tokens, time_to_first_token,
             total_processing_time,
             cost, score, created_at, metadata, usage_raw, total_tokens)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING id
        `;

        return this.db.queryOne<{ id: string }>(query, [
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            user_id,
            client_identifier,
            access_model,
            status,
            finish_reason,
            responseText,
            response_raw ? JSON.stringify(response_raw) : null,
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            created_at,
            JSON.stringify(metadata),
            JSON.stringify(usage_raw),
            total_tokens
        ]);
    }
}
