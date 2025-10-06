import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ProviderType, RequestType} from "../../providers/types";
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {ClassLogger} from "../../types/class.logger";
import {WorkerRequestFactory} from "../../types";
import {OrganizationService} from "./organization.service";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService,
        private organizationService: OrganizationService,
    ) {
        super();
    }

    async processRequest(providerType: ProviderType, type: RequestType, req: HttpApiRequest, res: Response) {
        const logger = this.mlog(this.processRequest);
        const errors: string[] = [];
        // LLM specific worker request (from API)
        const {auth, body} = req;
        const provider = (auth?.organizationId === undefined || auth?.appSlug === undefined) ?
            this.organizationService.getFirstProviderByType(providerType) :
            this.organizationService.getProviderByModel(auth?.organizationId, auth?.appSlug, body.model);

        const workerRequest = await this.parseRequest(providerType, provider?.name, type, req);

        if (!provider) {
            logger.error(`Provider not found for ${providerType} ${type}, auth: ${JSON.stringify(auth, null, 2)}`,
                {requestId: workerRequest.requestId});
            errors.push(`An error occurred while trying to process your request. Please contact your administrator and refer to ${workerRequest.requestId}.`)
            workerRequest.errors = errors;
        }

        if (provider) {
            logger.info(`Processing request: ${providerType} ${type}`, {
                methodName: 'processRequest',
                requestId: workerRequest.requestId
            });


            await this.guardService.guard(providerType, type, workerRequest, auth);
            logger.info(`Request guarded: ${providerType} ${type}`);
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {
            methodName: 'processRequest',
            requestId: workerRequest.requestId
        });
    }

    async parseRequest(providerType: ProviderType, providerName: string | undefined, type: RequestType, req: HttpApiRequest) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId);
    }
}
