import 'reflect-metadata';
import {AuditServiceEvent} from '../types';
import {LlmRequest, LlmResponse, LlmStatus} from "../db/types";
import {container, injectable} from "tsyringe";
import {AppDB, EvaluatorDB, RequestDB, ResponseDB} from "../db";
import logger from "../utils/logger";
import {QueueService} from "./queue.service";
import {env} from '../env';
import {AuditorRegistry} from "./providers/auditors";
import {HoloWorkerRequest, HoloWorkerResponse} from "@holokai/sdk";

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
        private auditRegistry: AuditorRegistry,
        private queueService: QueueService
    ) {
        logger.info('AuditService initialized');
    }

    /**
     * Log LLM request to database with comprehensive audit trail
     * Supports both HoloWorkerRequest and direct LlmRequest formats
     * @param {HoloWorkerRequest | Omit<LlmRequest, 'id'>} content - Request data to log
     */
    async logRequest(content: HoloWorkerRequest | Omit<LlmRequest, 'id'>): Promise<void> {
        const startTime = Date.now();

        try {
            // Type guard to check if it's an HoloWorkerRequest
            if (this.isHoloWorkerRequest(content)) {
                logger.debug(`Logging HoloWorkerRequest - requestId: ${content.requestId}, type: ${content.type}, provider: ${content.providerType}`);
                const mappedRequest = this.auditRegistry.audit(content);
                await this.insertRequest(mappedRequest);
                logger.info(`Successfully logged HoloWorkerRequest ${content.requestId} in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmRequest - requestId: ${content.request_id}, type: ${content.request_type}`);
                await this.insertRequest(content);
                logger.info(`Successfully logged LlmRequest ${content.request_id} in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            logger.error(`Failed to log request: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: this.isHoloWorkerRequest(content) ? content.requestId : content.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Type guard to determine if object is an HoloWorkerRequest
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is HoloWorkerRequest
     * @private
     */
    private isHoloWorkerRequest(obj: any): obj is HoloWorkerRequest {
        const isWorkerRequest = obj.payload !== undefined &&
            obj.sourceId !== undefined &&
            obj.providerType !== undefined &&
            obj.type !== undefined;
        logger.debug(`Type guard check - isHoloWorkerRequest: ${isWorkerRequest}`);
        return isWorkerRequest;
    }

    // HoloWorkerRequest mapping is now handled by the TranslatorRegistry
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
     * Supports HoloWorkerResponse and direct LlmResponse formats
     * @param {HoloWorkerResponse | Omit<LlmResponse, 'id'>} content - Response data to log
     * @param requestContext - Optional context for userId and applicationId
     */
    async logResponse(content: HoloWorkerResponse, requestContext?: {
        userId?: string;
        applicationId?: string
    }): Promise<void>;
    async logResponse(content: Omit<LlmResponse, 'id'>): Promise<void>;
    async logResponse(content: HoloWorkerResponse | Omit<LlmResponse, 'id'>, requestContext?: {
        userId?: string;
        applicationId?: string
    }): Promise<void> {
        const startTime = Date.now();

        try {
            if (this.isHoloWorkerResponse(content)) {
                logger.debug(`Logging HoloWorkerResponse - requestId: ${content.requestId}, provider: ${content.providerType}`);
                const mappedResponse = this.auditRegistry.auditResponse(content, requestContext);
                const responseId = await this.insertResponse(mappedResponse);
                if (mappedResponse.status === LlmStatus.SUCCESS && responseId) await this.sendToEvaluatorQ(responseId, mappedResponse.application_id);
                logger.info(`Successfully logged HoloWorkerResponse ${content.requestId} (${content.providerType}) in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmResponse - requestId: ${content.request_id}`);
                await this.insertResponse(content);
                logger.info(`Successfully logged LlmResponse ${content.request_id} in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            const requestId = this.isHoloWorkerResponse(content) ? content.requestId : content.request_id;
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
        const auditEvent: AuditServiceEvent = {
            source: "audit",
            eventName: "response-complete",
            timestamp: Date.now(),
            llmResponseDataId: responseId
        };
        await this.queueService.sendToExchange(
            env.queue.directExchange,
            env.queue.evaluatorRoutingKey,
            auditEvent,
            {correlationId: responseId}
        );

    }

    /**
     * Type guard to determine if object is an HoloWorkerResponse
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is HoloWorkerResponse
     * @private
     */
    private isHoloWorkerResponse(obj: any): obj is HoloWorkerResponse {
        const isWorkerResponse = obj.requestId !== undefined &&
            obj.providerType !== undefined &&
            obj.payload !== undefined &&
            obj.sourceId !== undefined;
        logger.debug(`Type guard check - isHoloWorkerResponse: ${isWorkerResponse}`);
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
