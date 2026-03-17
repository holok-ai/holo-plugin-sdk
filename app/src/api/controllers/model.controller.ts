import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {ModelDB} from '../../db';
import {paginatedResponse, parsePagination} from '../../utils/pagination';

@injectable()
export class ModelCrudController extends BaseController {
    constructor(private modelDB: ModelDB) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const p = parsePagination(req, 'name');
        const {org_id, provider_id, search} = req.query as Record<string, string>;
        const result = await this.modelDB.listPaginated({
            org_id,
            provider_id,
            search
        }, p.limit, p.offset, p.sort_by, p.sort_dir);
        res.json(paginatedResponse(result.rows, result.total, p));
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const model = await this.modelDB.getById(req.params.id);
        if (!model) throw HoloError.notFound('Model');
        res.json({success: true, data: model, timestamp: new Date().toISOString()});
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const model = await this.modelDB.create(req.body);
        if (!model) throw HoloError.badRequest('Failed to create model');
        res.status(201).json({success: true, data: model, timestamp: new Date().toISOString()});
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const model = await this.modelDB.update(req.params.id, req.body);
        if (!model) throw HoloError.notFound('Model');
        res.json({success: true, data: model, timestamp: new Date().toISOString()});
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const deleted = await this.modelDB.softDelete(req.params.id);
        if (!deleted) throw HoloError.notFound('Model');
        res.json({success: true, timestamp: new Date().toISOString()});
    };
}
