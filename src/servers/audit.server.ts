// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {AuditService} from "../services";
import {withDB, withQueue} from "./mixins";
import {container, injectable} from "tsyringe";
import {env} from "../env";


@injectable()
export class AuditServer extends withQueue(withDB(BaseServer)) {

    constructor(
        private auditService: AuditService) {
        super(env.audit.serverId);
    }

    async onInit(): Promise<void> {
        await super.onInit();
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

const auditServer = container.resolve(AuditServer);
auditServer.start();
