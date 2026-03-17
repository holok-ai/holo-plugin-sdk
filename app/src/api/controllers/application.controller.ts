import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {ApplicationDB} from '../../db';
import {paginatedResponse, parsePagination} from '../../utils/pagination';

@injectable()
export class ApplicationCrudController extends BaseController {
    constructor(private applicationDB: ApplicationDB) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const p = parsePagination(req);
        const {org_id, provider_id, search} = req.query as Record<string, string>;
        const result = await this.applicationDB.listPaginated({
            org_id,
            provider_id,
            search
        }, p.limit, p.offset, p.sort_by, p.sort_dir);
        res.json(paginatedResponse(result.rows, result.total, p));
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const app = await this.applicationDB.getById(req.params.id);
        if (!app) throw HoloError.notFound('Application');
        res.json({success: true, data: app, timestamp: new Date().toISOString()});
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const app = await this.applicationDB.create(req.body);
        if (!app) throw HoloError.badRequest('Failed to create application');
        res.status(201).json({success: true, data: app, timestamp: new Date().toISOString()});
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const app = await this.applicationDB.update(req.params.id, req.body);
        if (!app) throw HoloError.notFound('Application');
        res.json({success: true, data: app, timestamp: new Date().toISOString()});
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const deleted = await this.applicationDB.softDelete(req.params.id);
        if (!deleted) throw HoloError.notFound('Application');
        res.json({success: true, timestamp: new Date().toISOString()});
    };
}
