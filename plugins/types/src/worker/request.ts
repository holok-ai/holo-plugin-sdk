import {Capability, RequestType} from "../holo";
import {Prompt} from "../entities";

export interface GuardResult {
    passed: boolean;
    errors?: string[];
}

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
    protocol?: string;
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

    applicationId?: string;
    applicationName?: string;
    providerId?: string;
    protocolId?: string;
    protocolName?: string;
    capability?: Capability;
    clientIdentifier?: string;
    tokenType?: string;
}
