import {Request} from 'express';
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions';
import {OpenAIMessageWithDefaults} from "./openai.request.validators";
import {validateRequest} from "../types/validator.types";
import {RequestType} from '../../types';
import {ProviderType} from '../types';


export class OpenAIParser {
    static readonly providerType = ProviderType.OPENAI;

    static parseRequest(req: Request, requestType: RequestType): ChatCompletionCreateParamsBase {
        return validateRequest(
            req,
            requestType,
            this.providerType,
            (requestBody, _requestType) => OpenAIMessageWithDefaults(requestBody)
        );
    }
}
