import {
    ClaudeChatRequest,
    OllamaChatRequest,
    OllamaGenerateRequest,
    OpenAIChatRequest,
    ProviderType,
    RequestType
} from "../providers/types";
import {v4 as uuidv4} from "uuid";
import {HttpApiRequest} from "../api/types";
import logger from "../utils/logger";
import {OllamaParser} from "../providers/ollama";
import {ClaudeParser} from "../providers/claude";
import {OpenAIParser} from "../providers/openai";
import {ErrorMessages} from "../utils";
import {JWTPayload} from "../admin/types";

export interface LLMWorkerRequest {
    organizationId?: string;
    providerType: ProviderType;
    providerName?: string;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    requestId: string;
    type: RequestType;
    payload: LLMPayloadTypes;
    timestamp: number;
    isStreaming: boolean;
    systemPrompt?: string;
    options?: Record<string, any>;
}

export class WorkerRequest {
    static async fromRequest(
        providerType: ProviderType,
        type: RequestType,
        req: HttpApiRequest,
        sourceId: string
    ): Promise<LLMWorkerRequest> {
        const payload = await this.parseLLMRequest(req, providerType, type);
        const {auth} = req;
        return this.create(providerType, type, payload, sourceId, auth);
    }

    static async create(
        providerType: ProviderType,
        type: RequestType,
        payload: LLMPayloadTypes,
        sourceId: string,
        auth?: JWTPayload,
    ) {
        const workerRequest: LLMWorkerRequest = {
            providerType,
            sourceId,
            requestId: uuidv4(),
            type,
            payload,
            isStreaming: payload.stream === true,
            timestamp: Date.now(),
            ...(auth !== undefined && auth)
        };
        return workerRequest;
    }

    static async parseLLMRequest(
        req: HttpApiRequest,
        providerType: ProviderType,
        type: RequestType
    ): Promise<LLMPayloadTypes> {
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
                logger.error('Unsupported provider in WorkerRequest unified parser.', {providerType});
                throw new Error(ErrorMessages.unsupportedProvider(providerType));
        }
    }
}

export interface LLMWorkerResponse {
    organizationId?: string;
    sourceId: string;
    requestId: string;
    providerType: ProviderType;
    payload: any;
    fullResponse?: string;
    workerId: string;
    timestamp?: number;
    metrics?: {
        inputTokens: number;
        outputTokens: number;
        timeToFirstToken: number;
        totalProcessingTime: number;
    };
}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes =
    OllamaChatRequest
    | OllamaGenerateRequest
    | ClaudeChatRequest
    | OpenAIChatRequest;
