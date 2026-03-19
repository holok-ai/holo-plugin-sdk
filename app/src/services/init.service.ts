import "reflect-metadata";
import {QueueService} from "./queue.service";
import {injectable} from "tsyringe";
import {env} from "../env";
import logger from "../utils/logger";
import {PluginService} from "./plugin";
import {ResponseService} from "./response.service";
import {RedisService} from "./redis.service";

@injectable()
export class InitService {
    private serverId: string = env.api.apiServerId;

    constructor(
        private pluginService: PluginService,
        private responseService: ResponseService,
        private queueService: QueueService,
        private redisService: RedisService,
    ) {

    }

    async init(serverId: string): Promise<void> {
        this.serverId = serverId;
        await this.redisService.connect();
        await this.pluginService.initializePluginSystem(serverId);
        await this.setupQueues(serverId);
        await this.responseService.startLLMResponseConsumer();
    }

    async setupQueues(serverId?: string) {
        logger.debug(`setupQueues called with ${serverId}`);
        this.serverId = serverId || this.serverId;
        await this._setupGlobalExchanges();
        await this._setupRequestQueues();
        await this._setupResponseQueues();
        await this._setupNotificationQueues();
    }

    async _setupGlobalExchanges() {
        await this.queueService.assertExchange(env.queue.requestExchange, 'fanout');
        await this.queueService.assertExchange(env.queue.responseExchange, 'direct');
        await this.queueService.assertExchange(env.queue.notificationExchange, "topic");
        await this.queueService.assertExchange(env.queue.adminExchange, 'topic');
        await this.queueService.assertExchange(env.queue.adminResponseExchange, 'direct');
        await this.queueService.assertExchange(env.queue.directExchange, 'direct');
    }

    async _setupRequestQueues() {
        await this.queueService.assertQueue(env.queue.requestQueue, {durable: true}, env.queue.requestExchange);
    }

    async _setupResponseQueues() {
        const responseQueueName = `${env.queue.responseQueue}.${this.serverId}`;
        await this.queueService.assertQueue(
            responseQueueName,
            {
                durable: true,
                arguments: {
                    'x-expires': env.queue.queueExpiration
                }
            },
            env.queue.responseExchange,
            this.serverId);

        await this.queueService.assertQueue(
            env.queue.auditResponseQueue,
            {
                durable: true
            },
            env.queue.responseExchange,
            env.queue.auditRoutingKey);
    }

    async _setupNotificationQueues() {
        await this.queueService.assertQueue(env.queue.auditNotificationQueue, {durable: true}, env.queue.notificationExchange, '#');
    }

}
