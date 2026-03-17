import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {ProviderResponseCostDB, ResponseDB} from '../../db';
import {paginatedResponse, parsePagination} from '../../utils/pagination';

@injectable()
export class ResponseCrudController extends BaseController {
    constructor(
        private responseDB: ResponseDB,
        private costDB: ProviderResponseCostDB
    ) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const p = parsePagination(req);
        const q = req.query as Record<string, string>;
        const result = await this.responseDB.listPaginated(
            {
                org_id: q.org_id, application_id: q.application_id, provider_id: q.provider_id,
                access_model: q.access_model, user_id: q.user_id, client_identifier: q.client_identifier,
                status: q.status, from: q.from, to: q.to
            },
            p.limit, p.offset, p.sort_by, p.sort_dir
        );
        res.json(paginatedResponse(result.rows, result.total, p));
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const response = await this.responseDB.getById(req.params.id);
        if (!response) throw HoloError.notFound('Response');
        const costs = await this.costDB.findByResponseId(req.params.id);
        res.json({success: true, data: {...response, costs}, timestamp: new Date().toISOString()});
    };

    filters = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const data = await this.responseDB.getFilters(req.query.org_id as string);
        res.json({success: true, data, timestamp: new Date().toISOString()});
    };
}
