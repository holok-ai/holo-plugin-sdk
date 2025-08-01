import { Provider, LLMWorkerRequest } from '../../types/provider-request.types';
import { LlmRequest } from '../../db/types';

export interface IRequestTranslator {
    readonly provider: Provider;
    
    /**
     * Translate LLMWorkerRequest fields into LlmRequest object
     * @param workerRequest - The incoming worker request
     * @param llmRequest - The LlmRequest object to populate (without id)
     */
    translate(workerRequest: LLMWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;
}

export { Provider, LLMWorkerRequest };
export { LlmRequest } from '../../db/types';