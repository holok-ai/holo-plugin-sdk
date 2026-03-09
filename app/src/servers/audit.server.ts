import 'reflect-metadata';
import '../container/base.registry';
import '../container/audit.registry';
import {container, injectable} from "tsyringe";
import {BaseServer} from "./base.server";
import {withAdmin, withDB, withQueue} from "./mixins";
import {env} from "../env";
import {AuditService, PluginService} from "../services";
import type {NotificationEvent} from "@holokai/types/notification";
import {ServerType} from "@holokai/types/entities";

@injectable()
export class AuditServer extends withAdmin(withQueue(withDB(BaseServer))) {

    constructor(
        private pluginService: PluginService,
        private auditService: AuditService
    ) {
        super(env.audit.serverId, ServerType.AUDIT);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.pluginService.initializePluginSystem(this.id)

        await this.queueService.consume(env.queue.auditNotificationQueue, async (_id, content: NotificationEvent) => {
            await this.auditService.logNotification(content);
        })

        await this.queueService.consume(env.queue.auditRequestQueue, async (_id, content) => {
            await this.auditService.logRequest(content);
        });

        await this.queueService.consume(env.queue.auditResponseQueue, async (_id, content) => {
            await this.auditService.logResponse(content);
        })
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
    }
}

const server = container.resolve(AuditServer);
await server.start();
