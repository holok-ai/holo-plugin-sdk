import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {QueueService} from "../../services";
import {env} from '../../env';
import logger from "../../utils/logger";

@injectable()
export class AdminService {

    constructor(private queueService: QueueService) {
    }

    async restartWorker(workerId: string, _payload: object) {
        try {
            logger.info(`Received restart command for worker ${workerId}`);

            // Send success response before shutting down
            const response: { workerId: string; status: string } = {
                workerId: workerId,
                status: 'restarting'
            };

            // Schedule shutdown after response is sent
            setTimeout(() => {
                logger.info(`Worker ${workerId} shutting down after restart command`);
                process.exit(0);
            }, 1000);

            return response;
        } catch (error: any) {
            logger.error(`Error handling restart command: ${error.message}`);
            throw error;
        }
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
