import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {ResponseDB, ProviderResponseCostDB} from '../../db';
import {parsePagination, paginatedResponse} from '../../utils/pagination';

@injectable()
export class ResponseCrudController extends BaseController {
    constructor(
        private responseDB: ResponseDB,
        private costDB: ProviderResponseCostDB
    ) { super(); }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const p = parsePagination(req);
            const q = req.query as Record<string, string>;
            const result = await this.responseDB.listPaginated(
                {org_id: q.org_id, application_id: q.application_id, provider_id: q.provider_id,
                 access_model: q.access_model, user_id: q.user_id, client_identifier: q.client_identifier,
                 status: q.status, from: q.from, to: q.to},
                p.limit, p.offset, p.sort_by, p.sort_dir
            );
            res.json(paginatedResponse(result.rows, result.total, p));
        } catch (error) { this.handleError(res, error as Error, 'Failed to list responses'); }
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const response = await this.responseDB.getById(req.params.id);
            if (!response) { res.status(404).json({success: false, error: {message: 'Response not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            const costs = await this.costDB.findByResponseId(req.params.id);
            res.json({success: true, data: {...response, costs}, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to get response'); }
    };

    filters = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const data = await this.responseDB.getFilters(req.query.org_id as string);
            res.json({success: true, data, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to get filters'); }
    };
}
