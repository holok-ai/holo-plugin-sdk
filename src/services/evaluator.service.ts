import 'reflect-metadata';
import { container, injectable } from "tsyringe";
import { EvaluatorDB } from "../db";
import { AppDB } from "../db/app.db";
import logger from "../utils/logger";
import { EvaluatorEvent, EvaluatorResult, AnalysisEventMapper, LlmResponseMapper, EvaluatorServiceEvent, IEvaluator, EvaluatorsDataResults } from "../types/evaluator.types";
import { createInternalEvaluators, ApplicationEvaluator, PromptEvaluator } from './evaluators/index';
import * as fs from 'fs/promises';

import { QueueService } from './queue.service';
import { env } from '../env';

@injectable()
export class EvaluatorService {

    private evaluatorRegistry: IEvaluator[] = [];

    constructor(
        private evaluatorDb: EvaluatorDB,
        private queueService: QueueService
    ) {
        logger.info('EvaluatorService initialized');
    }

    async init() {
        // Load all evaluators once during initialization
        this.evaluatorRegistry = [
            ...createInternalEvaluators(this.evaluatorDb),
            ...await this.loadExternalEvaluators()
        ];
        logger.info(`Loaded ${this.evaluatorRegistry.length} total evaluators`);
    }

    private async loadExternalEvaluators(): Promise<IEvaluator[]> {
        const externals = await this.evaluatorDb.list();
        const evaluators: IEvaluator[] = [];

        for (const evaluator of externals) {
            const runWith = evaluator.parameters?.run_with;

            try {
                if (runWith === 'application') {
                    evaluators.push(new ApplicationEvaluator(evaluator));
                } else if (runWith === 'prompt') {
                    const promptEval = new PromptEvaluator(evaluator, this.evaluatorDb);
                    await promptEval.init();    // let them load their prompt and provider records
                    evaluators.push(promptEval);
                }
            } catch (error) {
                logger.error(`Failed to load evaluator ${evaluator.name}: ${error}`);
            }
        }

        return evaluators;
    }

    /**
     * Processes an evaluator message from the queue, runs the evaluator, and queues chained events.
     * @param {EvaluatorEvent} evalEvent - Any supported event type (Moku, Audit, Evaluator)
     */
    async handleRequest(evalEvent: EvaluatorEvent): Promise<void> {
        const startTime = Date.now();
        logger.debug(`Running evaluator event ${evalEvent.source} ${evalEvent.eventName}`);
        try {
           
            const handlers = this.evaluatorRegistry.filter(e => e.handlesEventName === evalEvent.eventName);
            if (handlers.length === 0) {
                logger.debug(`No evaluators available for event ${evalEvent.eventName}`);
                return;
            }

            for (const handler of handlers) {
                await this.loadContext(evalEvent);
                const evalResult: EvaluatorResult = await handler.evaluate(evalEvent);
                const savedData = await this.saveResults(handler, evalEvent, evalResult);
                await this.queueChainedEvents(savedData, evalEvent);
            }

            logger.debug(`Evaluator complete. ran in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Failed to run evaluator: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                analysisRequest: evalEvent,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    private async queueChainedEvents(savedData: EvaluatorsDataResults | null, evalEvent: EvaluatorEvent): Promise<void> {
        if (savedData && savedData.status.next_events && savedData.status.next_events.length > 0) {
            logger.debug(`Queing follow-on events (count=${savedData.status.next_events.length}).`);

            for (const chainedEvent of savedData.status.next_events) {
                const chainedEventMessage: EvaluatorServiceEvent = {
                    eventName: chainedEvent.eventName,
                    source: chainedEvent.source,
                    timestamp: chainedEvent.timestamp,
                    context: savedData ? [{key: "previous", value: savedData}] : []
                };
                // for testing
                // await this.handleRequest(chainedEventMessage); 
                await this.queueService.sendToExchange(
                    env.queue.directExchange,
                    env.queue.evaluatorRoutingKey,
                    chainedEventMessage,
                    { correlationId: evalEvent.timestamp.toPrecision(4) }
                );
            }
        }
    }

    private async saveResults(handler: IEvaluator, evalEvent: EvaluatorEvent, evalResults: EvaluatorResult): Promise<EvaluatorsDataResults | null> {
        if (evalResults.status.toLowerCase() !== "ok") {
            return null;
        }

        // If resultsFileName is provided, load from file
        if (evalResults.resultsFileName) {
            const fileContent = await fs.readFile(evalResults.resultsFileName, 'utf-8');
            const fileData = JSON.parse(fileContent);
            evalResults.result = { key: "output", value: fileData };
        }

        if (evalResults.result) {
            const evaluatorDataResults: EvaluatorsDataResults = {
                status: {
                    status: evalResults.status,
                    message: evalResults.message,
                    next_events: evalResults.result.value?.next_events || [] 
                },
                reference: {
                    organization_id: evalResults.organizationId || "00000000-0000-0000-0000-000000000001",
                    user_id: evalResults.userId || "",
                    application_id: evalResults.applicationId || "",
                    event_name: evalEvent.eventName,
                    event_source: evalEvent.source,
                    evaluator_type: handler.runType,
                    evaluator_id: handler.evaluatorId,
                    evaluator_name: handler.evaluatorName,
                    saved_data_id: ''
                },
                data: evalResults.result?.value || {}
            };

            const dataToSave = JSON.stringify(evaluatorDataResults);
            const evaluatorId = handler.evaluatorId && handler.evaluatorId.trim() ? handler.evaluatorId : null;
            const llmResponseId = ('llmResponseDataId' in evalEvent && evalEvent.llmResponseDataId && evalEvent.llmResponseDataId.trim()) ? evalEvent.llmResponseDataId : null;
            evaluatorDataResults.reference.saved_data_id = await this.evaluatorDb.insert( evaluatorId, llmResponseId, dataToSave) || '';
            
            return evaluatorDataResults;
        }
        
        return null;
    }

    private async loadContext(genericEvent: EvaluatorEvent): Promise<any> {
        if (!genericEvent.context) genericEvent.context = [];

        if (genericEvent.source === 'moku') {
            const analysisData = await this.evaluatorDb.getAnalysisData(genericEvent.analysisEventId);
            if (!analysisData) {
                throw new Error(`Moku event ${genericEvent.eventName} had bad analysis_events id (${genericEvent.analysisEventId}).`);
            }
            genericEvent.context.push({ key: "analysis_events", value: AnalysisEventMapper.fromRow(analysisData) });
        }
        if (genericEvent.source === 'audit') {
            const responseData = await this.evaluatorDb.getResponse(genericEvent.llmResponseDataId);
            if (!responseData) {
                throw new Error(`Audit event ${genericEvent.eventName} had bad llm_responses id (${genericEvent.llmResponseDataId}).`);
            }
            genericEvent.context.push({ key: "llm_responses", value: LlmResponseMapper.fromRow(responseData) });
        }
        if (genericEvent.source === 'evaluator') {
            if (genericEvent.llmResponseDataId) {
                const responseData = await this.evaluatorDb.getResponse(genericEvent.llmResponseDataId || '');
                if (!responseData) {
                    throw new Error(`Evaluator event ${genericEvent.eventName} had bad llm response id (${genericEvent.llmResponseDataId}).`);
                }
                genericEvent.context.push({ key: "llm_responses", value: LlmResponseMapper.fromRow(responseData) });
            }
            if (genericEvent.evaluatorDataId) {
                const analysisData = await this.evaluatorDb.getData(genericEvent.evaluatorDataId || '');
                if (!analysisData) {
                    throw new Error(`Evaluator event ${genericEvent.eventName} had bad evaluators data id (${genericEvent.evaluatorDataId}).`);
                }
                genericEvent.context.push({ key: "evaluators_data", value: LlmResponseMapper.fromRow(analysisData) });
            }
        }
    }

}

container.registerSingleton(AppDB);