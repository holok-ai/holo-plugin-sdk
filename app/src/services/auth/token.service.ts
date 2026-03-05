import 'reflect-metadata';
import {injectable} from 'tsyringe';
import jwt from 'jsonwebtoken';
import {env} from '../../env';
import {JWTPayload, TokenRefreshRequest, TokenRefreshResponse} from '../../types';
import logger from '../../utils/logger';
import {RedisService} from "../redis.service";

const DEFAULT_TTL = 3600;

@injectable()
export class TokenService {

    private readonly _fetch = globalThis.fetch.bind(globalThis);
    private readonly inFlight = new Map<string, Promise<string[] | null>>();

    constructor(private readonly redis: RedisService) {
    }

    async getAppSlugs(token: string, useCache = true): Promise<string[] | null> {
        if (useCache) {
            const hit = await this.redis.get<string[]>(token);
            logger.debug(`Cache hit: ${!!hit}`);
            if (hit) return hit;
        }

        const existing = this.inFlight.get(token);
        if (existing) return existing;

        const p = this.refreshToken(token)
            .then((accessToken) => accessToken ? this.extractAppSlugs(accessToken) : [])
            .then(async (slugs) => {
                if (slugs?.length) await this.redis.set(token, slugs, DEFAULT_TTL);
                return slugs;
            })
            .finally(() => this.inFlight.delete(token));

        this.inFlight.set(token, p);
        return p;
    }

    async invalidate(token: string) {
        await this.redis.del(token);
        this.inFlight.delete(token);
    }

    decodeToken(token: string): JWTPayload {
        return jwt.verify(token, env.jwtConfig.secret, {
            algorithms: [env.jwtConfig.algorithm],
            clockTolerance: 5,
        }) as JWTPayload;
    }

    async refreshToken(originalToken: string): Promise<string | null> {
        if (!env.mokuUrl) {
            logger.error('MOKU_URL not configured for token refresh');
            return null;
        }

        try {
            const resp = await this._fetch(`${env.mokuUrl}/api/auth/token/refresh`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(<TokenRefreshRequest>{apiKey: originalToken}),
                signal: AbortSignal.timeout(10_000),
            });

            if (!resp.ok) {
                const body = await resp.text().catch(() => '');
                logger.warn('Token refresh failed', {
                    status: resp.status,
                    statusText: resp.statusText,
                    body: body.slice(0, 512),
                });
                return null;
            }

            const data = (await resp.json()) as TokenRefreshResponse;
            if (!data?.accessToken) {
                logger.warn('Token refresh response missing accessToken');
                return null;
            }

            return data.accessToken
        } catch (e) {
            logger.error('Token refresh error', {name: (e as Error).name, error: (e as Error).message});
            return null;
        }
    }

    private async extractAppSlugs(accessToken: string): Promise<string[] | null> {
        try {
            const auth = this.decodeToken(accessToken);

            const slugs = auth?.appSlugs;
            if (!Array.isArray(slugs)) {
                logger.debug('JWT missing appSlugs - user can only access direct provider endpoints', {
                    hasAppSlugs: !!slugs,
                    appSlugsType: typeof slugs,
                });
                return null;
            }

            if (typeof auth.exp === 'number') {
                const ttl = Math.max(1, auth.exp - Math.floor(Date.now() / 1000));
                await this.redis.set(accessToken, slugs, ttl);
            }
            return slugs;
        } catch (e) {
            const err = e as Error;
            const kind =
                e instanceof jwt.TokenExpiredError ? 'expired' :
                    e instanceof jwt.JsonWebTokenError ? 'invalid' : 'verify_error';
            logger.warn('Failed to extract appSlugs from access token', {
                kind,
                msg: err.message,
                tokenLen: accessToken.length
            });
            return null;
        }
    }
}
