import "reflect-metadata";
import {QueueService} from "./queue.service";
import {AppConfig} from "../types";
import {inject, injectable} from "tsyringe";
import {CONTAINER_TOKENS} from "../config";

@injectable()
export class InitService {
    constructor(@inject(CONTAINER_TOKENS.APP_CONFIG) private readonly config: AppConfig, private queueService: QueueService) {
        this.config = config;
        this.queueService = queueService;
    }

    async setupQueues() {
        await this._setupRequestQueues();
        await this._setupResponseExchangeAndQueues();
    }

    async _setupRequestQueues() {
        const {requestExchange, requestQueue, requestAuditQueue} = this.config;
        await this.queueService.assertExchange(requestExchange, 'fanout');
        await this.queueService.assertQueue(requestQueue, {durable: true}, requestExchange);
        await this.queueService.assertQueue(requestAuditQueue || requestQueue + '_audit', {durable: true}, requestExchange);
    }

    async _setupResponseExchangeAndQueues() {
        const {serverId, responseExchange, responseQueue, responseAuditQueue, queueExpiration = 3600000} = this.config;
        await this.queueService.assertExchange(responseExchange, 'direct');

        const responseQueueName = `${responseQueue}.${serverId}`;
        await this.queueService.assertQueue(
            responseQueueName,
            {
                durable: true,
                arguments: {
                    'x-expires': queueExpiration
                }
            },
            responseExchange,
            serverId);
        await this.queueService.assertQueue(responseAuditQueue || responseQueue + '_audit', {durable: true}, responseExchange);
    }
}
