import {RequestType} from "@holokai/sdk/holo";
import {Prompt} from "./prompt";
import {GuardResult} from "@holokai/sdk/plugin";

export interface RawRequest {
    path: string;
    method: string;
    headers: Record<string, any>;
    query: Record<string, any>;
}

export interface HoloWorkerRequest {
    organizationId?: string;
    providerType: string;
    providerName: string;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    thread_id?: string;
    branch_id?: string;
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
    rawRequest: RawRequest;
    isPassthrough?: boolean;
    passthroughPath?: string;
}