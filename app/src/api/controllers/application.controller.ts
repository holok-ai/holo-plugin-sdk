import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {ApplicationDB} from '../../db';
import {parsePagination, paginatedResponse} from '../../utils/pagination';

@injectable()
export class ApplicationCrudController extends BaseController {
    constructor(private applicationDB: ApplicationDB) { super(); }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const p = parsePagination(req);
            const {org_id, provider_id, search} = req.query as Record<string, string>;
            const result = await this.applicationDB.listPaginated({org_id, provider_id, search}, p.limit, p.offset, p.sort_by, p.sort_dir);
            res.json(paginatedResponse(result.rows, result.total, p));
        } catch (error) { this.handleError(res, error as Error, 'Failed to list applications'); }
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const app = await this.applicationDB.getById(req.params.id);
            if (!app) { res.status(404).json({success: false, error: {message: 'Application not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: app, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to get application'); }
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const app = await this.applicationDB.create(req.body);
            if (!app) { this.handleError(res, new Error('Insert returned null'), 'Failed to create application'); return; }
            res.status(201).json({success: true, data: app, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to create application', 400); }
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const app = await this.applicationDB.update(req.params.id, req.body);
            if (!app) { res.status(404).json({success: false, error: {message: 'Application not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: app, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to update application', 400); }
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const deleted = await this.applicationDB.softDelete(req.params.id);
            if (!deleted) { res.status(404).json({success: false, error: {message: 'Application not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to delete application'); }
    };
}
