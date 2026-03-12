import {env} from "../env";
import {pickDefined} from "@holokai/sdk";
import type {HoloWorkerResponse} from "@holokai/types/worker";

export class WorkerResponseFactory {
    /**
     * Creates a validated LLMWorkerResponse
     */
    static create(
        sourceId: string,
        requestId: string,
        providerType: string,
        payload: any | any[],
        organizationId?: string,
        fullResponse?: string,
        workerId?: string,
        providerName?: string,
    ): HoloWorkerResponse {
        return pickDefined({
            organizationId,
            sourceId,
            requestId,
            providerType,
            providerName,
            workerId: workerId || env.worker.serverId || 'unknown',
            payload,
            fullResponse,
            timestamp: Date.now()
        }) as HoloWorkerResponse;
    }
}
