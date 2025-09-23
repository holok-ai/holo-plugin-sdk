import {injectable} from "tsyringe";
import {IAuditor, ProviderType} from "./types";
import {OllamaAuditor} from "./ollama";
import {ClaudeAuditor} from "./claude";
import {OpenAIAuditor} from "./openai";
import {LLMWorkerRequest, LLMWorkerResponse} from "../types";
import {LlmRequest, LlmResponse} from "../db/types";
import logger from "../utils/logger";

export * from './claude/claude.auditor';
export * from './ollama/ollama.auditor';
export * from './openai/openai.auditor';

@injectable()
export class AuditorRegistry {

    private auditors = new Map<ProviderType, IAuditor>();

    constructor(
        private ollamaAuditor: OllamaAuditor,
        private claudeAuditor: ClaudeAuditor,
        private openaiAuditor: OpenAIAuditor
    ) {
        this.initializeAuditors();
    }


    getAuditor(provider: ProviderType): IAuditor {
        const auditor = this.auditors.get(provider);
        if (!auditor) {
            throw new Error(`No auditor registered for provider: ${provider}`);
        }
        return auditor;
    }


    audit(workerRequest: LLMWorkerRequest): Omit<LlmRequest, 'id'> {
        const auditor = this.getAuditor(workerRequest.providerType);

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
            providerType: workerRequest.providerType,
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


    hasAuditor(provider: ProviderType): boolean {
        return this.auditors.has(provider);
    }


    getSupportedProviders(): ProviderType[] {
        return Array.from(this.auditors.keys());
    }

    private initializeAuditors(): void {
        this.auditors.set(ProviderType.OLLAMA, this.ollamaAuditor);
        this.auditors.set(ProviderType.CLAUDE, this.claudeAuditor);
        this.auditors.set(ProviderType.OPENAI, this.openaiAuditor);
        this.auditors.set(ProviderType.PERPLEXITY, this.openaiAuditor); // Perplexity uses OpenAI format

        logger.info('Auditor registry initialized', {
            supportedProviders: this.getSupportedProviders()
        });
    }

    registerAuditor(provider: ProviderType, Auditor: IAuditor): void {
        this.auditors.set(provider, Auditor);
        logger.debug(`Registered custom auditor for provider: ${provider}`);
    }
}
