import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {QueueService} from "./index";
import {env} from '../env';
import logger from "../utils/logger";
import {ServerDB} from "../db";
import {ServerType} from "@holokai/types/entities";

@injectable()
export class AdminService {

    constructor(
        private queueService: QueueService,
        private readonly serverDB: ServerDB
    ) {
    }

    async registerServer(name: string, type: ServerType) {
        const server = await this.serverDB.upsert(name, type);

        if (!server) {
            throw new Error(`Unable to register server.`);
        }
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
