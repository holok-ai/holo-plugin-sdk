import 'reflect-metadata';
import {injectable} from "tsyringe";
import {QueueService} from "./queue.service";
import logger from "../utils/logger";

@injectable()
export class WorkerService {

    constructor(private queueService: QueueService) {

    }

    async sendResponseChunk(workerId: string, routingKey: string, correlationId: string, data: object, auditEnabled: boolean) {
        logger.debug(`Sending response chunk: ${routingKey}, ${correlationId}, ${JSON.stringify(data)}`);

        await this.queueService.sendToExchange(
            'llm_responses',
            routingKey,
            data,
            {correlationId}
        );

        if (auditEnabled) {
            await this.queueService.sendToExchange(
                'llm_responses',
                'audit',
                {
                    timestamp: Date.now(),
                    workerId,
                    ...data
                },
                {correlationId}
            )
        }
    }
}
