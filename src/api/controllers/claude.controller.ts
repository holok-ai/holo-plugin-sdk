import 'reflect-metadata';
import {BaseController} from "./base.controller";
import {injectable} from "tsyringe";
import {ResponseService} from "../../services";
import {ApiRequest, ApiResponse} from "../types";

@injectable()
export class ClaudeController extends BaseController {

    constructor(private responseService: ResponseService) {
        super();
    }

    public async messages(req: ApiRequest, res: ApiResponse): Promise<void> {
        try {
            if (!this.hasRequiredFields(req.body, ['model', 'messages'], res)) return;
            req.body.provider = 'claude';
            await this.responseService.chatCompletionResponse(req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    }

    public async models(_req: ApiRequest, res: ApiResponse): Promise<void> {

        res.status(200).json({});
    }
}
