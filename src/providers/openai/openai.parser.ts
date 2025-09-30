import {Request} from 'express';
import {ProviderType, RequestType, validateRequest} from "../types";
import {OpenAIChatRequestValidator} from "./validators";
import {OpenAIChatRequest} from "./types";


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
