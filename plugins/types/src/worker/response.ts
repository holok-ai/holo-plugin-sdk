import {ProviderEventMetrics} from "../provider";

export interface HoloWorkerResponse {
    organizationId?: string;
    sourceId: string;
    requestId: string;
    providerType: string;
    providerName?: string;
    payload: any;
    fullResponse?: string;
    workerId: string;
    timestamp?: number;
    metrics?: ProviderEventMetrics;
}
