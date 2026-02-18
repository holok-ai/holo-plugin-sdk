import 'reflect-metadata';
import {ApplicationConfigProps, Auth, ClassLogger, pickDefined} from "@holokai/sdk";
import {injectable} from "tsyringe";
import {OrganizationService} from "./organization.service";
import {TokenService} from "./token.service";
import {HoloApiRequest} from "../../api/types";
import {UnauthorizedError} from "express-jwt";

@injectable()
export class AuthService extends ClassLogger {

    constructor(
        private tokenService: TokenService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    async populateAuth(req: HoloApiRequest, useCache: boolean = true, provider?: string): Promise<Auth> {
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
            if (provider && app.providerType !== provider.toUpperCase()) {
                return Promise.reject(`Application ${appSlug} supports ${app.providerType}, not support ${provider}`);
            }
        }

        const availableApps = new Array<ApplicationConfigProps>();
        let availableApp;
        if (appSlugs) {
            for (const appSlug of appSlugs) {
                availableApp = this.organizationService.getApplication(organizationId, appSlug);
                if (!availableApp) {
                    logger.warn(`Application ${appSlug} in user credentials but no longer available.`);
                    continue;
                }
                if (provider && availableApp.providerType.toUpperCase() !== provider.toUpperCase()) continue;
                availableApps.push(availableApp);
            }

            if (provider && !availableApps.length) {
                return Promise.reject(`User is not authorized for this provider: ${provider}.`);
            }
        }

        if (!app && !availableApps.length) {
            return Promise.reject(`User is not authorized for any providers.`);
        }

        return pickDefined({
            organizationId,
            userId,
            providerName: app?.providerName,
            app,
            availableApps
        }) as Auth;
    }
}