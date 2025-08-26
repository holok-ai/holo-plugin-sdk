import {IRequestTranslator} from '../types';
import {LLMWorkerRequest, LLMWorkerResponse, ProviderType} from '../../types';
import {LlmRequest, LlmResponse, LlmStatus} from '../../db/types';

export abstract class BaseRequestTranslator implements IRequestTranslator {
    abstract readonly provider: ProviderType;

    abstract translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    abstract translateResponse(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void;

    /**
     * Set common fields that are the same across all providers for requests
     */
    protected setCommonFields(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        llmRequest.request_id = workerRequest.requestId;
        llmRequest.request_type = workerRequest.type;
        llmRequest.timestamp = new Date(workerRequest.timestamp).toISOString();
        llmRequest.application_id = workerRequest.applicationId || 'default';
        llmRequest.provider_slug = workerRequest.providerType;
        llmRequest.organization_id = workerRequest.organizationId;

        // Optional fields - only set if defined
        if (workerRequest.sourceId !== undefined) {
            llmRequest.source_id = workerRequest.sourceId;
        }
        if (workerRequest.userId !== undefined) {
            llmRequest.user_id = workerRequest.userId;
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
