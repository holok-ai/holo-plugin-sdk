import {injectable} from "tsyringe";
import {LLMWorkerRequest, LLMWorkerResponse} from "../../types";
import {LlmRequest, LlmResponse} from "../../db/types";
import logger from "../../utils/logger";
import {IAuditor} from "@holokai/sdk";

@injectable()
export class AuditorRegistry {

    private auditors = new Map<string, IAuditor>();

    constructor() {
        this.initializeAuditors();
    }


    getAuditor(provider: string): IAuditor {
        const auditor = this.auditors.get(provider);
        if (!auditor) {
            throw new Error(`No auditor registered for provider: ${provider}`);
        }
        return auditor;
    }


    audit(workerRequest: LLMWorkerRequest): Omit<LlmRequest, 'id'> {
        const auditor = this.getAuditor(workerRequest.providerName || workerRequest.providerType);

        // Create empty LlmRequest object
        const llmRequest: Omit<LlmRequest, 'id'> = {
            request_id: '',
            request_type: '',
            model_slug: '',
            timestamp: '',
            application_id: '',
            provider_slug: ''
        };

        // Use auditor to populate fields
        auditor.auditRequest(workerRequest, llmRequest);

        logger.debug('Audited LLMWorkerRequest to LlmRequest', {
            organizationId: workerRequest.organizationId,
            string: workerRequest.providerName,
            requestId: workerRequest.requestId,
            model: llmRequest.model_slug
        });

        return llmRequest;
    }

    auditResponse(
        workerResponse: LLMWorkerResponse,
        requestContext?: { userId?: string; applicationId?: string }
    ): Omit<LlmResponse, 'id'> {
        const auditor = this.getAuditor(workerResponse.providerType);


        const llmResponse: Omit<LlmResponse, 'id'> = {
            organization_id: '',
            created_at: '',
            application_id: '',
            request_id: '',
            provider_slug: '',
            model_slug: '',
            status: undefined as any,
            cost: 0,
            worker_id: ''
        };

        auditor.auditResponse(workerResponse, llmResponse, requestContext);

        logger.debug('Audited LLMWorkerResponse to LlmResponse', {
            provider: workerResponse.providerType,
            requestId: workerResponse.requestId,
            model: llmResponse.model_slug,
            status: llmResponse.status
        });

        return llmResponse;
    }


    hasAuditor(provider: string): boolean {
        return this.auditors.has(provider);
    }


    getSupportedProviders(): string[] {
        return Array.from(this.auditors.keys());
    }

    private initializeAuditors(): void {

        logger.info('Auditor registry initialized', {
            supportedProviders: this.getSupportedProviders()
        });
    }

    registerAuditor(provider: string, Auditor: IAuditor): void {
        this.auditors.set(provider, Auditor);
        logger.debug(`Registered custom auditor for provider: ${provider}`);
    }
}
