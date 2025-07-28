import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ResponseService} from "../../services";
import {ApiRequest, ApiResponse} from "../types";
import logger from "../../utils/logger";
import { Provider } from '../../types';

@injectable()
export class OpenAIController extends BaseController {

    constructor(private responseService: ResponseService) {
        super();
    }

    public chatCompletions = async (req: ApiRequest, res: ApiResponse): Promise<void> => {
        try {
            await this.responseService.handleRequest(Provider.OPENAI, "chat", req, res);
        } catch (error) {
            logger.error('Error: ' + (error as Error).stack);
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (_req: ApiRequest, res: ApiResponse): Promise<void> => {

        res.status(200).json({});
    }
}
