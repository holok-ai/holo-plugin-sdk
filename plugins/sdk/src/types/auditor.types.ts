import {LLMWorkerRequest, LLMWorkerResponse} from "./worker.types";
import {LlmRequest, LlmResponse, LlmStatus} from "../api";


export interface IAuditor {
    readonly provider: string;

    auditRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    auditResponse(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void;
}

export abstract class BaseAuditor implements IAuditor {
    abstract readonly provider: string;

    auditRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        this.setCommonFields(workerRequest, llmRequest);
        this.toHoloRequest(workerRequest, llmRequest);
        this.mapProviderPayload(workerRequest, llmRequest);
    }

    auditResponse(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void {
        // If payload is an array, audit each chunk separately
        if (Array.isArray(workerResponse.payload)) {
            for (const chunk of workerResponse.payload) {
                const chunkResponse: LLMWorkerResponse = {
                    ...workerResponse,
                    payload: chunk
                };
                this.auditResponse(chunkResponse, llmResponse, requestContext);
            }
            return;
        }

        // At this point, TypeScript knows payload is a single ProviderResponse
        const singleResponse = workerResponse as LLMWorkerResponse & { payload: any };

        this.setCommonResponseFields(singleResponse, llmResponse, requestContext);
        this.mapResponseToHolo(singleResponse, llmResponse);
        this.collectResponseMetrics(singleResponse, llmResponse);
    }

    protected abstract toHoloRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    protected abstract mapProviderPayload(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;


    protected abstract mapResponseToHolo(
        workerResponse: LLMWorkerResponse & { payload: any },
        llmResponse: Omit<LlmResponse, 'id'>
    ): void;

    protected abstract collectResponseMetrics(
        workerResponse: LLMWorkerResponse & { payload: any },
        llmResponse: Omit<LlmResponse, 'id'>
    ): void;

    /**
     * Set common fields that are the same across all providers for requests
     */
    protected setCommonFields(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        llmRequest.request_id = workerRequest.requestId;
        llmRequest.request_type = workerRequest.type;
        llmRequest.timestamp = new Date(workerRequest.timestamp).toISOString();
        llmRequest.application_id = workerRequest.appSlug || 'default';
        llmRequest.provider_slug = workerRequest.providerType;
        llmRequest.organization_id = workerRequest.organizationId;

        // Optional fields - only set if defined
        if (workerRequest.sourceId !== undefined) {
            llmRequest.source_id = workerRequest.sourceId;
        }
        if (workerRequest.userId !== undefined) {
            llmRequest.user_id = workerRequest.userId;
        }
        if (workerRequest.thread_id !== undefined) {
            llmRequest.thread_id = workerRequest.thread_id;
        }
        if (workerRequest.payload !== undefined) {
            llmRequest.raw_request = workerRequest.payload;
        }
    }

    /**
     * Set common fields that are the same across all providers for responses
     */
    protected setCommonResponseFields(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void {
        llmResponse.created_at = workerResponse.timestamp ? new Date(workerResponse.timestamp).toISOString() : new Date().toISOString();
        llmResponse.organization_id = workerResponse.organizationId;
        llmResponse.application_id = requestContext?.applicationId || 'default';
        llmResponse.request_id = workerResponse.requestId;
        llmResponse.provider_slug = workerResponse.providerType;
        llmResponse.worker_id = workerResponse.workerId || 'unknown';
        llmResponse.status = LlmStatus.SUCCESS; // Default, can be overridden by specific translators
        llmResponse.cost = 0; // TODO: Implement cost calculation

        // Optional fields - only set if defined
        if (requestContext?.userId !== undefined) {
            llmResponse.user_id = requestContext.userId;
        }
        if (workerResponse.payload !== undefined) {
            llmResponse.response_raw = workerResponse.payload;
        }
    }
}
