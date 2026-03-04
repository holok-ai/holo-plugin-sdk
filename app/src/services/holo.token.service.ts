import 'reflect-metadata';
import crypto from 'crypto';
import {injectable} from 'tsyringe';
import {ClassLogger, pickDefined} from '@holokai/sdk';
import {HoloTokenDB} from '../db';
import {RedisService} from '../admin/services';
import {HoloToken} from '@holokai/types/entities';

const TOKEN_PREFIX = 'holo_';
const REDIS_KEY_PREFIX = 'holo_token:';
const REDIS_TTL_SECONDS = 300;

interface GenerateOptions {
    user_id?: string;
    application_id?: string;
    name?: string;
    expires_at?: Date;
}

@injectable()
export class HoloTokenService extends ClassLogger {
    constructor(
        private holoTokenDB: HoloTokenDB,
        private redisService: RedisService,
    ) {
        super();
    }

    async generate(organizationId: string, opts: GenerateOptions): Promise<{ token: string; record: HoloToken }> {
        const rawToken = TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url');
        const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const keySuffix = rawToken.slice(-4);

        const record = await this.holoTokenDB.create({
            organization_id: organizationId,
            key_hash: keyHash,
            key_prefix: TOKEN_PREFIX,
            key_suffix: keySuffix,
            ...pickDefined(opts),
        });

        return {token: rawToken, record};
    }

    async verify(rawToken: string): Promise<HoloToken | null> {
        const logger = this.mlog(this.verify);
        const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const cached = await this.redisService.get<HoloToken>(`${REDIS_KEY_PREFIX}${keyHash}`);
        if (cached) {
            if (cached.expires_at && new Date(cached.expires_at) < new Date()) {
                return null;
            }
            this.holoTokenDB.updateLastUsed(cached.id).catch(err =>
                logger.error(`Failed to update last_used_at: ${err.message}`)
            );
            return cached;
        }

        const record = await this.holoTokenDB.getByHash(keyHash);
        if (!record || !record.active) {
            return null;
        }

        if (record.expires_at && new Date(record.expires_at) < new Date()) {
            return null;
        }

        this.redisService.set(`${REDIS_KEY_PREFIX}${keyHash}`, record, REDIS_TTL_SECONDS).catch(err =>
            logger.error(`Failed to cache token in Redis: ${err.message}`)
        );

        this.holoTokenDB.updateLastUsed(record.id).catch(err =>
            logger.error(`Failed to update last_used_at: ${err.message}`)
        );

        return record;
    }
}
