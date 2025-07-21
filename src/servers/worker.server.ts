import {withDB, withQueue} from "./mixins";
import {BaseServer} from "./base.server";
import logger from "../utils/logger";
import {ProviderService} from "../services";
import {DatabaseConfig, RabbitConfig} from "../types";
import {parseBoolean, parseNumber} from "../utils";

export interface WorkerServerConfig {
    dbConfig: DatabaseConfig;
    queueConfig: RabbitConfig;
    queueName: string;
}

export const workerConfig: WorkerServerConfig = {
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
    queueName: 'llm_requests'
}

export class WorkerServer extends withQueue(withDB(BaseServer)) {
    private providerService: ProviderService;
    private readonly config: WorkerServerConfig;

    constructor(config: any) {
        super(config);
        this.config = config;
        this.providerService = new ProviderService(this.db, this.queueService);
    }

    async onError(): Promise<void> {
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.providerService.init();

        // const ai = await this.providerService.matchProvider('openai');
        // ai?.generate('server-1', '1', 'gpt-4', 'Hello world!', {}, false);

        await this.queueService.consume(this.config.queueName, async (id, content) => {
            const {sourceId, payload, type} = content;
            logger.info(`Worker ${this.id} handling generate request: ${id} from server ${sourceId} and queue ${this.config.queueName}...`);

            try {
                // Extract parameters
                const {model, prompt, options, stream, provider} = payload;
                const ai = await this.providerService.matchProvider(provider);

                switch (type) {
                    case 'generate':
                        await ai!.generate(sourceId, id, model, prompt, options, stream);
                        break;
                    case 'chat':
                        break;
                    default:
                        logger.warn(`No handler registered for message type ${type} - ignoring message...`);
                        break;

                }
            } catch (error) {

            }
        });
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }
}

const worker = new WorkerServer(workerConfig);
worker.start();
