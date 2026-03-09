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
    private serverId: string = env.worker.serverId;

    constructor(
        private pluginService: PluginService,
        private responseService: ResponseService,
        private queueService: QueueService,
        private redisService: RedisService
    ) {

    }

    async init(serverId: string): Promise<void> {
        await this.pluginService.initializePluginSystem(this.serverId);
        await this.redisService.connect();
        await this.setupQueues(serverId);
        await this.responseService.startLLMResponseConsumer();
    }

    // TODO: Move exchange and queue configuration to a dedicated config service or external config file
    // This would allow for better separation of concerns and easier configuration management
    //to create and validate on every startup
    async setupQueues(serverId?: string) {
        logger.debug(`setupQueues called with ${serverId}`);
        this.serverId = serverId || this.serverId;
        await this._setupGlobalExchanges();
        await this._setupRequestQueues();
        await this._setupResponseQueues();
        await this._setupNotificationQueues();
    }

    async _setupGlobalExchanges() {
        //One request exchange as a fanout. All bound queues will get a copy of the message
        //Implementing more complex traffic segmentation such as segmentation based on model or
        //provider will need to change this to a topic exchange which has some performance overhead
        await this.queueService.assertExchange(env.queue.requestExchange, 'fanout');

        //One response exchange with direct binding. Each api server should have its own queue
        //with a unique binding key such that responses are directed back to the api server that 
        //originated the request. For audit messages a second audit response message with a unique 
        //routing key will be used
        await this.queueService.assertExchange(env.queue.responseExchange, 'direct');
        await this.queueService.assertExchange(env.queue.notificationExchange, "topic");

        await this.queueService.assertExchange(env.queue.adminExchange, 'topic');
        await this.queueService.assertExchange(env.queue.adminResponseExchange, 'direct');

        // Direct exchange for evaluator tasks
        await this.queueService.assertExchange(env.queue.directExchange, 'direct');
    }

    async _setupRequestQueues() {

        //Bind the env.queue.requestQueue(llm_requests) directly to the fanout exchange env.queue.requestExchange
        await this.queueService.assertQueue(env.queue.requestQueue, {durable: true}, env.queue.requestExchange);
        await this.queueService.assertQueue(env.queue.auditRequestQueue, {durable: true}, env.queue.requestExchange);
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
