import 'reflect-metadata';
import {Response} from 'express';
import {BaseController} from './base.controller';
import {ApiRequest} from '../types';
import {injectable} from 'tsyringe';
import {ResponseService} from "../../services";
import { Provider, RequestType } from '../../types';

@injectable()
export default class LLMController extends BaseController {
    constructor(private responseService: ResponseService) {
        super();
    }

    public generate = async (req: ApiRequest, res: Response): Promise<void> => {
        try {
            await this.responseService.handleRequest(Provider.OLLAMA, RequestType.GENERATE, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to generate text');
        }
    };

    public chat = async (req: ApiRequest, res: Response): Promise<void> => {
        try {
            if (!this.hasRequiredFields(req.body, ['model', 'messages'], res)) return;
            await this.responseService.handleRequest(Provider.OLLAMA, RequestType.CHAT, req, res);
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to complete chat');
        }
    };
}
