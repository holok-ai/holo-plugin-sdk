import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {WorkerRequestFactory} from "../../types";
import {OrganizationService} from "./organization.service";
import {ClassLogger, RequestType} from "@holokai/sdk";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    async processRequest(providerType: string, type: RequestType, req: HttpApiRequest, res: Response) {
        const logger = this.mlog(this.processRequest);
        const errors: string[] = [];
        const {auth, body} = req;
        const {model = "unknown"} = body;

        let provider: any = undefined;

        if (auth?.organizationId && auth.appSlugs) {
            for (const appSlug of auth.appSlugs) {
                provider = this.organizationService.getProviderByModel(auth.organizationId, appSlug, model);
                if (provider) break;
            }
        }

        const workerRequest = await this.parseRequest(providerType, provider?.name, type, req);

        if (!provider) {
            logger.error(`Provider not found for ${providerType} ${type}, auth: ${JSON.stringify(auth, null, 2)}`, {
                requestId: workerRequest.requestId,
            });
            errors.push(
                `An error occurred while trying to process your request. Please contact your administrator and refer to ${workerRequest.requestId}.`
            );
            workerRequest.errors = errors;
        } else if (workerRequest.isStreaming) {
            await this.responseService.createStream(workerRequest.requestId, true);
        }

        if (provider) {
            await this.guardService.guard(providerType, type, workerRequest, auth);
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HttpApiRequest) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId);
    }
}