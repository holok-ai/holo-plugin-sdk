import { injectable } from 'tsyringe';
import { IRequestTranslator } from './types';
import { Provider, LLMWorkerRequest } from '../types/provider-request.types';
import { LlmRequest } from '../db/types';
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
            user_prompt: undefined,
            options: undefined,
            source_id: undefined,
            user_id: undefined,
            timestamp: '',
            raw_request: undefined,
            application_id: '',
            provider_slug: '',
            system_prompt: undefined
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