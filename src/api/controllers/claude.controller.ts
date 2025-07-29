import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ResponseService} from "../../services";
import {HttpApiRequest, ApiResponse} from "../types";
import { Provider, RequestType } from '../../types';

@injectable()
export class ClaudeController extends BaseController {

    constructor(private responseService: ResponseService) {
        super();
    }

    public messages = async (req: HttpApiRequest, res: ApiResponse): Promise<void> => {
        try {
           await this.responseService.parseAndSendLLMRequest(Provider.CLAUDE, RequestType.CHAT, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (_req: HttpApiRequest, res: ApiResponse): Promise<void> => {

        res.status(200).json({});
    }
}
