import {Request} from 'express';
import {validateRequest} from "../types/validator.types";
import {ChatRequest, GenerateRequest} from "ollama";
import {ProviderType, RequestType} from "../../types";
import {OllamaChatRequestWithDefaults, OllamaGenerateRequestWithDefaults} from "./ollama.request.validators";

export class OllamaParser {
    static readonly providerType = ProviderType.OLLAMA;

    static parseRequest(req: Request, requestType: RequestType): ChatRequest | GenerateRequest {
        return validateRequest(
            req,
            requestType,
            this.providerType,
            (requestBody, reqType) => {
                if (reqType === RequestType.CHAT) {
                    return OllamaChatRequestWithDefaults(requestBody);
                } else {
                    return OllamaGenerateRequestWithDefaults(requestBody);
                }
            }
        );
    }
}

