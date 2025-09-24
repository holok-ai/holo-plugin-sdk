import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ProviderType, RequestType} from "../../providers/types";
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {WorkerRequest} from "../../types";
import {ResponseService} from "../../services";
import {env} from "../../env";
import {GuardService} from "./guard.service";


@injectable()
export class RequestService {
    private serverId: string = env.api.apiServerId;

    constructor(
        private readonly responseService: ResponseService,
        private readonly guardService: GuardService
    ) {
    }

    async processRequest(providerType: ProviderType, type: RequestType, req: HttpApiRequest, res: Response) {
        // LLM specific worker request (from API)
        const workerRequest = await this.parseRequest(providerType, type, req);

        //put service in here
        const {auth} = req;
        if (auth && auth.appSlug) {
            const result = await this.guardService.guard(providerType, type, workerRequest, auth);

            if (!result.passed) {
                res.status(401).send(result);
                return;
            }
        }
        await this.responseService.sendRequest(req, res, workerRequest);
    }

    async parseRequest(providerType: ProviderType, type: RequestType, req: HttpApiRequest) {
        return WorkerRequest.fromRequest(providerType, type, req, this.serverId);
    }
}
