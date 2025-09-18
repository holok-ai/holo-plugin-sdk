import {Request} from 'express';
import {ProviderType, RequestType, validateRequest} from "../types";
import {ChatRequest, GenerateRequest} from "ollama";
import {OllamaChatRequestWithDefaults, OllamaGenerateRequestWithDefaults} from "./validators";

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

