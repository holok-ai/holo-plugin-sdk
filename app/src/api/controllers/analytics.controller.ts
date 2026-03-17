import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {AppDB} from '../../db';

type TimeBucket = 'hour' | 'day' | 'week';

interface AnalyticsFilters {
    bucket: TimeBucket;
    where: string;
    params: any[];
    nextIdx: number;
}

function parseAnalyticsFilters(query: Record<string, string>): AnalyticsFilters {
    const {org_id, from, to, group_by, provider_id, application_id} = query;
    if (!from || !to) throw HoloError.badRequest('from and to are required');

    const bucket: TimeBucket = group_by === 'hour' ? 'hour' : group_by === 'week' ? 'week' : 'day';
    const conditions = [`pr.created_at >= $1`, `pr.created_at < $2`];
    const params: any[] = [from, to];
    let idx = 3;

    if (org_id) {
        conditions.push(`pr.organization_id = $${idx++}`);
        params.push(org_id);
    }
    if (provider_id) {
        conditions.push(`pr.provider_id = $${idx++}`);
        params.push(provider_id);
    }
    if (application_id) {
        conditions.push(`pr.application_id = $${idx++}`);
        params.push(application_id);
    }

    return {bucket, where: conditions.join(' AND '), params, nextIdx: idx};
}

@injectable()
export class AnalyticsController extends BaseController {
    constructor(private db: AppDB) {
        super();
    }

    costSummary = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const filters = parseAnalyticsFilters(req.query as Record<string, string>);

        const rows = await this.db.query<any>(
            `SELECT pr.provider_id,
                    prov.name                                      as provider_name,
                    pr.access_model,
                    date_trunc('${filters.bucket}', pr.created_at) as period,
                    COUNT(*)::int                                  as request_count,
                    COALESCE(SUM(pr.input_tokens), 0)::int         as total_input_tokens,
                    COALESCE(SUM(pr.output_tokens), 0)::int        as total_output_tokens,
                    COALESCE(SUM(pr.cost), 0)::float               as total_cost
             FROM provider_responses pr
                      LEFT JOIN providers prov ON pr.provider_id = prov.id
             WHERE ${filters.where}
             GROUP BY pr.provider_id, prov.name, pr.access_model, period
             ORDER BY period DESC, total_cost DESC`,
            filters.params
        );
        res.json({success: true, data: rows, timestamp: new Date().toISOString()});
    };

    tokenUsage = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const filters = parseAnalyticsFilters(req.query as Record<string, string>);

        const rows = await this.db.query<any>(
            `SELECT pr.access_model,
                    date_trunc('${filters.bucket}', pr.created_at) as period,
                    COUNT(*)::int                                  as request_count,
                    COALESCE(SUM(pr.input_tokens), 0)::int         as total_input_tokens,
                    COALESCE(SUM(pr.output_tokens), 0)::int        as total_output_tokens,
                    COALESCE(AVG(pr.input_tokens), 0)::int         as avg_input_tokens,
                    COALESCE(AVG(pr.output_tokens), 0)::int        as avg_output_tokens
             FROM provider_responses pr
             WHERE ${filters.where}
             GROUP BY pr.access_model, period
             ORDER BY period DESC, total_input_tokens DESC`,
            filters.params
        );
        res.json({success: true, data: rows, timestamp: new Date().toISOString()});
    };

    requestCounts = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const filters = parseAnalyticsFilters(req.query as Record<string, string>);

        const rows = await this.db.query<any>(
            `SELECT date_trunc('${filters.bucket}', pr.created_at) as period,
                    pr.status,
                    COUNT(*)::int                                  as count
             FROM provider_responses pr
             WHERE ${filters.where}
             GROUP BY period, pr.status
             ORDER BY period DESC`,
            filters.params
        );
        res.json({success: true, data: rows, timestamp: new Date().toISOString()});
    };
}
