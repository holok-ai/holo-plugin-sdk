import 'reflect-metadata';
import { container, injectable } from "tsyringe";
import { EvaluatorDB, ProviderDB } from "../db";
import { AppDB } from "../db/app.db";
import logger from "../utils/logger";
import { Evaluator, Prompt, Provider } from '../db/types';
import { ClaudeProvider, OllamaProvider } from '../providers';
import { OllamaWorkerChatRequest } from '../types/worker.request.types';
import { MessageCreateParams } from '@anthropic-ai/sdk/resources';

@injectable()
export class GraderService {

    constructor(
        private evaluatorDb: EvaluatorDB,
        private providerDB: ProviderDB
    ) {
        logger.info('GraderService initialized');
    }

    async runGrader(): Promise<void> {
        try {
            logger.info('Running grader...');
            const ungradedData = await this.evaluatorDb.getUngradedEvaluatorData();
            if (!ungradedData || ungradedData.length === 0) {
                logger.info('No ungraded data found.');
                return;
            }

            logger.info(`Found ${ungradedData.length} records to grade.`);
            for (const data of ungradedData) {

                const [evaluator, prompt, provider] = await this.getEvaluatoraAndPrompt(data.evaluator_id);
                const userPrompt = prompt?.user_prompt.replace('{{DATA_TO_GRADE}}', JSON.stringify(data.results));
                var response: any;
                const responseSchema = this._createStructuredOutput();

                if (provider.type === 'ANTHROPIC') {
                    logger.info('Loading anthropic provider to run grading prompt. ');
                    const claudeProvider = new ClaudeProvider(provider, null as any, 'grader-worker');
                    await claudeProvider.init();
                    const messageRequest: MessageCreateParams = {
                        model: prompt.model || '',
                        system: prompt.system_prompt || 'You are a grading agent, in a teacher-student test. You will be reviewing what another model created.',
                        stream: false,
                        messages: [
                            { role: 'user', content: userPrompt || '' }
                        ],
                        max_tokens: 10,
                    };
                    response = await (claudeProvider as any).client.messages.create(messageRequest);
                }
                if (provider.type == 'OLLAMA') {
                    var aiProvider: OllamaProvider = new OllamaProvider(provider, null as any, 'grader-worker');
                    await aiProvider.init();

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
                    const raw_response = await aiProvider.client.chat(chatRequest);
                    response = raw_response.message.content;
                }

                let rawScore = 0;
                if (response && response.length > 0) {
                    const content = JSON.parse(response);
                    const parsedScore = content.score; //  parseInt(content);
                    if (!isNaN(parsedScore)) {
                        rawScore = parsedScore;
                    }
                }

                const scaledScore = rawScore / 4.0;

                await this.evaluatorDb.updateEvaluatorDataScore(data.id, rawScore, scaledScore);
                logger.info(`Graded evaluator ${evaluator?.name} record ${data.id} with raw score ${rawScore}`);
            }

            logger.info('Grader run complete.');
        }
        catch (error) {
            logger.error('Failed to complete grading:', error);
            throw error;
        }
    }

    // provide JSON definition of required output 
    _createStructuredOutput() {
        return {
            type: 'object',
            properties: {
                score: { type: 'number' }
            },
            required: ['score']
        };
    }
    async getEvaluatoraAndPrompt(evaluatorId: string): Promise<[Evaluator, Prompt, Provider]> {
        const evaluator: Evaluator | null = await this.evaluatorDb.get(evaluatorId);
        if (!evaluator || !evaluator.grading_prompt_id) {
            throw new Error(`Evaluator was not found by id: ${evaluatorId}`);
        }
        const prompt: Prompt | null = await this.evaluatorDb.getPrompt(evaluator.grading_prompt_id);
        if (!prompt || !prompt.provider) {
            throw new Error(`Grading prompt was not found by id: ${evaluator.grading_prompt_id}`);
        }
        const provider: Provider | null = await this.providerDB.get(prompt?.provider);
        if (!provider) {
            throw new Error(`Provider was not found by name: ${prompt?.provider}`);
        }
        return [evaluator, prompt, provider];
    }
}

container.registerSingleton(AppDB);
