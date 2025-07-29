import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ResponseService} from "../../services";
import {HttpApiRequest, ApiResponse} from "../types";
import logger from "../../utils/logger";
import { Provider, RequestType } from '../../types';

@injectable()
export class OpenAIController extends BaseController {

    constructor(private responseService: ResponseService) {
        super();
    }

    public chatCompletions = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
            await this.responseService.parseAndSendLLMRequest(Provider.OPENAI, RequestType.CHAT, req, res);
        } catch (error) {
            logger.error('Error: ' + (error as Error).stack);
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (_req: HttpApiRequest, res: ApiResponse): Promise<void> => {

        res.status(200).json({});
    }
}
