import 'reflect-metadata';
import { BaseServer } from "./base.server";
import { EvaluatorService } from "../services";
import { withDB, withQueue } from "./mixins";
import { container, injectable } from "tsyringe";
import { env } from "../env";
import { AuditServiceEvent, EvaluatorServiceEvent } from '../types';

@injectable()
export class EvaluatorServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private evaluatorService: EvaluatorService) {
        super(env.evaluator.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.evaluatorService.init();

        await this.queueService.assertQueue(env.queue.evaluatorQueue, {
            durable: true
        });
        await this.queueService.bindQueue(env.queue.evaluatorQueue, env.queue.directExchange, env.queue.evaluatorRoutingKey);
        await this.queueService.consume(env.queue.evaluatorQueue, async (_id, content) => {
             await this.evaluatorService.handleRequest(content);
         });

       // @ts-ignore
        const auditEvent: AuditServiceEvent  = {
            source: "audit",
            eventName: "response-complete",
            timestamp: Date.now(),
            llmResponseDataId: 'b6e00cb7-ddfe-489e-93d5-decfb4d84344' // 'f210f939-b023-4b93-b884-f63fec021286' //  '08f3d3bf-69f0-4aa5-a45c-5c6bdc6c4720',
        };
        // await this.evaluatorService.handleRequest(auditEvent);
        // @ts-ignore
        const mokuEvent: MokuEvent = {
            source: "moku",
            eventName: "webhook",
            analysisEventId: 'f4da6cda-106e-4214-b288-59e21d2870e2',
            timestamp: Date.now()
        };
        // // await this.evaluatorService.handleRequest(mokuEvent);
        // @ts-ignore
        const contentEval: EvaluatorServiceEvent = {
             source: "evaluator",
             eventName: "github-pullrequest-closed",
             timestamp: Date.now(),
             context: [{
                 key: "pullrequest_info",
                 value: {
                     organization: "holok-ai",
                     repository: "holo",
                     pullRequestId: "2",
                     userEmail: "peter.baxter@dynamo.works",
                 },
             }]
         };


    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const analysisServer = container.resolve(EvaluatorServer);
analysisServer.start();
