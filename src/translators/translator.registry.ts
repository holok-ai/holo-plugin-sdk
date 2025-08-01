import { injectable } from 'tsyringe';
import { IRequestTranslator } from './types';
import { Provider, LLMWorkerRequest, LLMWorkerResponse } from '../types/provider-request.types';
import { LlmRequest, LlmResponse } from '../db/types';
import { OllamaRequestTranslator } from './providers/ollama.translator';
import { ClaudeRequestTranslator } from './providers/claude.translator';
import { OpenAIRequestTranslator } from './providers/openai.translator';
import logger from '../utils/logger';

@injectable()
export class TranslatorRegistry {
    private translators = new Map<Provider, IRequestTranslator>();

    constructor(
        private ollamaTranslator: OllamaRequestTranslator,
        private claudeTranslator: ClaudeRequestTranslator,
        private openaiTranslator: OpenAIRequestTranslator
    ) {
        this.initializeTranslators();
    }

    /**
     * Get translator for a specific provider
     */
    getTranslator(provider: Provider): IRequestTranslator {
        const translator = this.translators.get(provider);
        if (!translator) {
            throw new Error(`No translator registered for provider: ${provider}`);
        }
        return translator;
    }

    /**
     * Translate LLMWorkerRequest to LlmRequest using appropriate provider translator
     */
    translate(workerRequest: LLMWorkerRequest): Omit<LlmRequest, 'id'> {
        const translator = this.getTranslator(workerRequest.provider);
        
        // Create empty LlmRequest object
        const llmRequest: Omit<LlmRequest, 'id'> = {
            request_id: '',
            request_type: '',
            model_slug: '',
            timestamp: '',
            application_id: '',
            provider_slug: ''
        };

        // Use translator to populate fields
        translator.translate(workerRequest, llmRequest);

        logger.debug('Translated LLMWorkerRequest to LlmRequest', {
            provider: workerRequest.provider,
            requestId: workerRequest.requestId,
            model: llmRequest.model_slug
        });

        return llmRequest;
    }

    /**
     * Translate LLMWorkerResponse to LlmResponse using appropriate provider translator
     */
    translateResponse(
        workerResponse: LLMWorkerResponse,
        requestContext?: { userId?: string; applicationId?: string }
    ): Omit<LlmResponse, 'id'> {
        const translator = this.getTranslator(workerResponse.provider);
        
        // Create empty LlmResponse object
        const llmResponse: Omit<LlmResponse, 'id'> = {
            created_at: '',
            application_id: '',
            request_id: '',
            provider_slug: '',
            model_slug: '',
            status: undefined as any,
            cost: 0,
            worker_id: ''
        };

        // Use translator to populate fields
        translator.translateResponse(workerResponse, llmResponse, requestContext);

        logger.debug('Translated LLMWorkerResponse to LlmResponse', {
            provider: workerResponse.provider,
            requestId: workerResponse.requestId,
            model: llmResponse.model_slug,
            status: llmResponse.status
        });

        return llmResponse;
    }

    /**
     * Check if a provider has a registered translator
     */
    hasTranslator(provider: Provider): boolean {
        return this.translators.has(provider);
    }

    /**
     * Get all supported providers
     */
    getSupportedProviders(): Provider[] {
        return Array.from(this.translators.keys());
    }

    private initializeTranslators(): void {
        this.translators.set(Provider.OLLAMA, this.ollamaTranslator);
        this.translators.set(Provider.CLAUDE, this.claudeTranslator);
        this.translators.set(Provider.OPENAI, this.openaiTranslator);
        this.translators.set(Provider.PERPLEXITY, this.openaiTranslator); // Perplexity uses OpenAI format

        logger.info('Translator registry initialized', {
            supportedProviders: this.getSupportedProviders()
        });
    }

    /**
     * Register a custom translator (for extensibility)
     */
    registerTranslator(provider: Provider, translator: IRequestTranslator): void {
        this.translators.set(provider, translator);
        logger.debug(`Registered custom translator for provider: ${provider}`);
    }
}