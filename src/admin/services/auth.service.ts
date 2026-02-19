import 'reflect-metadata';
import {ClassLogger, pickDefined} from "@holokai/sdk";
import {injectable} from "tsyringe";
import {OrganizationService} from "./organization.service";
import {Application} from "../../cache";
import {TokenService} from "./token.service";
import {HttpApiRequest} from "../../api/types";
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

    async populateAuth(provider: string, req: HttpApiRequest, useCache: boolean = true): Promise<Auth> {
        const logger = this.mlog(this.populateAuth);
        let token = req.headers['x-api-key'] as string | undefined;
        if (!token) {
            const h = req.headers.authorization;
            if (h?.startsWith('Bearer ')) token = h.slice(7).trim();
        }

        if (!token) {
            throw new UnauthorizedError('credentials_required', {message: 'Authentication failed: No token provided.'})
        }

        const {appSlug: paramsAppSlug} = req.params;
        const appSlug = (req as any).appSlug || paramsAppSlug;

        // Only validate appSlugs if accessing a custom endpoint (with appSlug)
        // Direct provider endpoints don't require app provisioning
        let appSlugs: string[] | null = null;
        if (appSlug) {
            appSlugs = await this.tokenService.getAppSlugs(token, useCache);
            if (!appSlugs) {
                return Promise.reject('User is not provisioned with any applications.');
            }
            if (!appSlugs.includes(appSlug)) {
                return Promise.reject('User is not authorized for application.');
            }
        }
        const decodedToken = this.tokenService.decodeToken(token);
        const {organizationId, userId} = decodedToken;

        logger.debug(`Token decoded: orgId=${organizationId}, userId=${userId}, appSlug=${appSlug || 'none'}, appSlugs=${appSlugs?.join(',') || 'not-checked'}`);


        let app: Application | undefined = undefined;

        // we were either routed via a specific app / agent URL
        if (appSlug) {
            logger.debug(`Looking up application: orgId=${organizationId}, appSlug=${appSlug}`);
            app = this.organizationService.getApplication(organizationId, appSlug);
            if (!app) {
                logger.error(`Application ${appSlug} not found in cache`, {
                    organizationId,
                    appSlug,
                    provider,
                    orgExists: !!this.organizationService.withOrganization(organizationId),
                    allAppsForOrg: this.organizationService.withOrganization(organizationId)?.getAll('applications').map(a => a.urlSlug)
                });
                return Promise.reject(`Application ${appSlug} no longer available.`);
            }
            if (app.providerType !== provider.toUpperCase()) {
                return Promise.reject(`Application support ${app.providerType}, not support ${provider}`);
            }
        } else {
            // Direct provider endpoint - no app configuration needed
            // Provider comes from the endpoint definition, not app configuration
            logger.debug(`No appSlug specified - direct provider endpoint (provider=${provider}), skipping app lookup`);
        }

        return pickDefined({
            organizationId,
            userId,
            providerName: app?.providerName,
            app
        }) as Auth;
    }
}