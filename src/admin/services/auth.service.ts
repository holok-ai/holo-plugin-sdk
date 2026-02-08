import 'reflect-metadata';
import {ApplicationConfigProps, ClassLogger, pickDefined} from "@holokai/sdk";
import {injectable} from "tsyringe";
import {OrganizationService} from "./organization.service";
import {TokenService} from "./token.service";
import {HoloApiRequest} from "../../api/types";
import {Auth} from "../types";
import {UnauthorizedError} from "express-jwt";

@injectable()
export class AuthService extends ClassLogger {

    constructor(
        private tokenService: TokenService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    async populateAuth(provider: string, req: HoloApiRequest, useCache: boolean = true): Promise<Auth> {
        const logger = this.mlog(this.populateAuth);
        let token = req.headers['x-api-key'] as string | undefined;
        if (!token) {
            const h = req.headers.authorization;
            if (h?.startsWith('Bearer ')) token = h.slice(7).trim();
        }

        if (!token) {
            throw new UnauthorizedError('credentials_required', {message: 'Authentication failed: No token provided.'})
        }

        const appSlugs = await this.tokenService.getAppSlugs(token, useCache);
        if (!appSlugs) {
            return Promise.reject('User is not provisioned with any applications.');
        }

        const {appSlug: paramsAppSlug} = req.params;
        const appSlug = (req as any).appSlug || paramsAppSlug;

        if (appSlug && !appSlugs.includes(appSlug)) {
            return Promise.reject('User is not authorized for application.');
        }
        const decodedToken = this.tokenService.decodeToken(token);
        const {organizationId, userId} = decodedToken;

        let app: ApplicationConfigProps | undefined = undefined;

        // we were either routed via a specific app / agent URL
        if (appSlug) {
            app = this.organizationService.getApplication(organizationId, appSlug);
            if (!app) {
                return Promise.reject(`Application ${appSlug} no longer available.`);
            }
            if (app.providerType !== provider.toUpperCase()) {
                return Promise.reject(`Application support ${app.providerType}, not support ${provider}`);
            }
        } else if (appSlugs) {
            for (const appSlug of appSlugs) {
                app = this.organizationService.getApplication(organizationId, appSlug);
                if (!app) {
                    logger.warn(`Application ${appSlug} in user credentials but no longer available.`);
                }
                if (app?.providerType === provider.toUpperCase()) break;
            }
            if (!app) {
                return Promise.reject(`No applications configured for provider: ${provider}`);
            }
        }

        return pickDefined({
            organizationId,
            userId,
            providerName: app?.providerName,
            app
        }) as Auth;
    }
}