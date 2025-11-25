import {ProviderRequest, ProviderType, RequestType} from "../providers/types";
import {HttpApiRequest} from "../api/types";
import {JWTPayload} from "../admin/types";
import {v4 as uuidv4} from "uuid";
import logger from "../utils/logger";
import {ErrorMessages, pickDefined} from "../utils";
import {LLMWorkerRequest, LLMWorkerRequestValidator} from "./index";
import {OllamaChatRequestWithDefaults, OllamaGenerateRequestWithDefaults} from "../providers/ollama/validators";
import {ClaudeChatRequestWithDefaults} from "../providers/claude/validators";
import {OpenAIChatRequestValidator} from "../providers/openai/validators";
import {ArkErrors} from "arktype";

export class WorkerRequestFactory {
    static logger = logger.child({className: 'WorkerRequestFactory'});
    static fromRequest(
        providerType: ProviderType,
        providerName: string | undefined,
        type: RequestType,
        req: HttpApiRequest,
        sourceId: string
    ): LLMWorkerRequest {
        const payload = this.parseLLMRequest(req, providerType, type);
        const {auth, body} = req;
        const thread_id = body?.thread_id;
        return this.create(providerType, providerName, type, payload, sourceId, auth, thread_id);
    }

    static create(
        providerType: ProviderType,
        providerName: string | undefined,
        type: RequestType,
        payload: ProviderRequest,
        sourceId: string,
        auth?: JWTPayload,
        thread_id?: string,
    ) {
        let sanitizedAuth = {};

        if (auth) {
            const {providerType, iat, appSlugs, exp, ...rest} = auth;
            sanitizedAuth = rest || {};
        }

        return LLMWorkerRequestValidator.brand('LLMWorkerRequestValidator').assert(pickDefined({
            providerType,
            providerName,
            sourceId,
            requestId: uuidv4(),
            type,
            payload,
            isStreaming: payload.stream === true,
            timestamp: Date.now(),
            thread_id,
            ...sanitizedAuth

        }));
    }

    static parseLLMRequest(
        req: HttpApiRequest,
        providerType: ProviderType,
        type: RequestType
    ): ProviderRequest {
        const {body} = req;
        // this.logger.info(`parsing request: ${JSON.stringify(body, null, 2)}`)

        // Remove thread_id from body before validation as it's not part of provider API schemas
        // thread_id is extracted separately in fromRequest() and stored in LLMWorkerRequest
        const {thread_id, ...providerBody} = body;

        let request: ProviderRequest | ArkErrors;
        switch (providerType) {
            case ProviderType.OLLAMA:
                if (type === RequestType.CHAT) {
                    request = OllamaChatRequestWithDefaults.assert(providerBody);
                } else {
                    request = OllamaGenerateRequestWithDefaults.assert(providerBody);
                }
                break;
            case ProviderType.CLAUDE:
                request = ClaudeChatRequestWithDefaults.assert(providerBody);
                break;
            case ProviderType.OPENAI:
            case ProviderType.PERPLEXITY:
                request = OpenAIChatRequestValidator.assert(providerBody);
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
