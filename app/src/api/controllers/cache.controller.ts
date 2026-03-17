import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {RedisService} from '../../services';

@injectable()
export class CacheController extends BaseController {
    constructor(private redis: RedisService) {
        super();
    }

    invalidateProvider = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {provider_id, org_id, provider_name} = req.body;
        this.log.info(`Cache invalidation: provider`, {
            provider_id,
            org_id,
            provider_name,
            caller: req.auth?.userId
        });
        let deleted = 0;

        if (provider_id) {
            if (await this.redis.del(`provider:${provider_id}`)) deleted++;
        }

        if (org_id && provider_name) {
            if (await this.redis.del(`org:${org_id}:provider:name:${provider_name}`)) deleted++;
        }

        if (org_id) {
            deleted += await this.scanDelete(`org:${org_id}:provider:*`);
        }

        this.log.info(`Cache invalidation complete: provider — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    invalidateApplication = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {application_id, org_id, url_slug} = req.body;
        this.log.info(`Cache invalidation: application`, {
            application_id,
            org_id,
            url_slug,
            caller: req.auth?.userId
        });
        let deleted = 0;

        if (application_id) {
            if (await this.redis.del(`app:id:${application_id}`)) deleted++;
        }

        if (url_slug) {
            if (await this.redis.del(`app:slug:${url_slug}`)) deleted++;
            deleted += await this.scanDelete(`auth:*:${url_slug}`);
        }

        if (org_id && url_slug) {
            if (await this.redis.del(`org:${org_id}:application:${url_slug}`)) deleted++;
        }

        if (org_id) {
            deleted += await this.scanDelete(`org:${org_id}:application:*`);
        }

        this.log.info(`Cache invalidation complete: application — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    invalidateAccess = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {user_id, email} = req.body;
        this.log.info(`Cache invalidation: access`, {user_id, email, caller: req.auth?.userId});
        let deleted = 0;

        if (user_id) {
            deleted += await this.scanDelete(`access:${user_id}:*`);
        }

        if (email) {
            if (await this.redis.del(`access:email:${email.trim().toLowerCase()}`)) deleted++;
        }

        this.log.info(`Cache invalidation complete: access — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    invalidateUser = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {user_id, email} = req.body;
        this.log.info(`Cache invalidation: user`, {user_id, email, caller: req.auth?.userId});
        let deleted = 0;

        if (user_id) {
            deleted += await this.scanDelete(`access:${user_id}:*`);
            deleted += await this.scanDelete(`auth:${user_id}:*`);
        }

        if (email) {
            if (await this.redis.del(`access:email:${email.trim().toLowerCase()}`)) deleted++;
        }

        this.log.info(`Cache invalidation complete: user — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    invalidateAuth = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {token_hash, app_slug} = req.body;
        this.log.info(`Cache invalidation: auth`, {
            token_hash: token_hash ? `${token_hash.substring(0, 8)}...` : undefined,
            app_slug,
            caller: req.auth?.userId
        });
        let deleted = 0;

        if (token_hash) {
            if (await this.redis.del(`holo_token:${token_hash}`)) deleted++;
            deleted += await this.scanDelete(`auth:${token_hash}:*`);
        }

        if (app_slug) {
            deleted += await this.scanDelete(`auth:*:${app_slug}`);
        }

        this.log.info(`Cache invalidation complete: auth — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    invalidateOrg = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {org_id} = req.body;
        if (!org_id) throw HoloError.badRequest('org_id is required');

        this.log.info(`Cache invalidation: org`, {org_id, caller: req.auth?.userId});
        let deleted = 0;
        deleted += await this.scanDelete(`org:${org_id}:*`);

        this.log.info(`Cache invalidation complete: org — ${deleted} key(s) deleted`);
        res.json({success: true, data: {deleted}, timestamp: new Date().toISOString()});
    };

    private async scanDelete(pattern: string): Promise<number> {
        const keys = await this.redis.keys(pattern);
        let deleted = 0;
        for (const key of keys) {
            if (await this.redis.del(key)) deleted++;
        }
        return deleted;
    }
}
