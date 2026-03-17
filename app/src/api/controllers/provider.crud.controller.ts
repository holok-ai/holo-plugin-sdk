import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {ProviderDB} from '../../db';
import {paginatedResponse, parsePagination} from '../../utils/pagination';

@injectable()
export class ProviderCrudController extends BaseController {
    constructor(private providerDB: ProviderDB) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
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
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const provider = await this.providerDB.getById(req.params.id);
        if (!provider) throw HoloError.notFound('Provider');
        res.json({success: true, data: provider, timestamp: new Date().toISOString()});
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const provider = await this.providerDB.create(req.body);
        if (!provider) throw HoloError.badRequest('Failed to create provider');
        res.status(201).json({success: true, data: provider, timestamp: new Date().toISOString()});
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const provider = await this.providerDB.update(req.params.id, req.body);
        if (!provider) throw HoloError.notFound('Provider');
        res.json({success: true, data: provider, timestamp: new Date().toISOString()});
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const deleted = await this.providerDB.softDelete(req.params.id);
        if (!deleted) throw HoloError.notFound('Provider');
        res.json({success: true, timestamp: new Date().toISOString()});
    };
}
