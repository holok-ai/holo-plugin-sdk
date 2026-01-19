import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {AuditService, ProviderService} from "../services";
import {withDB, withQueue} from "./mixins";
import {container, injectable} from "tsyringe";
import logger from "../utils/logger";
import {env} from "../env";
import {PluginService} from "../services/plugin/plugin.service";
import {PluginDiscoveryService} from "../services/plugin/discovery.service";
import {PluginLoaderService} from "../services/plugin/loader.service";
import {ProviderPluginRegistry} from "../services/plugin/provider-registry.service";

@injectable()
export class AuditServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private providerService: ProviderService,
        private auditService: AuditService) {
        super(env.audit.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init(this.id);
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

container.registerSingleton(PluginService)
    .registerSingleton(PluginDiscoveryService)
    .registerSingleton(PluginLoaderService)
    .registerSingleton(ProviderPluginRegistry)
    .registerSingleton(ProviderService);

let auditServer: AuditServer | null = null;

async function startAuditServer() {
    try {
        const pluginService = container.resolve(PluginService);
        await pluginService.initializePluginSystem();
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

startAuditServer();

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
