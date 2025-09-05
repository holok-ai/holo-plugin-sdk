import 'reflect-metadata';
import { container, injectable } from "tsyringe";
import { EvaluatorDB } from "../db";
import { AppDB } from "../db/app.db";
import logger from "../utils/logger";
import type { EvaluatorQCommand } from "../types/evaluator.types";
import { Evaluator, LlmResponse, Prompt, Provider } from '../db/types';
import { OllamaProvider } from '../providers';
import { OllamaWorkerChatRequest } from '../types/worker.request.types';

/**
 * Service for processing analysis requests 
 * Performs long-running analysis tasks, at present: 
 * - AI Code Percent - calculates how many and what percentage of Pull Request changes were AI generated 
 */
@injectable()
export class EvaluatorService {

    constructor(

        private evaluatorDb: EvaluatorDB
    ) {
        logger.info('EvaluatorService initialized');
    }

    /**
     * Processes a Q message containing an evaluator id and a response id
     * @param {analysisRequest}  {analysisEventId: string, eventType: string}  
     */
    async handleRequest(evaluatorRequest: EvaluatorQCommand): Promise<void> {
        const startTime = Date.now();

        try {
            const [evaluator, prompt, provider, llmResponse] = await this._lookupEvaluator(evaluatorRequest);
            logger.debug(`Running evaluator ${evaluator.name} (id: ${evaluator.id})`);

            const results = await this.runPrompt(provider, prompt, llmResponse);

            await this.evaluatorDb.insert(results, evaluatorRequest.evaluatorId, evaluatorRequest.responseId, evaluatorRequest.applicationId,
                llmResponse.user_id || '', llmResponse.organization_id || '');

            logger.info(`Successfully ran prompt: ${results} in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Failed to run evaluator: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                analysisRequest: evaluatorRequest,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    async runPrompt(provider: Provider, prompt: Prompt, llmResponse: LlmResponse): Promise<String> {
        try {
            const userPrompt = `${prompt.user_prompt} ${JSON.stringify(llmResponse.response)} ${JSON.stringify(llmResponse.response_raw)}`;
            logger.debug(`Sending to Ollama: user prompt ${userPrompt}`);

            var aiProvider: OllamaProvider = new OllamaProvider(provider, null as any, 'evaluator-worker');
            await aiProvider.init();

            const responseSchema = this._createStructuredOutput();
            const chatRequest: OllamaWorkerChatRequest = {
                model: prompt?.model || '',
                messages: [
                    {
                        role: 'system',
                        content: prompt.system_prompt || 'You are a helpful assistant.'
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                format: responseSchema,
                stream: false
            };

            // @ts-ignore
            const response = await aiProvider.client.chat(chatRequest);
            return response.message.content;

        } catch (error) {
            logger.error('Failed to call Ollama chat stream:', error);
            throw error;
        }
    }

    // provide JSON definition of required output - no zod
    _createStructuredOutput() {
        return {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                programming_language: { type: 'string' },
                original_text: { type: 'string' },
                proposed_text: { type: 'string' },
                comments: { type: 'string' }
            },
            required: ['file_path', 'programming_language', 'original_text', 'proposed_text', 'comments']
        };
    }

    async _lookupEvaluator(evaluatorRequest: EvaluatorQCommand): Promise<[Evaluator, Prompt, Provider, LlmResponse]> {
        const evaluator: Evaluator | null = await this.evaluatorDb.get(evaluatorRequest.evaluatorId);
        if (!evaluator) {
            throw new Error(`Evaluator was not found by id: ${evaluatorRequest.evaluatorId}`);
        }
        const prompt: Prompt | null = await this.evaluatorDb.getPrompt(evaluator?.prompt_id || '');
        if (!prompt) {
            throw new Error(`EValuator specified prompt was not found by id: ${evaluator.prompt_id}`);
        }
        const provider: Provider | null = await this.evaluatorDb.getProvider(prompt.provider || '');
        if (!provider || !(provider.name.toLowerCase() === 'ollama')) {
            throw new Error(`Provider ${(!provider ? "was not found" : "must be OLLAMA.")}`);
        }
        const llmResponse: LlmResponse | null = await this.evaluatorDb.getResponse(evaluatorRequest.responseId);
        if (!llmResponse) {
            throw new Error(`LLM Response was not found by id: ${evaluatorRequest.responseId}`);
        }
        return [evaluator, prompt, provider, llmResponse];
    }

}

container.registerSingleton(AppDB);
