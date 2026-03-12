import 'reflect-metadata';
import {AuditServiceEvent} from '../types';
import {inject, injectable} from "tsyringe";
import {EvaluatorDB, RequestDB, ResponseDB} from "../db";
import {QueueService} from "./queue.service";
import {env} from '../env';
import {ClassLogger} from "@holokai/sdk";
import type {HoloWorkerRequest, HoloWorkerResponse} from "@holokai/types/worker";
import {ProviderRequest, ProviderResponse} from "@holokai/types/entities";
import {NotificationStoreToken} from "@holokai/sdk/notification";
import type {NotificationEvent} from "@holokai/types/notification";
import {PostgresNotificationStore} from "../db/notification.db";
import {ProviderImplService} from "./plugin";
import {PricingService} from "./pricing.service";

/**
 * Service for auditing and logging LLM requests and responses
 * Handles mapping between proxy types and database types, with comprehensive logging
 */
@injectable()
export class AuditService extends ClassLogger {

    constructor(
        private readonly providerImplService: ProviderImplService,
        @inject(NotificationStoreToken) private readonly notificationDB: PostgresNotificationStore,
        private evaluatorDB: EvaluatorDB,
        private requestDB: RequestDB,
        private responseDB: ResponseDB,
        private queueService: QueueService,
        private pricingService: PricingService,
    ) {
        super();
        this.log.info('AuditService initialized');
    }

    /**
     * Log LLM request to database with comprehensive audit trail
     * Supports both HoloWorkerRequest and direct ProviderRequest formats
     * @param {HoloWorkerRequest | Omit<ProviderRequest, 'id'>} request - Request data to log
     */
    async logRequest(request: HoloWorkerRequest | Omit<ProviderRequest, 'id'>): Promise<void> {
        const logger = this.mlog(this.logRequest);
        const startTime = Date.now();

        try {
            // Type guard to check if it's an HoloWorkerRequest
            if (this.isHoloWorkerRequest(request)) {
                const ai = await this.providerImplService.getProviderImplById(request.provider.id);
                const mappedRequest = await ai.auditRequest(request);
                await this.insertRequest(mappedRequest);
            } else {
                await this.insertRequest(request);
            }
        } catch (error) {
            logger.error(`Failed to log request: ${error instanceof Error ? error.message : 'Unknown error'}: ${JSON.stringify(request, null, 2)}`, {
                requestId: this.isHoloWorkerRequest(request) ? request.requestId : request.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Log LLM response to database with comprehensive audit trail
     * Supports HoloWorkerResponse and direct ProviderResponse formats
     * @param {HoloWorkerResponse | Omit<ProviderResponse, 'id'>} content - Response data to log
     * @param requestContext - Optional context for userId and applicationId
     */

    async logResponse(content: Omit<ProviderResponse, 'id'>): Promise<void> {
        const logger = this.mlog(this.logResponse);
        const startTime = Date.now();

        try {
            await this.insertResponse(content);
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

    // HoloWorkerRequest mapping is now handled by the TranslatorRegistry
    // This provides better type safety and provider-specific field extraction

    async logNotification(content: NotificationEvent): Promise<void> {
        const logger = this.mlog(this.logNotification);
        logger.debug(`Logging notification: ${JSON.stringify(content)}`);
        const startTime = Date.now();
        try {
            await this.notificationDB.insert(content);
        } catch (error) {
            logger.error(`Failed to log notification: ${error instanceof Error ? error.message : 'Unknown error'}`, {
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
        const logger = this.mlog(this.sendToEvaluatorQ);
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
     * Type guard to determine if object is an HoloWorkerRequest
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is HoloWorkerRequest
     * @private
     */
    private isHoloWorkerRequest(obj: any): obj is HoloWorkerRequest {
        const logger = this.mlog(this.isHoloWorkerRequest);
        const isWorkerRequest = obj.payload !== undefined &&
            obj.sourceId !== undefined &&
            obj.organizationId !== undefined &&
            obj.requestId !== undefined;
        logger.debug(`Type guard check - isHoloWorkerRequest: ${isWorkerRequest}`);
        return isWorkerRequest;
    }

    /**
     * Insert request record into database
     * @param {Omit<ProviderRequest, 'id'>} content - Request data to insert
     * @private
     */
    private async insertRequest(content: Omit<ProviderRequest, 'id'>): Promise<void> {
        const logger = this.mlog(this.insertRequest);
        const startTime = Date.now();
        try {
            await this.requestDB.insert(content);
            logger.info(`Successfully logged ProviderRequest ${content.request_id} in ${Date.now() - startTime}ms`);
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
     * Type guard to determine if object is an HoloWorkerResponse
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is HoloWorkerResponse
     * @private
     */
    private isHoloWorkerResponse(obj: any): obj is HoloWorkerResponse {
        const logger = this.mlog(this.isHoloWorkerResponse);
        const isWorkerResponse = obj.requestId !== undefined &&
            obj.providerType !== undefined &&
            obj.payload !== undefined &&
            obj.sourceId !== undefined;
        logger.debug(`Type guard check - isHoloWorkerResponse: ${isWorkerResponse}`);
        return isWorkerResponse;
    }


    /**
     * Insert response record into database
     * @param {Omit<ProviderResponse, 'id'>} content - Response data to insert
     * @private
     */
    private async insertResponse(content: Omit<ProviderResponse, 'id'>): Promise<string | null> {
        const logger = this.mlog(this.insertResponse);
        const startTime = Date.now();
        try {
            const result = await this.responseDB.insert(content);
            logger.debug(`Database insert successful for response ${content.request_id} new id ${result?.id} in ${Date.now() - startTime}ms`);

            if (result?.id) {
                try {
                    await this.pricingService.calculateAndInsertCosts(result.id, {id: result.id, ...content});
                } catch (pricingError) {
                    logger.warn(`Cost calculation failed for response ${result.id}: ${pricingError instanceof Error ? pricingError.message : 'Unknown error'}`);
                }
            }

            return result ? result.id : null;
        } catch (error) {
            logger.error(`Database insert failed for response ${content.request_id}: ${error instanceof Error ? error.message : 'Unknown error'}\n\n ${JSON.stringify(content)}`, {
                requestId: content.request_id,
                status: content.status,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }
}
