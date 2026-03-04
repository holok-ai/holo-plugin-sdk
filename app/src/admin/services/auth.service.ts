import 'reflect-metadata';
import {ClassLogger, pickDefined} from "@holokai/sdk";
import type {ApplicationConfigProps, PromptConfigProps} from "@holokai/types/config";
import type {Auth} from "@holokai/types/api";
import type {Application, Prompt} from "@holokai/types/entities";
import {injectable} from "tsyringe";
import {TokenService} from "./token.service";
import {ApplicationService} from "../../services/application.service";
import {HoloApiRequest} from "../../api/types";
import {UnauthorizedError} from "express-jwt";

function promptToConfigProps(p: Prompt): PromptConfigProps {
    const result: PromptConfigProps = {
        id: p.id,
        userPrompt: p.user_prompt,
        providerName: p.provider,
        modelName: p.model ?? '',
    };
    if (p.system_prompt) result.systemPrompt = p.system_prompt;
    if (p.output_schema) result.outputSchema = p.output_schema;
    return result;
}

function applicationToConfigProps(a: Application): ApplicationConfigProps {
    const result: ApplicationConfigProps = {
        urlSlug: a.url_slug,
        organizationId: a.organization_id,
        providerName: a.provider!.name,
        providerType: a.provider!.type,
        models: (a.models ?? []).map(m => ({
            name: m.name,
            accessModel: m.access_model ?? m.name,
            providerName: a.provider!.name,
        })),
        guards: (a.guards ?? []).map(promptToConfigProps),
        evaluators: [],
    };
    if (a.system_prompt) result.systemPrompt = promptToConfigProps(a.system_prompt);
    return result;
}

@injectable()
export class AuthService extends ClassLogger {

    constructor(
        private tokenService: TokenService,
        private applicationService: ApplicationService,
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

        const allApplications = await this.applicationService.getBySlugs(organizationId, appSlugs);

        let application: Application | undefined;
        if (appSlug) {
            logger.debug(`Looking up application: orgId=${organizationId}, appSlug=${appSlug}`);
            application = allApplications.find(a => a.url_slug === appSlug);
            if (!application) {
                logger.error(`Application ${appSlug} not found`, {organizationId, appSlug, provider});
                return Promise.reject(`Application ${appSlug} no longer available.`);
            }
            if (provider && application.provider!.type.toUpperCase() !== provider.toUpperCase()) {
                return Promise.reject(`Application ${appSlug} supports ${application.provider!.type}, not ${provider}`);
            }
        }

        let filteredApplications = allApplications;
        if (provider) {
            filteredApplications = allApplications.filter(
                a => a.provider!.type.toUpperCase() === provider.toUpperCase()
            );
            if (!filteredApplications.length) {
                return Promise.reject(`User is not authorized for this provider: ${provider}.`);
            }
        }

        if (!application && !filteredApplications.length) {
            return Promise.reject(`User is not authorized for any providers.`);
        }

        const app = application ? applicationToConfigProps(application) : undefined;
        const availableApps = filteredApplications.map(applicationToConfigProps);

        return pickDefined({
            organizationId,
            userId,
            providerName: app?.providerName,
            app,
            availableApps,
            application,
            applications: filteredApplications,
        }) as Auth;
    }
}
