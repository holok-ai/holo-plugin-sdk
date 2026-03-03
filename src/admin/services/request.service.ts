import 'reflect-metadata';
import {inject, injectable} from 'tsyringe';
import {HoloApiRequest} from "../../api/types";
import {Response} from "express";
import {ProviderService, ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {WorkerRequestFactory} from "../../types";
import {ClassLogger} from "@holokai/sdk";
import {RequestType} from "@holokai/types/holo";
import type {INotificationService} from '@holokai/types/notification';
import {NotificationEventFactory, NotificationServiceToken} from "@holokai/sdk/notification";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        private readonly providerService: ProviderService,
        @inject(NotificationServiceToken) readonly notificationService: INotificationService
    ) {
        super();
    }

    async processRequest(providerType: string, type: RequestType, req: HoloApiRequest, res: Response, isPassthrough: boolean = false) {
        const logger = this.mlog(this.processRequest);
        const {auth} = req;

        if (!auth) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        let {app, availableApps} = auth;

        if (!app) {
            if (!availableApps.length) {
                throw new Error('Unauthorized request. No app or available apps found.');
            }
            logger.debug(`No app defined, finding ${providerType} in availableApps`);
            for (const availableApp of availableApps) {
                if (availableApp.providerType.toUpperCase() === providerType.toUpperCase()) {
                    const provider = await this.providerService.matchProvider(availableApp.providerName);
                    const modelName = await provider.getModelNameFromRequest(req.body);
                    if (modelName) {
                        logger.debug(`No app declared. Defaulting to: ${availableApp.urlSlug}`);
                        app = availableApp;
                        break;
                    }
                }
            }

            if (!app) {
                throw new Error('Unauthorized request. No authorized apps have the model requested.');
            }
        }

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