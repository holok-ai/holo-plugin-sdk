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

        if (!auth || !auth.app) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        const {app} = auth;

        // For custom routes (/api/custom/:provider/:appSlug/*), use app's provider
        // For direct routes (/api/ollama/api/chat), use route's provider
        const providerName = req.appSlug ? app.providerName : providerType;

        const workerRequest = await this.parseRequest(providerType, providerName, type, req, isPassthrough);

        // Log guard configuration details
        logger.debug(`Guard determination: app.guards=${app.guards ? `[${app.guards.length} guards]` : 'undefined'}, appSlug=${req.appSlug}`);

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
            logger.debug(`No guards configured for this application - skipping guard execution`);
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId, isPassthrough});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HttpApiRequest, isPassthrough: boolean = false) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId, isPassthrough);
    }
}