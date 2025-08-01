import { IRequestTranslator } from '../types';
import { Provider, LLMWorkerRequest } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';

export abstract class BaseRequestTranslator implements IRequestTranslator {
    abstract readonly provider: Provider;
    
    abstract translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;
    
    /**
     * Set common fields that are the same across all providers
     */
    protected setCommonFields(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void {
        llmRequest.request_id = workerRequest.requestId;
        llmRequest.request_type = workerRequest.type;
        llmRequest.source_id = workerRequest.sourceId;
        llmRequest.user_id = workerRequest.userId;
        llmRequest.timestamp = new Date(workerRequest.timestamp).toISOString();
        llmRequest.application_id = workerRequest.applicationId || 'default';
        llmRequest.provider_slug = workerRequest.provider;
        llmRequest.raw_request = workerRequest.payload;
    }
}