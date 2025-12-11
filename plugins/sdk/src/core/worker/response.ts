export interface HoloWorkerResponse {
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