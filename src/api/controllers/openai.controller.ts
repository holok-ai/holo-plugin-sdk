import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ApiResponse, HttpApiRequest} from "../types";
import logger from "../../utils/logger";
import {ProviderType, RequestType} from "../../providers/types";
import {RequestService} from "../../admin/services/request.service";

@injectable()
export class OpenAIController extends BaseController {

    constructor(private requestService: RequestService) {
        super();
    }

    public chatCompletions = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
            await this.requestService.processRequest(ProviderType.OPENAI, RequestType.CHAT, req, res);
        } catch (error) {
            logger.error('Error: ' + (error as Error).stack);
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (_req: HttpApiRequest, res: ApiResponse): Promise<void> => {

        res.status(200).json({});
    }
}
