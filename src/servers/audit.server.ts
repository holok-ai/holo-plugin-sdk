import {BaseServer} from "./base.server";
import {AuditService} from "../services";
import {DatabaseConfig, RabbitConfig} from "../types";
import {parseBoolean, parseNumber} from "../utils";
import {withDB, withQueue} from "./mixins";

export interface AuditServerConfig {
    dbConfig: DatabaseConfig;
    queueConfig: RabbitConfig;
    requestQueue: string;
    responseQueue: string;
}

export const auditConfig: AuditServerConfig = {
    dbConfig: {
        host: process.env.AUDIT_PG_HOST || 'localhost',
        port: parseNumber(process.env.AUDIT_PG_PORT, 5432),
        database: process.env.AUDIT_PG_DATABASE || 'llm_audit',
        user: process.env.AUDIT_PG_USER || 'postgres',
        password: process.env.AUDIT_PG_PASSWORD || 'postgrespassword',
        ssl: parseBoolean(process.env.AUDIT_PG_SSL, false),
        max: parseNumber(process.env.AUDIT_PG_MAX_CONNECTIONS, 20),
        idleTimeoutMillis: parseNumber(process.env.AUDIT_PG_IDLE_TIMEOUT, 30000)
    },
    queueConfig: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        reconnectAttempts: parseNumber(process.env.RABBITMQ_RECONNECT_ATTEMPTS, 5),
        reconnectDelayMs: parseNumber(process.env.RABBITMQ_RECONNECT_DELAY_MS, 5000)
    },
    requestQueue: process.env.RABBITMQ_QUEUE_LLM_AUDIT || 'llm_requests_audit',
    responseQueue: process.env.RABBITMQ_QUEUE_LLM_RESPONSES_AUDIT || 'llm_responses_audit',
}

export class AuditServer extends withQueue(withDB(BaseServer)) {

    private config: AuditServerConfig;
    private auditService: AuditService;

    constructor(config: AuditServerConfig) {
        super(config);
        this.config = config;
        this.auditService = new AuditService(this.db);
    }

    async onError(): Promise<void> {
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.queueService.consume(this.config.requestQueue, async (_id, content) => {
            await this.auditService!.logRequest(content);
        });

        await this.queueService.consume(this.config.responseQueue, async (_id, content) => {
            await this.auditService!.logResponse(content);
        })
    }

    async onShutdown(): Promise<void> {
    }
}

const auditServer = new AuditServer(auditConfig);
auditServer.start();
