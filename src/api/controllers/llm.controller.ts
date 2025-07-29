import 'reflect-metadata';
import {Response} from 'express';
import {BaseController} from './base.controller';
import {HttpApiRequest} from '../types';
import {injectable} from 'tsyringe';
import {ResponseService} from "../../services";
import { Provider, RequestType } from '../../types';

@injectable()
export default class LLMController extends BaseController {
    constructor(private responseService: ResponseService) {
        super();
    }

    public generate = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            await this.responseService.parseAndSendLLMRequest(Provider.OLLAMA, RequestType.GENERATE, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to generate text');
        }
    };

    public chat = async (req: HttpApiRequest, res: Response): Promise<void> => {
        try {
            if (!this.hasRequiredFields(req.body, ['model', 'messages'], res)) return;
            await this.responseService.parseAndSendLLMRequest(Provider.OLLAMA, RequestType.CHAT, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    };
}
