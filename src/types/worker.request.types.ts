import {ProviderRequest, ProviderType, RequestType} from "../providers/types";
import {GuardResult} from "../admin/types";
import {Prompt} from "../cache";

export interface LLMWorkerRequest {
    organizationId?: string;
    providerType: ProviderType;
    providerName?: string;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    requestId: string;
    type: RequestType;
    payload: ProviderRequest;
    timestamp: number;
    isStreaming: boolean;
    systemPrompt?: string;
    options?: Record<string, any>;
    guards?: Prompt[];
    guardResults?: GuardResult;
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
