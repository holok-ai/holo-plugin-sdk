import OpenAI from 'openai';
import {ModelInfo} from '../types';
import {ErrorMessages} from '../../utils';
import {ResponseService} from "../../services";
import {Provider} from "../../db/types";
import {OpenAIProvider} from "../openai";

/**
 * Perplexity provider for connecting to OpenAI API
 */
export class PerplexityProvider extends OpenAIProvider {
    protected readonly client: OpenAI;

    constructor(
        protected provider: Provider,
        protected responseService: ResponseService,
        protected workerId: string) {
        super(provider, responseService, workerId);
        if (!this.config.apiKey) {
            throw new Error(ErrorMessages.apiKeyRequired('Perplexity'));
        }

        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            baseURL: this.config.baseUrl || 'https://api.perplexity.ai',
        });
    }

    async getModels(): Promise<ModelInfo[]> {
        try {
            const modelList = [
                {
                    id: 'sonar',
                    name: 'sonar',
                    modified_at: new Date(1651000000000).toISOString(),
                },
                {
                    id: 'sonar-pro',
                    name: 'sonar-pro',
                    modified_at: new Date(1651000000000).toISOString(),
                }
            ]

            // Update internal models cache
            this.models = modelList.reduce((acc, model) => {
                acc[model.id] = model;
                return acc;
            }, {} as Record<string, ModelInfo>);

            this.log.debug(`Perplexity models: ${Object.keys(this.models)}`);
            return modelList;
        } catch (error) {
            this.log.error(`Error fetching Perplexity models: ${(error as Error).message}`);
            throw error;
        }
    }
}
