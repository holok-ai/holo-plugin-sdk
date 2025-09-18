import {Request} from 'express';
import {validateRequest} from "../types/validator.types";
import {RequestType} from '../../types';
import {OpenAIChatRequest, ProviderType} from '../types';
import {OpenAIChatRequestValidator} from "./openai.request.validators";


export class OpenAIParser {
    static readonly providerType = ProviderType.OPENAI;

    static parseRequest(req: Request, requestType: RequestType): OpenAIChatRequest {
        return validateRequest(
            req,
            requestType,
            this.providerType,
            (requestBody, _requestType) => OpenAIChatRequestValidator(requestBody)
        );
    }
}
