import 'reflect-metadata';
import {Response} from 'express';
import {BaseController} from './base.controller';
import {HttpApiRequest} from '../types';
import {injectable} from 'tsyringe';
import {ProviderType, RequestType} from "../../providers/types";
import {RequestService} from "../../admin/services/request.service";

@injectable()
export default class OllamaController extends BaseController {
    constructor(private requestService: RequestService) {
        super();
    }

    public generate = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            await this.requestService.processRequest(ProviderType.OLLAMA, RequestType.GENERATE, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to generate text');
        }
    };

    public chat = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            if (!this.hasRequiredFields(req.body, ['model', 'messages'], res)) return;
            await this.requestService.processRequest(ProviderType.OLLAMA, RequestType.CHAT, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    };
}
