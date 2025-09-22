import 'reflect-metadata';
import {injectable} from 'tsyringe';
import jwt from 'jsonwebtoken';
import NodeCache from 'node-cache';
import {env} from '../../env';
import {AdminJWTPayload, TokenRefreshRequest, TokenRefreshResponse} from '../types';
import logger from '../../utils/logger';
import {HoloConfigAction, JwtTokenConfig, JwtTokenConfigData} from "../types";
import {JwtTokenConfigValidator} from "../validators";

@injectable()
export class TokenService {

    //TODO: Replace with proper auditing
    private invalidatedTokens: Set<string> = new Set();
    private readonly _fetch = globalThis.fetch.bind(globalThis);

    private cache = new NodeCache({
        stdTTL: 3600,
        checkperiod: 300,
        useClones: false,
        maxKeys: 5000,
    });

    private readonly inFlight = new Map<string, Promise<string[] | null>>();

    constructor() {
    }

    async getUrlSlugs(token: string, useCache = true): Promise<string[] | null> {
        if (useCache) {
            const hit = this.cache.get<string[]>(token);
            if (hit) return hit;
        }

        const existing = this.inFlight.get(token);
        if (existing) return existing;

        const p = this.refreshAndVerify(token)
            .then((slugs) => {
                if (slugs?.length) this.cache.set(token, slugs); // TTL falls back to stdTTL
                return slugs;
            })
            .finally(() => this.inFlight.delete(token));

        this.inFlight.set(token, p);
        return p;
    }

    applyConfig(c: JwtTokenConfig) {
        const config = JwtTokenConfigValidator.assert(c);
        switch (config.action) {
            case HoloConfigAction.DELETE:
                this.invalidateByCriteria(config.data);
                break;
            default:
                logger.warn(`Unsupported JwtToken config action: ${config.action}`);
        }
    }

    //TODO: For performance, update to add onto an array, and then invalidate in bulk
    invalidateByCriteria(filter: JwtTokenConfigData) {
        for (const data of filter.data) {
            const {token, userId, organizationId} = data;
            if (token) {
                this.invalidate(token);
            }
            for (const token of this.cache.keys()) {
                const decoded = this.decodeToken(token);
                if (userId === filter?.userId || decoded?.organizationId === organizationId) {
                    this.invalidate(token);
                }
            }
        }
    }

    //TODO: Support bulk
    invalidate(token: string) {
        if (this.cache.del(token)) this.invalidatedTokens.add(token);
        this.inFlight.delete(token);
    }

    decodeToken(token: string): AdminJWTPayload {
        return jwt.verify(token, env.jwtConfig.secret, {
            algorithms: [env.jwtConfig.algorithm],
            clockTolerance: 5,
        }) as AdminJWTPayload;
    }

    private async refreshAndVerify(originalToken: string): Promise<string[] | null> {
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

            return this.extractUrlSlugs(data.accessToken);
        } catch (e) {
            logger.error('Token refresh error', {name: (e as Error).name, error: (e as Error).message});
            return null;
        }
    }

    private extractUrlSlugs(accessToken: string): string[] | null {
        try {
            const decoded = this.decodeToken(accessToken);
            const slugs = decoded?.urlSlugs;
            if (!Array.isArray(slugs)) {
                logger.warn('Invalid JWT structure: missing or invalid urlSlugs', {
                    hasUrlSlugs: !!slugs,
                    urlSlugsType: typeof slugs,
                });
                return null;
            }

            // Optional: align cache TTL to access token exp if present
            if (typeof decoded.exp === 'number') {
                const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
                this.cache.set(accessToken, slugs, ttl);
            }

            logger.debug('Extracted urlSlugs', {urlSlugsCount: slugs.length});
            return slugs;
        } catch (e) {
            const err = e as Error;
            const kind =
                e instanceof jwt.TokenExpiredError ? 'expired' :
                    e instanceof jwt.JsonWebTokenError ? 'invalid' : 'verify_error';
            logger.warn('Failed to extract urlSlugs from access token', {
                kind,
                msg: err.message,
                tokenLen: accessToken.length
            });
            return null;
        }
    }
}
