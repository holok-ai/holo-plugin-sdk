import {Application, Prompt, Protocol, Provider} from "../entities";
import type {ProviderDoneEvent, ProviderErrorEvent} from "../provider";

export interface GuardResult {
    passed: boolean;
    errors?: string[];
}

export interface HttpRequestDetails {
    path: string;
    method: string;
    headers?: Record<string, any>;
    query?: Record<string, any>;
}

export interface HoloWorkerRequest {
    organizationId: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    sourceId: string;
    appSlug?: string;
    userId?: string;
    threadId?: string;
    branchId?: string;
    requestId: string;
    payload: any;
    timestamp: string;
    isStreaming: boolean;
    systemPrompt?: Prompt;
    options?: Record<string, any>;
    guards?: Prompt[];
    guardResult?: GuardResult;
    errors?: string[];
    httpRequestDetails: HttpRequestDetails;
    isPassthrough?: boolean;
    passthroughPath?: string;
    clientIdentifier?: string;
    tokenType?: string;
    isHoloNative?: boolean;
    providerEvent?: ProviderDoneEvent | ProviderErrorEvent;
    workerId?: string;
}
