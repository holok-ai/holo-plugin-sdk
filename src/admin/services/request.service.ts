import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {WorkerRequestFactory} from "../../types";
import {ClassLogger, RequestType} from "@holokai/sdk";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService
    ) {
        super();
    }

    async processRequest(providerType: string, type: RequestType, req: HttpApiRequest, res: Response, isPassthrough: boolean = false) {
        const logger = this.mlog(this.processRequest);
        const {auth} = req;

        if (!auth) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        // App is only required for custom routes with appSlug
        // Direct provider routes (/api/provider/*) don't need an app
        if (req.appSlug && !auth.app) {
            throw new Error('Application configuration not found for specified appSlug.');
        }

        const {app} = auth;

        // For custom routes (/api/custom/:provider/:appSlug/*), use app's provider
        // For direct routes (/api/ollama/api/chat), use route's provider
        const providerName = req.appSlug && app ? app.providerName : providerType;

        const workerRequest = await this.parseRequest(providerType, providerName, type, req, isPassthrough);

        // Guards only apply when explicitly routing through an app (appSlug present)
        // Direct provider endpoints (/api/provider/*) bypass app-level guards
        if (req.appSlug && app) {
            logger.debug(`App-routed request: appSlug=${req.appSlug}, guards=${app.guards ? `[${app.guards.length}]` : 'none'}`);

            if (app.guards && app.guards.length) {
                const guardDetails = app.guards.map(g => ({
                    id: g.id,
                    name: g.modelName,
                    provider: g.providerName
                }));
                logger.debug(`Executing ${app.guards.length} guard(s) for request: ${JSON.stringify(guardDetails)}`);
                await this.guardService.guard(workerRequest, app.guards, auth);
                logger.debug(`All ${app.guards.length} guard(s) passed`);
            } else {
                logger.debug(`No guards configured for application ${req.appSlug} - skipping guard execution`);
            }
        } else {
            logger.debug(`Direct provider endpoint - bypassing app-level guards (no appSlug)`);
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId, isPassthrough});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HttpApiRequest, isPassthrough: boolean = false) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId, isPassthrough);
    }
}