import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {ProviderDB} from '../../db';
import {parsePagination, paginatedResponse} from '../../utils/pagination';

@injectable()
export class ProviderCrudController extends BaseController {
    constructor(private providerDB: ProviderDB) { super(); }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const p = parsePagination(req);
            const {org_id, enabled, search} = req.query as Record<string, string>;
            const filters: { org_id?: string; enabled?: boolean; search?: string } = {};
            if (org_id) filters.org_id = org_id;
            if (enabled !== undefined) filters.enabled = enabled === 'true';
            if (search) filters.search = search;
            const result = await this.providerDB.listPaginated(
                filters, p.limit, p.offset, p.sort_by, p.sort_dir
            );
            res.json(paginatedResponse(result.rows, result.total, p));
        } catch (error) { this.handleError(res, error as Error, 'Failed to list providers'); }
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const provider = await this.providerDB.getById(req.params.id);
            if (!provider) { res.status(404).json({success: false, error: {message: 'Provider not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: provider, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to get provider'); }
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const provider = await this.providerDB.create(req.body);
            if (!provider) { this.handleError(res, new Error('Insert returned null'), 'Failed to create provider'); return; }
            res.status(201).json({success: true, data: provider, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to create provider', 400); }
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const provider = await this.providerDB.update(req.params.id, req.body);
            if (!provider) { res.status(404).json({success: false, error: {message: 'Provider not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, data: provider, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to update provider', 400); }
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const deleted = await this.providerDB.softDelete(req.params.id);
            if (!deleted) { res.status(404).json({success: false, error: {message: 'Provider not found', code: 'NOT_FOUND'}, timestamp: new Date().toISOString()}); return; }
            res.json({success: true, timestamp: new Date().toISOString()});
        } catch (error) { this.handleError(res, error as Error, 'Failed to delete provider'); }
    };
}
