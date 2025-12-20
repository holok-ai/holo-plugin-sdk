import {GuardResult} from "../admin/types";
import {Prompt} from "../cache";
import {RequestType} from "@holokai/sdk";

export interface LLMWorkerRequest {
    // nullable organization is ONLY until we finishing protecting all endpoints
    organizationId?: string;
    providerType: string;
    providerName?: string;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    thread_id?: string;
    requestId: string;
    type: RequestType;
    payload: any;
    timestamp: number;
    isStreaming: boolean;
    systemPrompt?: Prompt;
    options?: Record<string, any>;
    guards?: Prompt[];
    guardResult?: GuardResult;
    errors?: string[];
}

export interface LLMWorkerResponse {
    // nullable organization is ONLY until we finishing protected all endpoints
    organizationId?: string;
    sourceId: string;
    requestId: string;
    providerType: string;
    providerName?: string;
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
