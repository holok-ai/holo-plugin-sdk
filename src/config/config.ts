const dotenv = require('dotenv');
import {v4 as uuidv4} from 'uuid';
import {parseArray, parseBoolean, parseNumber} from "../utils";

// Load environment variables
dotenv.config();


export interface LLMConfig {
    provider: string;
    model: string;
    timeout: number;
    retryAttempts: number;
    ollama: {
        baseUrl: string;
        model: string;
        timeout: number;
    };
    openai: {
        apiKey: string;
        model: string;
        timeout: number;
    };
    anthropic: {
        apiKey: string;
        model: string;
        timeout: number;
    };
}

export interface ServerConfig {
    id: string;
    name: string;
    version: string;
    environment: string;
}

export interface AppConfig {
    port: number;
    host: string;
    cors: {
        enabled: boolean;
        origins: string[];
        methods: string[];
        headers: string[];
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        max: number;
    };
    bodyParser: {
        limit: string;
    };
}

export interface WorkerConfig {
    id: string;
    concurrency: number;
    heartbeatInterval: number;
    maxRetries: number;
    retryDelay: number;
    gracefulShutdownTimeout: number;
}


// Configuration object
export const config = {
    app: {
        port: parseNumber(process.env.PORT, 3000),
        host: process.env.HOST || 'localhost',
        cors: {
            enabled: parseBoolean(process.env.CORS_ENABLED, true),
            origins: parseArray(process.env.CORS_ORIGINS, ['*']),
            methods: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
            headers: parseArray(process.env.CORS_HEADERS, ['*']),
        },
        rateLimit: {
            enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, false),
            windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
            max: parseNumber(process.env.RATE_LIMIT_MAX, 100),
        },
        bodyParser: {
            limit: process.env.BODY_PARSER_LIMIT || '10mb',
        },
    },

    server: {
        id: process.env.SERVER_ID || uuidv4(),
        name: process.env.SERVER_NAME || 'llm-proxy',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    },

    rabbitMq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        reconnectAttempts: parseNumber(process.env.RABBITMQ_RECONNECT_ATTEMPTS, 5),
        reconnectDelayMs: parseNumber(process.env.RABBITMQ_RECONNECT_DELAY_MS, 5000),
        queues: {
            llmRequests: process.env.RABBITMQ_QUEUE_LLM_REQUESTS || 'llm_requests',
            llmResponses: process.env.RABBITMQ_QUEUE_LLM_RESPONSES || 'llm_responses',
            llmAudit: process.env.RABBITMQ_QUEUE_LLM_AUDIT || 'llm_audit',
            llmResponsesAudit: process.env.RABBITMQ_QUEUE_LLM_RESPONSES_AUDIT || 'llm_responses_audit',
        },
        exchanges: {
            llmResponses: process.env.RABBITMQ_EXCHANGE_LLM_RESPONSES || 'llm_responses',
            admin: process.env.RABBITMQ_EXCHANGE_ADMIN || 'admin_commands',
            adminResponses: process.env.RABBITMQ_EXCHANGE_ADMIN_RESPONSES || 'admin_responses',
        },
    },

    llm: {
        provider: process.env.LLM_PROVIDER || 'ollama',
        model: process.env.LLM_MODEL || 'llama3.2',
        timeout: parseNumber(process.env.LLM_TIMEOUT, 30000),
        retryAttempts: parseNumber(process.env.LLM_RETRY_ATTEMPTS, 3),
        ollama: {
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'llama3.2',
            timeout: parseNumber(process.env.OLLAMA_TIMEOUT, 30000),
        },
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            timeout: parseNumber(process.env.OPENAI_TIMEOUT, 30000),
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            timeout: parseNumber(process.env.ANTHROPIC_TIMEOUT, 30000),
        },
    },

    audit: {
        enabled: parseBoolean(process.env.AUDIT_ENABLED, true),
        logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
        batchSize: parseNumber(process.env.AUDIT_BATCH_SIZE, 100),
        flushInterval: parseNumber(process.env.AUDIT_FLUSH_INTERVAL, 5000),
        postgres: {
            host: process.env.AUDIT_PG_HOST || 'localhost',
            port: parseNumber(process.env.AUDIT_PG_PORT, 5432),
            database: process.env.AUDIT_PG_DATABASE || 'llm_audit',
            user: process.env.AUDIT_PG_USER || 'postgres',
            password: process.env.AUDIT_PG_PASSWORD || 'password',
            ssl: parseBoolean(process.env.AUDIT_PG_SSL, false),
            max: parseNumber(process.env.AUDIT_PG_MAX_CONNECTIONS, 20),
            idleTimeoutMillis: parseNumber(process.env.AUDIT_PG_IDLE_TIMEOUT, 30000),
        },
    },

    worker: {
        id: process.env.LLM_WORKER_ID || `worker-${uuidv4()}`,
        concurrency: parseNumber(process.env.WORKER_CONCURRENCY, 1),
        heartbeatInterval: parseNumber(process.env.WORKER_HEARTBEAT_INTERVAL, 30000),
        maxRetries: parseNumber(process.env.WORKER_MAX_RETRIES, 3),
        retryDelay: parseNumber(process.env.WORKER_RETRY_DELAY, 1000),
        gracefulShutdownTimeout: parseNumber(process.env.WORKER_GRACEFUL_SHUTDOWN_TIMEOUT, 30000),
    },
};

// Validation function to ensure required configuration is present
export const validateConfig = (): void => {
    const errors: string[] = [];

    // Validate required environment variables
    if (!config.rabbitMq.url) {
        errors.push('RABBITMQ_URL is required');
    }

    if (config.audit.enabled && !config.audit.postgres.host) {
        errors.push('AUDIT_PG_HOST is required when audit is enabled');
    }

    if (config.llm.provider === 'openai' && !config.llm.openai.apiKey) {
        errors.push('OPENAI_API_KEY is required when using OpenAI provider');
    }

    if (config.llm.provider === 'anthropic' && !config.llm.anthropic.apiKey) {
        errors.push('ANTHROPIC_API_KEY is required when using Anthropic provider');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
};

// Export individual config sections for convenience
export const appConfig = config.app;
export const serverConfig = config.server;
export const rabbitMqConfig = config.rabbitMq;
export const llmConfig = config.llm;
export const auditConfig = config.audit;
export const workerConfig = config.worker;

// Default export
export default config;
