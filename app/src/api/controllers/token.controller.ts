import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {pickDefined} from '@holokai/sdk';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {HoloTokenService} from '../../services';
import {HoloTokenDB} from '../../db';
import type {HoloToken} from '@holokai/types/entities';

function maskToken(token: HoloToken): Omit<HoloToken, 'key_hash'> {
    const {key_hash, ...rest} = token;
    return rest;
}

@injectable()
export class TokenController extends BaseController {
    constructor(
        private holoTokenService: HoloTokenService,
        private holoTokenDB: HoloTokenDB,
    ) {
        super();
    }

    create = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const auth = req.auth!;
        const {user_id, application_id, name, expires_at} = req.body;

        if (!user_id && !application_id) throw HoloError.badRequest('Either user_id or application_id is required');
        if (user_id && application_id) throw HoloError.badRequest('Provide either user_id or application_id, not both');

        const {token, record} = await this.holoTokenService.generate(
            auth.organizationId,
            pickDefined({
                user_id,
                application_id,
                name,
                expires_at: expires_at ? new Date(expires_at) : undefined
            }) as Parameters<HoloTokenService['generate']>[1]
        );

        res.status(201).json({
            token,
            record: maskToken(record),
        });
    };

    list = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const auth = req.auth!;
        const {user_id, application_id} = req.query;

        let tokens: HoloToken[];
        if (user_id) {
            tokens = await this.holoTokenDB.getByUser(user_id as string);
        } else if (application_id) {
            tokens = await this.holoTokenDB.getByApplication(application_id as string);
        } else {
            tokens = await this.holoTokenDB.getByOrganization(auth.organizationId);
        }

        res.status(200).json(tokens.map(maskToken));
    };

    get = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const auth = req.auth!;
        const token = await this.holoTokenDB.getById(req.params.id);
        if (!token || token.organization_id !== auth.organizationId) throw HoloError.notFound('Token');

        res.status(200).json(maskToken(token));
    };

    deactivate = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const auth = req.auth!;
        const token = await this.holoTokenDB.getById(req.params.id);
        if (!token || token.organization_id !== auth.organizationId) throw HoloError.notFound('Token');

        await this.holoTokenService.deactivate(token.id, token.key_hash);
        const deactivated = await this.holoTokenDB.getById(token.id);
        res.status(200).json(maskToken(deactivated!));
    };
}
