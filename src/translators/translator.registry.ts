import {injectable} from 'tsyringe';
import {IRequestTranslator, ProviderType} from './types';
import {LLMWorkerRequest, LLMWorkerResponse} from '../types';
import {LlmRequest, LlmResponse} from '../db/types';
import {ClaudeRequestTranslator, OllamaRequestTranslator, OpenAIRequestTranslator} from './providers';
import logger from '../utils/logger';

/**
 * Central registry for managing provider-specific request/response translators.
 *
 * This registry implements the Factory pattern to provide appropriate translators
 * for converting between LLMWorkerRequest/Response formats and database formats.
 * It serves as the main entry point for the translation system, handling:
 *
 * - Provider-specific translator lookup and management
 * - Bidirectional translation (request and response)
 * - Extensibility through custom translator registration
 * - Type-safe translation operations with proper error handling
 *
 * The registry is TSyringe injectable and automatically initializes all
 * supported provider translators on construction.
 *
 * @example
 * ```typescript
 * // Translate incoming worker request to database format
 * const dbRequest = registry.translate(workerRequest);
 *
 * // Translate worker response to database format
 * const dbResponse = registry.translateResponse(workerResponse);
 * ```
 */
@injectable()
export class TranslatorRegistry {
    /**
     * Internal registry mapping providers to their specific translators.
     * Uses Map for O(1) lookup performance and type safety.
     */
    private translators = new Map<ProviderType, IRequestTranslator>();

    /**
     * Initialize the translator registry with all supported provider translators.
     *
     * @param ollamaTranslator - Handles Ollama generate/chat request formats
     * @param claudeTranslator - Handles Claude message format and stream events
     * @param openaiTranslator - Handles OpenAI chat completions and streaming
     */
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
    getTranslator(provider: ProviderType): IRequestTranslator {
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
    hasTranslator(provider: ProviderType): boolean {
        return this.translators.has(provider);
    }

    /**
     * Get all supported providers
     */
    getSupportedProviders(): ProviderType[] {
        return Array.from(this.translators.keys());
    }

    private initializeTranslators(): void {
        this.translators.set(ProviderType.OLLAMA, this.ollamaTranslator);
        this.translators.set(ProviderType.CLAUDE, this.claudeTranslator);
        this.translators.set(ProviderType.OPENAI, this.openaiTranslator);
        this.translators.set(ProviderType.PERPLEXITY, this.openaiTranslator); // Perplexity uses OpenAI format

        logger.info('Translator registry initialized', {
            supportedProviders: this.getSupportedProviders()
        });
    }

    /**
     * Register a custom translator (for extensibility)
     */
    registerTranslator(provider: ProviderType, translator: IRequestTranslator): void {
        this.translators.set(provider, translator);
        logger.debug(`Registered custom translator for provider: ${provider}`);
    }
}
