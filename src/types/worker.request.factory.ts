import {ProviderRequest, ProviderType, RequestType} from "../providers/types";
import {HttpApiRequest} from "../api/types";
import {JWTPayload} from "../admin/types";
import {v4 as uuidv4} from "uuid";
import {OllamaParser} from "../providers/ollama";
import {ClaudeParser} from "../providers/claude";
import {OpenAIParser} from "../providers/openai";
import logger from "../utils/logger";
import {ErrorMessages} from "../utils";
import {LLMWorkerRequest} from "./index";

export class WorkerRequestFactory {
    static fromRequest(
        providerType: ProviderType,
        type: RequestType,
        req: HttpApiRequest,
        sourceId: string
    ): LLMWorkerRequest {
        const payload = this.parseLLMRequest(req, providerType, type);
        const {auth} = req;
        return this.create(providerType, type, payload, sourceId, auth);
    }

    static create(
        providerType: ProviderType,
        type: RequestType,
        payload: ProviderRequest,
        sourceId: string,
        auth?: JWTPayload,
    ) {
        let sanitizedAuth = {};

        if (auth) {
            const {providerType, iat, appSlugs, exp, ...rest} = auth;
            sanitizedAuth = rest || {};
        }

        const workerRequest: LLMWorkerRequest = {
            providerType,
            sourceId,
            requestId: uuidv4(),
            type,
            payload,
            isStreaming: payload.stream === true,
            timestamp: Date.now(),
            ...sanitizedAuth

        };
        return workerRequest;
    }

    static parseLLMRequest(
        req: HttpApiRequest,
        providerType: ProviderType,
        type: RequestType
    ): ProviderRequest {
        logger.info(`parsing request: ${JSON.stringify(req.body, null, 2)}`)
        switch (providerType) {
            case ProviderType.OLLAMA:
                return OllamaParser.parseRequest(req, type);
            case ProviderType.CLAUDE:
                return ClaudeParser.parseRequest(req, type);
            case ProviderType.OPENAI:
                return OpenAIParser.parseRequest(req, type);
            case ProviderType.PERPLEXITY:
                return OpenAIParser.parseRequest(req, type);
            default:
                logger.error('Unsupported provider in WorkerRequest unified parser.', {providerType}, {
                    className: 'WorkerRequestFactory',
                    methodName: 'parseLLMRequest'
                });
                throw new Error(ErrorMessages.unsupportedProvider(providerType));
        }
    }
}
