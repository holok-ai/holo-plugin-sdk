import {ProviderType} from "../providers/types";
import {LLMWorkerResponse} from "./index";
import {pickDefined} from "../utils";
import {env} from "../env";

export class WorkerResponseFactory {
    static create(
        sourceId: string,
        requestId: string,
        providerType: ProviderType,
        payload: any,
        organizationId?: string,
        fullResponse?: string,
        workerId?: string
    ): LLMWorkerResponse {
        return pickDefined({
            organizationId,
            sourceId,
            requestId,
            providerType,
            workerId: workerId || env.worker.serverId || 'unknown',
            payload,
            fullResponse,
            timestamp: Date.now()
        }) as LLMWorkerResponse;
    }

    static createError(
        sourceId: string,
        requestId: string,
        providerType: ProviderType,
        error: Error,
        organizationId?: string,
        workerId?: string
    ): LLMWorkerResponse {
        return this.create(
            sourceId,
            requestId,
            providerType,
            {
                type: 'error',
                error: {
                    message: error.message
                },
                requestId
            },
            organizationId,
            undefined,
            workerId
        );
    }
}
