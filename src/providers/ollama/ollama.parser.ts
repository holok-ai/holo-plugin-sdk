import {Request} from 'express';
import {ProviderType, RequestType, validateRequest} from "../types";
import {OllamaChatRequestWithDefaults, OllamaGenerateRequestWithDefaults} from "./validators";
import {OllamaChatRequest, OllamaGenerateRequest} from "./types";

export class OllamaParser {
    static readonly providerType = ProviderType.OLLAMA;

    static parseRequest(req: Request, requestType: RequestType): OllamaChatRequest | OllamaGenerateRequest {
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

