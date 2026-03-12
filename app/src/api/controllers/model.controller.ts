import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {ModelDB} from '../../db';
import {parsePagination, paginatedResponse} from '../../utils/pagination';

@injectable()
export class ModelCrudController extends BaseController {
    constructor(private modelDB: ModelDB) { super(); }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const p = parsePagination(req, 'name');
            const {org_id, provider_id, search} = req.query as Record<string, string>;
            const result = await this.modelDB.listPaginated({org_id, provider_id, search}, p.limit, p.offset, p.sort_by, p.sort_dir);
            res.json(paginatedResponse(result.rows, result.total, p));
        } catch (error) { this.handleError(res, error as Error, 'Failed to list models'); }
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const model = await this.modelDB.getById(req.params.id);
            if (!model) { res.status(404).json({success: false, error: {message: 'Model not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: model, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to get model'); }
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const model = await this.modelDB.create(req.body);
            if (!model) { this.handleError(res, new Error('Insert returned null'), 'Failed to create model'); return; }
            res.status(201).json({success: true, data: model, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to create model', 400); }
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const model = await this.modelDB.update(req.params.id, req.body);
            if (!model) { res.status(404).json({success: false, error: {message: 'Model not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: model, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to update model', 400); }
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const deleted = await this.modelDB.softDelete(req.params.id);
            if (!deleted) { res.status(404).json({success: false, error: {message: 'Model not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to delete model'); }
    };
}
