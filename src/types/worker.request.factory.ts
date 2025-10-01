import {ProviderRequest, ProviderType, RequestType} from "../providers/types";
import {HttpApiRequest} from "../api/types";
import {JWTPayload} from "../admin/types";
import {v4 as uuidv4} from "uuid";
import logger from "../utils/logger";
import {ErrorMessages} from "../utils";
import {LLMWorkerRequest} from "./index";
import {OllamaChatRequestWithDefaults, OllamaGenerateRequestWithDefaults} from "../providers/ollama/validators";
import {ClaudeChatRequestWithDefaults} from "../providers/claude/validators";
import {OpenAIChatRequestValidator} from "../providers/openai/validators";
import {ArkErrors} from "arktype";

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
        const {body} = req;
        logger.info(`parsing request: ${JSON.stringify(body, null, 2)}`)
        let request: ProviderRequest | ArkErrors;
        switch (providerType) {
            case ProviderType.OLLAMA:
                if (type === RequestType.CHAT) {
                    request = OllamaChatRequestWithDefaults.assert(body);
                } else {
                    request = OllamaGenerateRequestWithDefaults.assert(body);
                }
                break;
            case ProviderType.CLAUDE:
                request = ClaudeChatRequestWithDefaults.assert(body);
                break;
            case ProviderType.OPENAI:
            case ProviderType.PERPLEXITY:
                request = OpenAIChatRequestValidator.assert(body);
                break;
            default:
                logger.error('Unsupported provider in WorkerRequest unified parser.', {providerType}, {
                    className: 'WorkerRequestFactory',
                    methodName: 'parseLLMRequest'
                });
                throw new Error(ErrorMessages.unsupportedProvider(providerType));
        }

        if (request instanceof ArkErrors) {
            logger.error(`${providerType} request validation failed`, {
                errors: request.summary,
                input: req
            });
            throw new Error(`Invalid ${providerType} request: ${request.summary}`);
        }

        return request;
    }
}
