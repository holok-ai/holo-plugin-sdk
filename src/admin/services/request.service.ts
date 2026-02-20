import 'reflect-metadata';
import {inject, injectable} from 'tsyringe';
import {HoloApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {WorkerRequestFactory} from "../../types";
import {ClassLogger, RequestType} from "@holokai/sdk";
import {NotificationEventFactory, NotificationServiceToken} from "@holokai/sdk/notification";
import {NotificationService} from "../../services/notification/notification.service";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        @inject(NotificationServiceToken) readonly notificationService: NotificationService
    ) {
        super();
    }

    async processRequest(providerType: string, type: RequestType, req: HoloApiRequest, res: Response, isPassthrough: boolean = false) {
        const logger = this.mlog(this.processRequest);
        const {auth} = req;

        if (!auth || !auth.app) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        const {app} = auth;

        const workerRequest = await this.parseRequest(providerType, app.providerName, type, req, isPassthrough);

        if (app.guards && app.guards.length) {
            const guardDetails = app.guards.map(g => ({
                id: g.id,
                name: g.modelName,
                provider: g.providerName
            }));
            logger.debug(`Executing ${app.guards.length} guard(s) for request: ${JSON.stringify(guardDetails)}`);
            await this.notificationService.publish(NotificationEventFactory.fromAuthAndRequest('guard_started', auth, workerRequest, 'Running guards'));
            const results = await this.guardService.guard(workerRequest, app.guards, auth);
            await this.notificationService.publish(NotificationEventFactory.fromAuthAndRequest(results?.passed ? 'guard_passed' : 'guard_failed', auth, workerRequest, 'Running guards'));
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId, isPassthrough});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HoloApiRequest, isPassthrough: boolean = false) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId, isPassthrough);
    }
}