import 'reflect-metadata';
import {inject, injectable} from 'tsyringe';
import {HoloApiRequest} from "../api/types";
import {Response} from "express";
import {ResponseService} from "./response.service";
import {env} from "../env";
import {GuardService} from "./guard.service";
import {WorkerRequestFactory} from "./worker.request.factory";
import {ClassLogger} from "@holokai/sdk";
import type {INotificationService} from '@holokai/types/notification';
import {NotificationEventFactory, NotificationServiceToken} from "@holokai/sdk/notification";
import {Application, Plugin, Protocol, Provider} from "@holokai/types/entities";
import {ProviderImplService} from "./plugin";
import {AccessService} from "./auth/access.service";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        private readonly providerImplService: ProviderImplService,
        private readonly accessService: AccessService,
        @inject(NotificationServiceToken) readonly notificationService: INotificationService
    ) {
        super();
    }

    async processRequest(plugin: Plugin, protocol: Protocol, req: HoloApiRequest, res: Response, isPassthrough: boolean = false) {
        const logger = this.mlog(this.processRequest);
        const {auth} = req;

        if (!auth) {
            throw new Error('Unauthorized request. No auth object found.');
        }

        let {application, applications} = auth;
        let provider = null;

        if (!application) {
            if (!applications.length) {
                throw new Error('Unauthorized request. No app or available apps found.');
            }
            logger.debug(`No app defined, finding ${plugin.family} in applications`);
            for (const candidate of applications) {
                const candidateProvider = candidate.provider!;
                if (candidateProvider.plugin_id === plugin.id) {
                    provider = await this.providerImplService.getProviderImplById(candidateProvider.id);
                    const modelName = await provider.getModelNameFromRequest(req.body);
                    if (modelName && auth.userId && await this.accessService.hasModelAccess(auth.organizationId, auth.userId, candidate.id, modelName)) {
                        logger.debug(`No app declared. Defaulting to: ${candidate.url_slug}`);
                        application = candidate;
                        break;
                    }
                }
            }

            if (!application) {
                throw new Error('Unauthorized request. No authorized apps have the model requested.');
            }
        }

        req.auth!.application = application;
        logger.info(`Creating request for application: ${application.name} and provider: ${application.provider!.name}`);
        const workerRequest = await this.parseRequest(application.provider!, protocol, req, application, isPassthrough);

        if (application.guards?.length) {
            if (!provider) {
                provider = await this.providerImplService.getProviderImplById(application.provider!.id);
            }
            const guardDetails = application.guards.map(g => ({
                id: g.id,
                name: g.model,
                provider: g.provider
            }));
            logger.debug(`Executing ${application.guards.length} guard(s) for request: ${JSON.stringify(guardDetails)}`);
            await this.notificationService.publish(NotificationEventFactory.fromAuthAndRequest('guard_started', auth, workerRequest, 'Running guards'));
            const results = await this.guardService.guard(provider, workerRequest, application.guards, auth);
            await this.notificationService.publish(NotificationEventFactory.fromAuthAndRequest(results?.passed ? 'guard_passed' : 'guard_failed', auth, workerRequest, 'Running guards'));
        }

        await this.notificationService.publish(NotificationEventFactory.fromAuthAndRequest('request_started', auth, workerRequest, 'Request started'));
        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${protocol.name}`, {
            requestId: workerRequest.requestId
        });
    }

    async parseRequest(provider: Provider, protocol: Protocol, req: HoloApiRequest, application: Application, isPassthrough: boolean = false) {
        return WorkerRequestFactory.fromRequest(provider, protocol, req, this.serverId, application, isPassthrough);
    }
}
