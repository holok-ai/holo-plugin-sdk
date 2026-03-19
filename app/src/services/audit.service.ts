import 'reflect-metadata';
import {AuditServiceEvent} from '../types';
import {inject, injectable} from "tsyringe";
import {EvaluatorDB, RequestDB, ResponseDB} from "../db";
import {QueueService} from "./queue.service";
import {env} from '../env';
import {ClassLogger} from "@holokai/sdk";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import {ProviderRequest, ProviderResponse} from "@holokai/types/entities";
import {NotificationStoreToken} from "@holokai/sdk/notification";
import type {NotificationEvent} from "@holokai/types/notification";
import {PostgresNotificationStore} from "../db/notification.db";
import {ProviderImplService} from "./plugin";
import {PricingService} from "./pricing.service";

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

    async logAuditRecord(record: HoloWorkerRequest): Promise<void> {
        const logger = this.mlog(this.logAuditRecord);
        const startTime = Date.now();

        try {
            const ai = await this.providerImplService.getProviderImplById(record.provider.id);

            const providerRequest = await ai.auditRequest(record);
            await this.insertRequest(providerRequest);

            if (record.providerEvent) {
                const envelope = await ai.auditor.createWorkerResponseEnvelope(record, record.workerId);
                const providerResponse = await ai.auditResponse(envelope, record.providerEvent);
                await this.insertResponse(providerResponse);
            }
        } catch (error) {
            logger.error(`Failed to log audit record: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: record.requestId,
                error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

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

    async sendToEvaluatorQ(responseId: string, applicationId: string): Promise<void> {
        const logger = this.mlog(this.sendToEvaluatorQ);
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
