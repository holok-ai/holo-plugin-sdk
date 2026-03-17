import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {RequestDB} from '../../db';
import {paginatedResponse, parsePagination} from '../../utils/pagination';

@injectable()
export class RequestCrudController extends BaseController {
    constructor(private requestDB: RequestDB) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const p = parsePagination(req, 'timestamp');
        const q = req.query as Record<string, string>;
        const result = await this.requestDB.listPaginated(
            {
                org_id: q.org_id, application_id: q.application_id, provider_id: q.provider_id,
                access_model: q.access_model, user_id: q.user_id, from: q.from, to: q.to
            },
            p.limit, p.offset, p.sort_by, p.sort_dir
        );
        res.json(paginatedResponse(result.rows, result.total, p));
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const request = await this.requestDB.getById(req.params.id);
        if (!request) throw HoloError.notFound('Request');
        res.json({success: true, data: request, timestamp: new Date().toISOString()});
    };
}
