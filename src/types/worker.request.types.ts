import {MessageCreateParamsBase} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import {ChatRequest, GenerateRequest} from 'ollama';
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions/completions';

import {ProviderType, RequestType} from "../providers/types";
import {v4 as uuidv4} from "uuid";
import {HttpApiRequest} from "../api/types";
import logger from "../utils/logger";
import {OllamaParser} from "../providers/ollama";
import {ClaudeParser} from "../providers/claude";
import {OpenAIParser} from "../providers/openai";
import {ErrorMessages} from "../utils";

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
}

export class WorkerRequest {
    static async create(
        providerType: ProviderType,
        type: RequestType,
        req: HttpApiRequest,
        sourceId: string
    ): Promise<LLMWorkerRequest> {
        const payload = await this.parseLLMRequest(req, providerType, type);
        const {auth} = req;
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

        logger.debug(`LLMWorkerRequest created: ${JSON.stringify(workerRequest)}`);
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

// Extended Ollama request types with additional queue metadata
export interface OllamaWorkerGenerateRequest extends GenerateRequest {
}

export interface OllamaWorkerChatRequest extends ChatRequest {
}

export interface ClaudeWorkerRequest extends MessageCreateParamsBase {
}

export interface OpenAIWorkerRequest extends ChatCompletionCreateParamsBase {
}

// Union type for all LLM Specific Requests
export type LLMPayloadTypes =
    OllamaWorkerChatRequest
    | OllamaWorkerGenerateRequest
    | MessageCreateParamsBase
    | OpenAIWorkerRequest;
