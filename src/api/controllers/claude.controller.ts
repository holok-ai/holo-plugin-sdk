import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ApiResponse, HttpApiRequest} from "../types";
import {ProviderType, RequestType} from "../../providers/types";
import {OrganizationService} from "../../admin/services/organization.service";
import {RequestService} from "../../admin/services/request.service";
import {ClaudeModelInfo} from "../../cache";

@injectable()
export class ClaudeController extends BaseController {

    constructor(
        private requestService: RequestService,
        private organizationService: OrganizationService
    ) {
        super();
    }

    public messages = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
            await this.requestService.processRequest(ProviderType.CLAUDE, RequestType.CHAT, req, res);
        } catch (error) {
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

        let claudeModels: ClaudeModelInfo[] = [];

        if (auth.organizationId && auth?.appSlug) {
            logger.debug(`Getting models for app: ${auth.appSlug}`);
            const allModels = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
            claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
        } else if (auth.appSlugs) {
            logger.debug('No app defined, getting all models');
            const allModels = this.organizationService.getAllModels(auth?.organizationId, auth?.appSlugs);
            claudeModels = allModels.map(m => m.metadata!.claude as ClaudeModelInfo);
        }

        res.status(200).json({
            data: claudeModels,
            has_more: false,
            first_id: claudeModels.length > 0 ? claudeModels[0].id : null,
            last_id: claudeModels.length > 0 ? claudeModels[claudeModels.length - 1].id : null
        });
    }
}
