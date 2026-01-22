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

    async processRequest(providerType: string, type: RequestType, req: HttpApiRequest, res: Response) {
        const logger = this.mlog(this.processRequest);
        const {auth} = req;

        if (!auth || !auth.app) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        const {providerName, app} = auth;

        const workerRequest = await this.parseRequest(providerType, providerName, type, req);

        if (workerRequest.isStreaming) {
            await this.responseService.createStream(workerRequest.requestId, true);
        }

        if (app.guards && app.guards.length) {
            logger.info(`Guards found: ${JSON.stringify(app.guards, null, 2)}`);
            await this.guardService.guard(workerRequest, app.guards, auth);
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HttpApiRequest) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId);
    }
}