import 'reflect-metadata';
import crypto from 'crypto';
import {ClassLogger, pickDefined} from "@holokai/sdk";
import type {Auth} from "@holokai/types/api";
import type {Application, HoloToken} from "@holokai/types/entities";
import {injectable} from "tsyringe";
import {TokenService} from "./token.service";
import {HoloApiRequest} from "../../api/types";
import {UnauthorizedError} from "express-jwt";
import {HoloTokenService} from "./holo.token.service";
import {ApplicationService} from "../entities";
import {AccessService} from "./access.service";
import {RedisService} from "../redis.service";

const AUTH_CACHE_TTL = 120;

function buildAuth(
    tokenType: Auth['tokenType'],
    organizationId: string,
    applications: Application[],
    application?: Application,
    userId?: string,
    clientIdentifier?: string,
): Auth {
    return pickDefined({
        organizationId,
        userId,
        tokenType,
        application,
        applications,
        clientIdentifier,
    }) as Auth;
}

export function extractToken(req: HoloApiRequest): string | undefined {
    let token = req.headers['x-api-key'] as string | undefined;
    if (!token) {
        const h = req.headers.authorization;
        if (h?.startsWith('Bearer ')) token = h.slice(7).trim();
    }
    return token;
}

export function extractAppSlug(req: HoloApiRequest): string | undefined {
    const {appSlug: paramsAppSlug} = req.params;
    return (req as any).appSlug || paramsAppSlug;
}

@injectable()
export class AuthService extends ClassLogger {

    constructor(
        private tokenService: TokenService,
        private holoTokenService: HoloTokenService,
        private applicationService: ApplicationService,
        private accessService: AccessService,
        private redis: RedisService,
    ) {
        super();
    }

    async authenticateHoloToken(rawToken: string, appSlug?: string, provider?: string): Promise<Auth> {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const cacheKey = `auth:${tokenHash}:${appSlug || '*'}`;

        const cached = await this.redis.get<Auth>(cacheKey);
        if (cached) return cached;

        const holoToken = await this.holoTokenService.verify(rawToken);
        if (!holoToken) {
            throw new UnauthorizedError('invalid_token', {message: 'Authentication failed: Invalid or expired token.'});
        }

        let auth: Auth;
        if (holoToken.application_id) {
            auth = await this.resolveAppToken(holoToken, appSlug, provider);
        } else if (holoToken.user_id) {
            auth = await this.resolveUserToken(holoToken, appSlug, provider);
        } else {
            throw new UnauthorizedError('invalid_token', {message: 'Token has neither user_id nor application_id.'});
        }

        this.redis.set(cacheKey, auth, AUTH_CACHE_TTL).catch(err =>
            this.log.error(`Failed to cache auth result: ${err.message}`)
        );

        return auth;
    }

    async authenticateJwt(token: string, appSlug?: string, provider?: string, useCache: boolean = true): Promise<Auth> {
        const logger = this.mlog(this.authenticateJwt);
        const appSlugs = await this.tokenService.getAppSlugs(token, useCache);
        if (!appSlugs) {
            return Promise.reject('User is not provisioned with any applications.');
        }

        if (appSlug && !appSlugs.includes(appSlug)) {
            return Promise.reject('User is not authorized for application.');
        }

        const decodedToken = this.tokenService.decodeToken(token);
        const {organizationId, sub: userId, email} = decodedToken;

        let clientIdentifier = email ?? await this.accessService.getUserEmailById(organizationId, userId);

        if (!clientIdentifier) {
            return Promise.reject('User no longer exists.');
        }

        logger.info(`User [${clientIdentifier}] logged in via JWT Token.`);

        const allApplications = await this.applicationService.getBySlugs(organizationId, appSlugs);

        let application: Application | undefined;
        if (appSlug) {
            application = allApplications.find(a => a.url_slug === appSlug);
            if (!application) {
                return Promise.reject(`Application ${appSlug} no longer available.`);
            }
            if (provider && application.provider!.type.toUpperCase() !== provider.toUpperCase()) {
                return Promise.reject(`Application ${appSlug} supports ${application.provider!.type}, not ${provider}`);
            }
        }

        let filtered = allApplications;
        if (provider) {
            filtered = allApplications.filter(a => a.provider!.type.toUpperCase() === provider.toUpperCase());
            if (!filtered.length) {
                return Promise.reject(`User is not authorized for this provider: ${provider}.`);
            }
        }

        if (!application && !filtered.length) {
            return Promise.reject('User is not authorized for any providers.');
        }

        return buildAuth('jwt', organizationId, filtered, application, userId, clientIdentifier);
    }

    async authenticateAnonymous(appSlug: string, provider?: string): Promise<Auth> {
        const application = await this.applicationService.getBySlugUnscoped(appSlug);
        if (!application || application.access_level !== 'anonymous') {
            throw new UnauthorizedError('credentials_required', {message: 'Authentication failed: No token provided.'});
        }
        if (provider && application.provider!.type.toUpperCase() !== provider.toUpperCase()) {
            return Promise.reject(`Application ${appSlug} supports ${application.provider!.type}, not ${provider}`);
        }
        return buildAuth('anonymous', application.organization_id, [application], application);
    }

    async invalidateByTokenHash(tokenHash: string): Promise<void> {
        const keys = await this.redis.keys(`auth:${tokenHash}:*`);
        for (const key of keys) await this.redis.del(key);
    }

    async invalidateByAppSlug(appSlug: string): Promise<void> {
        const keys = await this.redis.keys(`auth:*:${appSlug}`);
        for (const key of keys) await this.redis.del(key);
    }

    private async resolveAppToken(holoToken: HoloToken, appSlug?: string, provider?: string): Promise<Auth> {
        if (!appSlug) {
            return Promise.reject('Application tokens can only access app-specific endpoints.');
        }

        const application = await this.applicationService.getById(holoToken.application_id!);
        if (!application) {
            return Promise.reject('Token application no longer available.');
        }

        if (application.url_slug !== appSlug) {
            return Promise.reject('Application token is not authorized for this application.');
        }

        if (provider && application.provider!.type.toUpperCase() !== provider.toUpperCase()) {
            return Promise.reject(`Application supports ${application.provider!.type}, not ${provider}`);
        }

        return buildAuth('holo_application', holoToken.organization_id, [application], application);
    }

    private async resolveUserToken(holoToken: HoloToken, appSlug?: string, provider?: string): Promise<Auth> {
        const orgId = holoToken.organization_id;
        const userId = holoToken.user_id!;

        if (appSlug) {
            const application = await this.applicationService.getBySlug(orgId, appSlug);
            if (!application) {
                return Promise.reject(`Application ${appSlug} not found.`);
            }

            const allowed = await this.accessService.hasAccess(orgId, userId, application.id);
            if (!allowed) {
                return Promise.reject('User is not authorized for this application.');
            }

            if (provider && application.provider!.type.toUpperCase() !== provider.toUpperCase()) {
                return Promise.reject(`Application ${appSlug} supports ${application.provider!.type}, not ${provider}`);
            }

            return buildAuth('holo_user', orgId, [application], application, userId);
        }

        const accessibleIds = await this.accessService.getAccessibleApplicationIds(userId, orgId);
        const allApps = await this.applicationService.getAllByOrg(orgId);
        let accessible = allApps.filter(a => accessibleIds.includes(a.id));

        if (provider) {
            accessible = accessible.filter(a => a.provider!.type.toUpperCase() === provider.toUpperCase());
            if (!accessible.length) {
                return Promise.reject(`User is not authorized for this provider: ${provider}.`);
            }
        }

        if (!accessible.length) {
            return Promise.reject('User is not authorized for any applications.');
        }

        return buildAuth('holo_user', orgId, accessible, undefined, userId);
    }
}
