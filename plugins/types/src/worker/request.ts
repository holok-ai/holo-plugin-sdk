import {Application, Prompt, Protocol, Provider} from "../entities";

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
    organizationId: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    thread_id?: string;
    branch_id?: string;
    requestId: string;
    payload: any;
    timestamp: string;
    isStreaming: boolean;
    systemPrompt?: Prompt;
    options?: Record<string, any>;
    guards?: Prompt[];
    guardResult?: GuardResult;
    errors?: string[];
    rawRequest: RawRequest;
    isPassthrough?: boolean;
    passthroughPath?: string;
    clientIdentifier?: string;
    tokenType?: string;
    isHoloNative?: boolean;
}
