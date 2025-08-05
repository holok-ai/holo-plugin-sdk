import {LLMWorkerRequest, LLMWorkerResponse, ProviderType} from '../../types';
import {LlmRequest, LlmResponse} from '../../db/types';

export interface IRequestTranslator {
    readonly provider: ProviderType;

    /**
     * Translate LLMWorkerRequest fields into LlmRequest object
     * @param workerRequest - The incoming worker request
     * @param llmRequest - The LlmRequest object to populate (without id)
     */
    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    /**
     * Translate LLMWorkerResponse (final response) into LlmResponse object
     * @param workerResponse - The final worker response
     * @param llmResponse - The LlmResponse object to populate (without id)
     * @param requestContext - Additional context like userId and applicationId
     */
    translateResponse(
        workerResponse: LLMWorkerResponse,
        llmResponse: Omit<LlmResponse, 'id'>,
        requestContext?: { userId?: string; applicationId?: string }
    ): void;
}

export {ProviderType, LLMWorkerRequest, LLMWorkerResponse};
export {LlmRequest, LlmResponse} from '../../db/types';
