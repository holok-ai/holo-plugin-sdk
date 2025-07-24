import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {QueueService} from "./queue.service";
import {env} from '../env';

@injectable()
export class AdminService {

    constructor(private queueService: QueueService) {
    }

    async sendAdminResponse(workerId: string, routingKey: string, messageId: string, data: object) {
        await this.queueService.sendToExchange(
            env.queue.adminResponseExchange,
            routingKey,
            {
                messageId,
                workerId,
                timestamp: Date.now(),
                ...data
            }
        );
    }
}
