import 'reflect-metadata';
import {container, injectable} from "tsyringe";
import {AnalysisDB} from "../db";
import {AppDB} from "../db/app.db";
import logger from "../utils/logger";
import type {AnalysisEvent} from "../types";
import type {AnalysisProcessor, AnalysisRequest} from "../types/analysis.types";
import {AzurePrProcessor} from "./analysis/azurepr.processor";

@injectable()
export class AnalysisProcessorFactory {
    constructor(private analysisDb: AnalysisDB) {
    }

    createProcessor(taskType: string): AnalysisProcessor {
        switch (taskType.toLowerCase()) {
            case 'azure_pr':
                return new AzurePrProcessor(this.analysisDb);
            default:
                throw new Error(`Unknown analysis task type: ${taskType}`);
        }
    }
}

/**
 * Service for processing analysis requests 
 * Performs long-running analysis tasks, at present: 
 * - AI Code Percent - calculates how many and what percentage of Pull Request changes were AI generated 
 */
@injectable()
export class AnalysisService {

    constructor(
        private processorFactory: AnalysisProcessorFactory,
        private analysisDb: AnalysisDB
    ) {
        logger.info('AnalysisService initialized');
    }

    /**
     * Processes a Q message containing an analysis_event table record id 
     * Instantiates an analysis task based on the task type indicatedin Q message 
     * @param {analysisRequest}  {analysisEventId: string, eventType: string}  
     */
    async processAnalysisRequest(analysisRequest: AnalysisRequest): Promise<void>{
        const startTime = Date.now();
        
        try {
            logger.debug(`Received AnalysisRequest - analysisEventId: ${analysisRequest.eventId} task type: ${analysisRequest.eventType}`);
            
            const analysisEvent : AnalysisEvent | null = await this.analysisDb.findById(analysisRequest.eventId);
            if (!analysisEvent) {
                 throw new Error(`Analysis event not found with id: ${analysisRequest.eventId}`);                
            }

            const processor = this.processorFactory.createProcessor(analysisRequest.eventType);
            
            const parameterData = analysisEvent.parameters ? JSON.stringify(analysisEvent.parameters) : '';            
            await processor.processTask(analysisRequest.eventId, analysisRequest.eventType, 
                analysisEvent.event_data, 
                parameterData); 
            
            logger.info(`Successfully processed AnalysisRequest - analysisEventId: ${analysisRequest.eventId} in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Failed to perform analysis request: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                analysisRequest: analysisRequest,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

}

container.registerSingleton(AppDB);
