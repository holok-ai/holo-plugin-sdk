import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {
    AuditService,
    CryptoService,
    NotificationService,
    PluginDiscoveryService,
    PluginLoaderService,
    PluginService,
    ProviderImplService,
    ProviderPluginService,
    ProviderService
} from "../services";
import {withAdmin, withDB, withQueue} from "./mixins";
import {container, injectable} from "tsyringe";
import logger from "../utils/logger";
import {env} from "../env";
import {NotificationServiceToken, NotificationStoreToken} from "@holokai/sdk/notification";
import type {NotificationEvent} from "@holokai/types/notification";
import {PostgresNotificationStore} from "../db/notification.db";
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

container.registerSingleton(CryptoService)
    .registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginService)
    .registerSingleton(ProviderImplService)
    .registerSingleton(ProviderService)
    .registerSingleton(NotificationServiceToken, NotificationService)
    .registerSingleton(NotificationStoreToken, PostgresNotificationStore);

let auditServer: AuditServer | null = null;

async function startAuditServer() {
    try {
        auditServer = container.resolve(AuditServer);
        await auditServer.start();
    } catch (error) {
        logger.error(`Failed to start audit server: ${(error as Error).message}`, {
            className: 'startWorker',
            methodName: 'startWorker',
            stack: (error as Error).stack
        });
        process.exit(1);
    }
}

['SIGBREAK', 'SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.info(`Received ${signal}, shutting down worker server...`);
        if (auditServer) {
            auditServer.shutdown();
        }
        process.exit(0);
    });
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception in worker server: ${err.message}`);
    logger.error(err.stack);
});

await startAuditServer();

