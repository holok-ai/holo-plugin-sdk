import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ApiResponse, AuthenticatedRequest, HttpApiRequest} from "../types";
import {ProviderType, RequestType} from "../../providers/types";
import {OrganizationService} from "../../admin/services/organization.service";
import {Model} from "../../cache";
import {RequestService} from "../../admin/services/request.service";

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
        const {auth} = req as AuthenticatedRequest;

        let models = [] as Model[];
        if (auth.appSlug) {
            models = this.organizationService.getModels(auth.organizationId, auth.appSlug) ?? [];
        } else if (auth.appSlugs) {

        }
        res.status(200).json(models);
    }
}
