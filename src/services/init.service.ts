import "reflect-metadata";
import {QueueService} from "./queue.service";
import {injectable} from "tsyringe";
import {env} from "../env";

@injectable()
export class InitService {
    private serverId: string = env.worker.serverId;

    constructor(
        private queueService: QueueService) {

    }

    async setupQueues(serverId?: string) {
        this.serverId = serverId || this.serverId;
        await this._setupRequestQueues();
        await this._setupResponseQueues();
        await this._setupAdminQueues();
    }

    async _setupRequestQueues() {
        const {requestExchange, requestQueue, auditRequestQueue, auditRequestExchange} = env.queue;

        await this.queueService.assertExchange(requestExchange, 'fanout');
        await this.queueService.assertQueue(requestQueue, {durable: true}, requestExchange);

        await this.queueService.assertExchange(auditRequestExchange, 'direct');
        await this.queueService.assertQueue(auditRequestQueue, {durable: true}, auditRequestExchange);
    }

    async _setupResponseQueues() {
        const {
            responseExchange,
            responseQueue,
            auditResponseQueue,
            auditResponseExchange,
            queueExpiration = 3600000
        } = env.queue;
        await this.queueService.assertExchange(responseExchange, 'direct');

        const responseQueueName = `${responseQueue}.${this.serverId}`;
        await this.queueService.assertQueue(
            responseQueueName,
            {
                durable: true,
                arguments: {
                    'x-expires': queueExpiration
                }
            },
            responseExchange,
            this.serverId);

        await this.queueService.assertExchange(auditResponseExchange, 'direct');
        await this.queueService.assertQueue(auditResponseQueue, {durable: true}, auditResponseExchange);
    }

    async _setupAdminQueues() {
        const {adminExchange, adminResponseExchange} = env.queue;

        await this.queueService.assertExchange(adminExchange, 'topic');
        await this.queueService.assertExchange(adminResponseExchange, 'direct');
    }
}
