import { LLMWorkerRequest, LLMWorkerResponse } from "../../types";
import { LlmRequest, LlmResponse, LlmStatus } from "../../db/types";
import { ProviderType, ProviderResponse } from "./provider.types";


export interface IAuditor {
    readonly provider: ProviderType;

    auditRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    auditResponse(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void;
}

export abstract class BaseAuditor implements IAuditor {
    abstract readonly provider: ProviderType;

    auditRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        this.setCommonFields(workerRequest, llmRequest);
        this.toHoloRequest(workerRequest, llmRequest);
        this.mapProviderPayload(workerRequest, llmRequest);
        this.setDesktopRequestFields(workerRequest, llmRequest);
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
        const singleResponse = workerResponse as LLMWorkerResponse & { payload: ProviderResponse };

        this.setCommonResponseFields(singleResponse, llmResponse, requestContext);
        this.mapResponseToHolo(singleResponse, llmResponse);
        this.collectResponseMetrics(singleResponse, llmResponse);
    }

    protected abstract toHoloRequest(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    protected abstract mapProviderPayload(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;


    protected abstract mapResponseToHolo(
        workerResponse: LLMWorkerResponse & { payload: ProviderResponse },
        llmResponse: Omit<LlmResponse, 'id'>
    ): void;

    protected abstract collectResponseMetrics(
        workerResponse: LLMWorkerResponse & { payload: ProviderResponse },
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
        if (workerRequest.payload !== undefined) {
            llmRequest.raw_request = workerRequest.payload;
        }
        // Extract system prompt from Prompt object
        if (workerRequest.systemPrompt?.systemPrompt !== undefined) {
            llmRequest.system_prompt = workerRequest.systemPrompt.systemPrompt;
        }
    }

    /**
     * Set desktop fields for processing tuples from desktop app - same across all providers for requests
     * thread_id is saved in db field
     * other options when present (branch_id and continue_after)
     */
    protected setDesktopRequestFields(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        if (workerRequest.thread_id !== undefined) {
            const { threadId, params } = this.splitThreadValue(workerRequest.thread_id);
            if (threadId !== undefined) {
                llmRequest.thread_id = threadId;
            }
            if (Object.keys(params).length > 0) {
                llmRequest.options = {
                    ...(llmRequest.options ?? {}),
                    ...params
                }
            }
            // console.log('[AUDITOR.DESKTOP_FIELDS] thread value:', workerRequest.thread_id,' thread_id:', threadId,' options:',  llmRequest.options);
        }
    }

    /**
     * Splits a thread_id string from the desktop into threadId and key=value params
     * @returns Object with threadId (string | undefined) and params (object with parsed key=value pairs)
     */
    protected splitThreadValue(threadString: string): {
        threadId: string | undefined,
        params: { [key: string]: string }
    } {
        if (!threadString || threadString.trim() === '') {
            return { threadId: undefined, params: {} };
        }

        const parts = threadString.split(',');
        const params: { [key: string]: string } = {};

        // Parse key=value pairs from remaining elements
        for (let i = 1; i < parts.length; i++) {
            const [key, value] = parts[i].split('=');
            if (key && value) {
                params[key.trim()] = value.trim();
            }
        }

        return { threadId: parts[0].trim(), params };
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
