import 'reflect-metadata';
import { container, injectable } from "tsyringe";
import { EvaluatorDB } from "../db";
import { AppDB } from "../db/app.db";
import logger from "../utils/logger";
import type { EvaluatorMessage } from "../types/evaluator.types";
import { Evaluator, EvaluatorData, LlmResponse, Prompt, Provider } from '../db/types';
import { OllamaProvider } from '../providers';
import { OllamaWorkerChatRequest } from '../types/worker.request.types';

import { QueueService } from './queue.service';
import { env } from '../env';

/**
 * Service for processing analysis requests 
 * Performs long-running analysis tasks, at present: 
 * - AI Code Percent - calculates how many and what percentage of Pull Request changes were AI generated 
 */
@injectable()
export class EvaluatorService {

    constructor(

        private evaluatorDb: EvaluatorDB,
        private queueService: QueueService
    ) {
        logger.info('EvaluatorService initialized');
    }

    /**
     * Processes an evaluator message from the queue, runs the evaluation, and queues up subsequent graders.
     * @param {EvaluatorMessage} evaluatorRequest - The message from the queue, containing IDs for the evaluator, response, and optionally previous evaluation data.
     */
    async handleRequest(evaluatorRequest: EvaluatorMessage): Promise<void> {
        const startTime = Date.now();

        try {
            const [evaluator, prompt, provider, llmResponse, evalData] = await this.lookupEvaluator(evaluatorRequest);
            logger.debug(`Running evaluator ${evaluator.name} (id: ${evaluator.id})`);

            const structuredOutput = prompt.parameters?.output_format;
            const systemPrompt = this.substituteTags(prompt.system_prompt || '', evaluator, llmResponse, evalData);
            const userPrompt = this.substituteTags(prompt.user_prompt, evaluator, llmResponse, evalData);
            logger.debug(`structured output ${JSON.stringify(structuredOutput, null, 3)} \n\nsystem prompt ${systemPrompt} \n\nuser prompt: ${userPrompt}`);            

            const evaluateResults = await this.runPrompt(provider, prompt?.model || '', systemPrompt, userPrompt, structuredOutput);

            const resultsData = {
                evaluator_type: evaluatorRequest.taskType,      // indicates type of data eg analyzer, grader etc
                evaluator_id: evaluatorRequest.evaluatorId, 
                prompt_id: prompt.id, 
                user_id: llmResponse.user_id,
                application_id: llmResponse.application_id,
                organization_id: llmResponse.organization_id,
                results: JSON.parse(evaluateResults)
            };
            const newId = await this.evaluatorDb.insert(evaluatorRequest.evaluatorId, evaluatorRequest.responseId, JSON.stringify(resultsData));

            if (evaluatorRequest.taskType !== "grader") { await this.queueGraders(evaluator, llmResponse.id, newId || ''); }

            logger.debug(`Evaluator complete. ran in ${Date.now() - startTime}ms \n\nResults ${JSON.stringify(resultsData, null,2)} \n\n Evaluator data to id ${newId}`);
        } catch (error) {
            logger.error(`Failed to run evaluator: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                analysisRequest: evaluatorRequest,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Queues up grader tasks for an evaluator.
     * Graders are defined in the evaluator's parameters.
     * @param {Evaluator} evaluator - The evaluator object that contains grader configurations.
     * @param {string} responseId - The ID of the original LLM response being evaluated.
     * @param {string} newDataId - The ID of the newly created evaluator data record from the current evaluation.
     */
    async queueGraders(evaluator: Evaluator, responseId: string, newDataId: string): Promise<void> {
        const graders = evaluator.parameters?.graders;
        if (graders && Array.isArray(graders) && graders.length > 0) {
            for (const grader of graders) {
                await this.queueService.sendToExchange(
                    env.queue.directExchange,
                    env.queue.evaluatorRoutingKey,
                    {
                        taskType: "grader",
                        timestamp: Date.now(),
                        evaluatorId: grader.grader_id,
                        responseId: responseId,
                        dataId: newDataId,
                    },
                    { correlationId: newDataId }
                );
                logger.debug(`Queued grader ${grader.prompt_id} for data ${newDataId}`);
            }
        }
        else {
            logger.info(`No graders configured for evaluator ${evaluator.name}`);
        }
    }

    /**
      * Substitutes handlebar-style tags in a template string with values from db table objects.
      * Supports tags in the format {{tableName.fieldName}}.
      * @param template The string containing tags to be replaced.
      * @param evaluator The evaluator data object.
      * @param llmResponse The LLM response data object.
      * @param evalData The evaluator data object.
      * @returns The template string with tags substituted.
      */
    private substituteTags(
        template: string,
        evaluator: Evaluator,
        llmResponse: LlmResponse,
        evalData: EvaluatorData | null
    ): string {
        // map table objects to exact table names so user knows the tag names (table.field')
        const dataContext = {
            evaluators: evaluator,
            llm_responses: llmResponse,
            evaluators_data: evalData
        };

        // Use a regular expression to find all {{tag}} occurrences
        return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (match, tagName) => {
            const parts = tagName.split('.');

            // expecting 'tableName.fieldName' format
            if (parts.length !== 2) {
                return match;
            }

            const [tableName, fieldName] = parts;
            if (dataContext.hasOwnProperty(tableName)) {
                const tableObject = dataContext[tableName as keyof typeof dataContext];

                // Check if the field name exists on that table's data object
                if (tableObject && typeof tableObject === 'object' && fieldName in tableObject) {
                    let value = (tableObject as any)[fieldName];
                    if (llmResponse.provider_slug?.toLowerCase() === 'anthropic' && tableName === 'llm_responses' && fieldName === 'response') {
                        value = (tableObject as any)['response_raw'];
                    }

                    // If the value is an object, stringify it
                    if (typeof value === 'object' && value !== null) {
                        return JSON.stringify(value);
                    }
                    return value?.toString() ?? '';
                }
            }
            return match;       // no match -- send back what was sent in
        });
    }

    /**
     * Runs a prompt against an AI provider and returns the result.
     * @param {Provider} provider - The AI provider to use.
     * @param {string} modelName - The name of the model to use.
     * @param {string} systemPrompt - The system prompt for the AI.
     * @param {string} userPrompt - The user prompt for the AI.
     * @param {Record<string, any>} responseSchema - The expected JSON schema for the response.
     * @returns {Promise<string>} A promise that resolves to the string content of the AI's response.
     */
    async runPrompt(provider: Provider, modelName: string, systemPrompt: string, userPrompt: string, responseSchema: Record<string, any>): Promise<string> {
        try {
            var aiProvider: OllamaProvider = new OllamaProvider(provider, null as any, 'evaluator-worker');
            await aiProvider.init();

            const chatRequest: OllamaWorkerChatRequest = {
                model: modelName,
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
                    { role: 'user', content: userPrompt }
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

    /**
     * Fetches all the necessary data for an evaluation from the database.
     * @param {EvaluatorMessage} evaluatorRequest - The message from the queue.
     * @returns {Promise<[Evaluator, Prompt, Provider, LlmResponse, EvaluatorData | null]>} A promise that resolves to a tuple containing the core evaluation entities.
     */
    async lookupEvaluator(evaluatorRequest: EvaluatorMessage): Promise<[Evaluator, Prompt, Provider, LlmResponse, EvaluatorData | null]> {
        const evaluator: Evaluator | null = await this.evaluatorDb.get(evaluatorRequest.evaluatorId);
        if (!evaluator) {
            throw new Error(`Evaluator was not found by id: ${ evaluatorRequest.evaluatorId } `);
        }
        const prompt: Prompt | null = await this.evaluatorDb.getPrompt(evaluator?.prompt_id || '');
        if (!prompt) {
            throw new Error(`Prompt referenced by evaluator was not found by id: ${ evaluator?.prompt_id } `);
        }
        const provider: Provider | null = await this.evaluatorDb.getProvider(prompt.provider || '');
        if (!provider || !(provider.name.toLowerCase() === 'ollama')) {
            throw new Error(`Provider ${ (!provider ? "was not found" : "must be OLLAMA.") } `);
        }
        const llmResponse: LlmResponse | null = await this.evaluatorDb.getResponse(evaluatorRequest.responseId);
        if (!llmResponse) {
            throw new Error(`LLM Response was not found by id: ${ evaluatorRequest.responseId } `);
        }

        let evaluatorData: EvaluatorData | null = null;
        if ('dataId' in evaluatorRequest) {
            evaluatorData = await this.evaluatorDb.getData(evaluatorRequest.dataId);
            if (!evaluatorData) {
                throw new Error(`Evaluator data was not found.`);
            }
        }
        return [evaluator, prompt, provider, llmResponse, evaluatorData];

    }

}

container.registerSingleton(AppDB);