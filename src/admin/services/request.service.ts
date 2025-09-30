import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ProviderType, RequestType} from "../../providers/types";
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";
import {ClassLogger} from "../../types/class.logger";
import {WorkerRequestFactory} from "../../types/worker.request.factory";


@injectable()
export class RequestService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService
    ) {
        super();
    }

    async processRequest(providerType: ProviderType, type: RequestType, req: HttpApiRequest, res: Response) {
        // LLM specific worker request (from API)
        const workerRequest = await this.parseRequest(providerType, type, req);
        this.log.info(`Processing request: ${providerType} ${type}`, {
            methodName: 'processRequest',
            requestId: workerRequest.requestId
        });

        //put service in here
        const {auth} = req;
        await this.guardService.guard(providerType, type, workerRequest, auth);

        this.log.info(`Request guarded: ${providerType} ${type}`);
        await this.responseService.sendRequest(req, res, workerRequest);

        this.log.info(`Request processed: ${providerType} ${type}`, {
            methodName: 'processRequest',
            requestId: workerRequest.requestId
        });
    }

    async parseRequest(providerType: ProviderType, type: RequestType, req: HttpApiRequest) {
        return WorkerRequestFactory.fromRequest(providerType, type, req, this.serverId);
    }
}
