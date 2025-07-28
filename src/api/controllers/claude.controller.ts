import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ResponseService} from "../../services";
import {ApiRequest, ApiResponse} from "../types";
import { Provider } from '../../types';

@injectable()
export class ClaudeController extends BaseController {

    constructor(private responseService: ResponseService) {
        super();
    }

    public messages = async (req: ApiRequest, res: ApiResponse): Promise<void> => {
        try {
           await this.responseService.handleRequest(Provider.CLAUDE, "chat", req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public models = async (_req: ApiRequest, res: ApiResponse): Promise<void> => {

        res.status(200).json({});
    }
}
