import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ApiResponse, HttpApiRequest} from "../types";
import logger from "../../utils/logger";
import {RequestService} from "../../admin/services/request.service";
import {OrganizationService} from "../../admin/services/organization.service";
import {OpenAIModel} from "../../cache";
import {RequestType} from "@holokai/sdk";

@injectable()
export class OpenAIController extends BaseController {

    constructor(
        private requestService: RequestService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    public chatCompletions = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
            await this.requestService.processRequest('OPENAI', RequestType.CHAT, req, res);
        } catch (error) {
            logger.error('Error: ' + (error as Error).stack);
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        const logger = this.mlog(this.models);
        logger.info('Getting models');
        const {auth} = req;

        if (!auth) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        }

        let openaiModels: OpenAIModel[] = [];

        if (auth.organizationId && auth?.appSlug) {
            logger.debug(`Getting models for app: ${auth.appSlug}`);
            const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
            openaiModels = allModels.map(m => m.metadata!.openai as OpenAIModel);
        } else if (auth.appSlugs) {
            logger.debug('No app defined, getting all models');
            const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
            openaiModels = allModels.map(m => m.metadata!.openai as OpenAIModel);
        }

        res.status(200).json({
            object: 'list',
            data: openaiModels
        });
    }
}
