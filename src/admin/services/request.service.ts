import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {RequestType} from "../../providers/types";
import {HttpApiRequest} from "../../api/types";
import {Response} from "express";
import {ResponseService, StreamService} from "../../services";
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
        private readonly streamService: StreamService,
        private readonly guardService: GuardService,
        private organizationService: OrganizationService,
    ) {
        super();
    }

    async processRequest(providerType: string, type: RequestType, req: HttpApiRequest, res: Response) {
        const logger = this.mlog(this.processRequest);
        const errors: string[] = [];
        const {auth, body} = req;
        const {model = 'unknown'} = body;
        const provider = (auth?.organizationId === undefined || auth?.appSlug === undefined) ?
            this.organizationService.getFirstProviderByType(providerType) :
            this.organizationService.getProviderByModel(auth?.organizationId, auth?.appSlug, model);

        const workerRequest = await this.parseRequest(providerType, provider?.name, type, req);

        const responseFormat = (body && typeof body === 'object' && 'response_format' in body)
            ? (body as { response_format?: { type: string } }).response_format
            : undefined;
        const isChatMode = !(responseFormat?.type === 'json_schema' || responseFormat?.type === 'json_object');

        if (!provider) {
            logger.error(`Provider not found for ${providerType} ${type}, auth: ${JSON.stringify(auth, null, 2)}`,
                {requestId: workerRequest.requestId});
            errors.push(`An error occurred while trying to process your request. Please contact your administrator and refer to ${workerRequest.requestId}.`)
            workerRequest.errors = errors;
        } else if (workerRequest.isStreaming) {
            await this.responseService.createStream(workerRequest.requestId, true);
        }

        if (provider) {
            logger.info(`Processing request: ${providerType} ${type}`, {requestId: workerRequest.requestId});

            if (workerRequest.isStreaming && isChatMode) {
                await this.streamService.injectStatusMessage(
                    workerRequest.requestId,
                    model,
                    'Validating request and running security checks...',
                    providerType,
                    isChatMode
                );
            }

            await this.guardService.guard(providerType, type, workerRequest, auth);

            if (workerRequest.isStreaming && isChatMode) {
                if (workerRequest.guardResult?.passed === false) {
                    const errorMsg = workerRequest.guardResult.errors?.join(', ') || 'Security check failed';
                    await this.streamService.injectStatusMessage(
                        workerRequest.requestId,
                        model,
                        `Security check failed: ${errorMsg}`,
                        providerType,
                        isChatMode
                    );
                } else {
                    await this.streamService.injectStatusMessage(
                        workerRequest.requestId,
                        model,
                        'Security checks passed, processing your request...',
                        providerType,
                        isChatMode
                    );
                }
            }
        }

        await this.responseService.sendRequest(req, res, workerRequest);

        logger.info(`Request processed: ${providerType} ${type}`, {requestId: workerRequest.requestId});
    }

    async parseRequest(providerType: string, providerName: string | undefined, type: RequestType, req: HttpApiRequest) {
        return WorkerRequestFactory.fromRequest(providerType, providerName, type, req, this.serverId);
    }
}
