import 'reflect-metadata';
import {LLMWorkerResponse, LLMWorkerRequest} from '../types';
import {LlmRequest, LlmResponse, LlmStatus} from "../db/types";
import {container, injectable} from "tsyringe";
import {EvaluatorDB, RequestDB, ResponseDB} from "../db";
import {AppDB} from "../db/app.db";
import logger from "../utils/logger";
import { TranslatorRegistry } from '../translators';
import {QueueService} from "./queue.service";
import {env} from '../env';

/**
 * Service for auditing and logging LLM requests and responses
 * Handles mapping between proxy types and database types, with comprehensive logging
 */
@injectable()
export class AuditService {

    constructor(
        private evaluatorDB: EvaluatorDB, 
        private requestDB: RequestDB,
        private responseDB: ResponseDB,
        private translatorRegistry: TranslatorRegistry,
        private queueService: QueueService
    ) {
        logger.info('AuditService initialized');
    }

    /**
     * Log LLM request to database with comprehensive audit trail
     * Supports both LLMWorkerRequest and direct LlmRequest formats
     * @param {LLMWorkerRequest | Omit<LlmRequest, 'id'>} content - Request data to log
     */
    async logRequest(content: LLMWorkerRequest): Promise<void>;
    async logRequest(content: Omit<LlmRequest, 'id'>): Promise<void>;
    async logRequest(content: LLMWorkerRequest | Omit<LlmRequest, 'id'>): Promise<void> {
        const startTime = Date.now();

        try {
            // Type guard to check if it's an LLMWorkerRequest
            if (this.isLLMWorkerRequest(content)) {
                logger.debug(`Logging LLMWorkerRequest - requestId: ${content.requestId}, type: ${content.type}, provider: ${content.providerType}`);
                const mappedRequest = this.translatorRegistry.translate(content);
                await this.insertRequest(mappedRequest);
                logger.info(`Successfully logged LLMWorkerRequest ${content.requestId} in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmRequest - requestId: ${content.request_id}, type: ${content.request_type}`);
                await this.insertRequest(content);
                logger.info(`Successfully logged LlmRequest ${content.request_id} in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            logger.error(`Failed to log request: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: this.isLLMWorkerRequest(content) ? content.requestId : content.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Type guard to determine if object is an LLMWorkerRequest
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is LLMWorkerRequest
     * @private
     */
    private isLLMWorkerRequest(obj: any): obj is LLMWorkerRequest {
        const isWorkerRequest = obj.payload !== undefined &&
                               obj.sourceId !== undefined &&
                               obj.providerType !== undefined &&
                               obj.type !== undefined;
        logger.debug(`Type guard check - isLLMWorkerRequest: ${isWorkerRequest}`);
        return isWorkerRequest;
    }

    // LLMWorkerRequest mapping is now handled by the TranslatorRegistry
    // This provides better type safety and provider-specific field extraction

    /**
     * Insert request record into database
     * @param {Omit<LlmRequest, 'id'>} content - Request data to insert
     * @private
     */
    private async insertRequest(content: Omit<LlmRequest, 'id'>): Promise<void> {
        const startTime = Date.now();
        try {
            await this.requestDB.insert(content);
            logger.debug(`Database insert successful for request ${content.request_id} in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Database insert failed for request ${content.request_id}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: content.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Log LLM response to database with comprehensive audit trail
     * Supports LLMWorkerResponse and direct LlmResponse formats
     * @param {LLMWorkerResponse | Omit<LlmResponse, 'id'>} content - Response data to log
     * @param requestContext - Optional context for userId and applicationId
     */
    async logResponse(content: LLMWorkerResponse, requestContext?: { userId?: string; applicationId?: string }): Promise<void>;
    async logResponse(content: Omit<LlmResponse, 'id'>): Promise<void>;
    async logResponse(content: LLMWorkerResponse | Omit<LlmResponse, 'id'>, requestContext?: { userId?: string; applicationId?: string }): Promise<void> {
        const startTime = Date.now();

        try {
            if (this.isLLMWorkerResponse(content)) {
                logger.debug(`Logging LLMWorkerResponse - requestId: ${content.requestId}, provider: ${content.providerType}`);
                const mappedResponse = this.translatorRegistry.translateResponse(content, requestContext);
                const responseId = await this.insertResponse(mappedResponse);
                if (mappedResponse.status === LlmStatus.SUCCESS && responseId) await this.sendToEvaluatorQ(responseId, mappedResponse.application_id); 
                logger.info(`Successfully logged LLMWorkerResponse ${content.requestId} (${content.providerType}) in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmResponse - requestId: ${content.request_id}`);
                await this.insertResponse(content);
                logger.info(`Successfully logged LlmResponse ${content.request_id} in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            const requestId = this.isLLMWorkerResponse(content) ? content.requestId : content.request_id;
            logger.error(`Failed to log response: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: requestId,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Creates a list of evaluators for the application id (in the response) and queues a msg for each evaluator
     * @param responseId - the llm response to evaluate
     * @param applicationId - the application used for the request-response
     */
    async sendToEvaluatorQ(responseId: string, applicationId: string): Promise<void> {
        // if default string, use default application
        if (applicationId.toLowerCase() === 'default') {
            const application = await this.evaluatorDB.getApplicationByName(applicationId); 
            applicationId = application?.id || '';
            logger.info(`Using default application. ${application?.id} `);
        }
        const evaluators = await this.evaluatorDB.list(applicationId); 
        if (!evaluators || evaluators.length == 0) {
            logger.info(`No evaluators found for application. ${applicationId} `);
            return; 
        }

        // send a message to evaluator Q for each (evaluator,application) pair
        for (const evaluator of evaluators) {
            await this.queueService.sendToExchange(
                    env.queue.directExchange,
                    env.queue.evaluatorRoutingKey, 
                    {
                        taskType: "analyzer",
                        timestamp: Date.now(),
                        evaluatorId: evaluator.id,
                        responseId: responseId, 
                        applicationId: applicationId
                    },
                    {correlationId: responseId}
                );
        }
    }

    /**
     * Type guard to determine if object is an LLMWorkerResponse
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is LLMWorkerResponse
     * @private
     */
    private isLLMWorkerResponse(obj: any): obj is LLMWorkerResponse {
        const isWorkerResponse = obj.requestId !== undefined &&
                                obj.providerType !== undefined &&
                                obj.payload !== undefined &&
                                obj.sourceId !== undefined;
        logger.debug(`Type guard check - isLLMWorkerResponse: ${isWorkerResponse}`);
        return isWorkerResponse;
    }


    /**
     * Insert response record into database
     * @param {Omit<LlmResponse, 'id'>} content - Response data to insert
     * @private
     */
    private async insertResponse(content: Omit<LlmResponse, 'id'>): Promise<string | null> {
        const startTime = Date.now();
        try {
            const result = await this.responseDB.insert(content);
            logger.debug(`Database insert successful for response ${content.request_id} new id ${result?.id} in ${Date.now() - startTime}ms`);
            return result ? result.id : null;
        } catch (error) {
            logger.error(`Database insert failed for response ${content.request_id}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: content.request_id,
                status: content.status,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }
}

container.registerSingleton(AppDB);
