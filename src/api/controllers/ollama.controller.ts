import 'reflect-metadata';
import {Response} from 'express';
import {BaseController} from './base.controller';
import {HttpApiRequest} from '../types';
import {injectable} from 'tsyringe';
import {RequestService} from "../../admin/services/request.service";
import {OrganizationService} from "../../admin/services/organization.service";
import {OllamaModelResponse} from "../../cache";
import {RequestType} from "@holokai/sdk";

@injectable()
export default class OllamaController extends BaseController {
    constructor(
        private requestService: RequestService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    public generate = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            await this.requestService.processRequest('OLLAMA', RequestType.GENERATE, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to generate text');
        }
    };

    public chat = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            if (!this.hasRequiredFields(req.body, ['model', 'messages'], res)) return;
            await this.requestService.processRequest('OLLAMA', RequestType.CHAT, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    };

    public models = async (req: HttpApiRequest, res: Response): Promise<void> => {
        const logger = this.mlog(this.models);
        logger.info('Getting models');
        const {auth} = req;

        if (!auth) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        }

        let ollamaModels: OllamaModelResponse[] = [];

        if (auth.organizationId && auth?.appSlug) {
            logger.debug(`Getting models for app: ${auth.appSlug}`);
            const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
            ollamaModels = allModels.map(m => m.metadata!.ollama as OllamaModelResponse);
        } else if (auth.appSlugs) {
            logger.debug('No app defined, getting all models');
            const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
            ollamaModels = allModels.map(m => m.metadata!.ollama as OllamaModelResponse);
        }

        res.status(200).json({
            models: ollamaModels
        });
    };
}
