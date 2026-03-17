import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {ThreadDB} from '../../db';
import type {HoloPagedResponse, HoloThread, HoloThreadMessage} from '@holokai/types/holo';

@injectable()
export class HoloThreadController extends BaseController {
    constructor(private readonly threadDB: ThreadDB) {
        super();
    }

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const size = Math.min(100, Math.max(1, parseInt(req.query.size as string) || 20));
        const offset = (page - 1) * size;

        const {rows, total} = await this.threadDB.listByUser(req.auth!.userId!, {
            type: req.query.type as string | undefined,
            project_id: req.query.project_id as string | undefined,
        }, size, offset);

        const response: HoloPagedResponse<HoloThread> = {data: rows, page, size, total};
        res.json({success: true, ...response, timestamp: new Date().toISOString()});
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const thread = await this.threadDB.getById(req.params.id);
        if (!thread) throw HoloError.notFound('Thread');

        res.json({success: true, data: thread, timestamp: new Date().toISOString()});
    };

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const thread = await this.threadDB.create(req.auth!.userId!, req.body);
        res.status(201).json({success: true, data: thread, timestamp: new Date().toISOString()});
    };

    update = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const thread = await this.threadDB.update(req.params.id, req.body);
        if (!thread) throw HoloError.notFound('Thread');

        res.json({success: true, data: thread, timestamp: new Date().toISOString()});
    };

    remove = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const deleted = await this.threadDB.softDelete(req.params.id);
        if (!deleted) throw HoloError.notFound('Thread');

        res.status(204).send();
    };

    messages = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const thread = await this.threadDB.getById(req.params.id);
        if (!thread) throw HoloError.notFound('Thread');

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const size = Math.min(100, Math.max(1, parseInt(req.query.size as string) || 50));
        const offset = (page - 1) * size;

        const {rows, total} = await this.threadDB.listMessages(req.params.id, size, offset);

        const response: HoloPagedResponse<HoloThreadMessage> = {data: rows, page, size, total};
        res.json({success: true, ...response, timestamp: new Date().toISOString()});
    };
}
