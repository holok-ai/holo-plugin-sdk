/**
 * Environment Configuration Module
 *
 * IMPORTANT: This module executes immediately when imported and reads from process.env.
 * Ensure dotenv.config() is called BEFORE importing this module in your main server files.
 *
 * The application entry points (app.ts, worker.server.ts, audit.server.ts) have been
 * configured to load dotenv before any other imports.
 */
import {resolve} from 'path';
import dotenv from 'dotenv';
import {parseArray, parseBoolean, parseNumber} from "./utils";

dotenv.config({ path: [resolve(import.meta.dirname, '../../.env'), '.env'] });

export namespace env {
    export const NODE_ENV = process.env.NODE_ENV || 'development';
    export const id = Math.random().toString(36).substring(2, 10);
    export const logDir = process.env.LOG_DIR || 'logs';

    // API config
    export namespace api {
        /**
         * API server identifier used for queue naming and server identification
         * Uses API_SERVER_ID environment variable (formerly SERVER_ID)
         */
        export const apiServerId = process.env.API_SERVER_ID || `server_${id}`;
        export const port = parseNumber(process.env.PORT, 3000);
        export const configMode = process.env.API_CONFIG_MODE || 'local';
        export const configFile = process.env.API_CONFIG_FILE || './sample.app.config.json';
        export const configTimeoutMs = parseNumber(process.env.API_CONFIG_TIMEOUT, 60000);
        export const pluginsDir = process.env.API_PLUGINS_DIR || '../node_modules';

        // Notifications (SSE)
        export namespace notifications {
            // Endpoint behavior
            export const sseHeartbeatMs = parseNumber(process.env.NOTIF_SSE_HEARTBEAT_MS, 25000);
            export const replayDefaultLimit = parseNumber(process.env.NOTIF_REPLAY_DEFAULT_LIMIT, 250);
            export const replayMaxLimit = parseNumber(process.env.NOTIF_REPLAY_MAX_LIMIT, 1000);

            // Live fanout transport
            // NOTE: We default to your existing direct exchange to minimize disruption.
            export const exchange = process.env.NOTIF_EXCHANGE || "direct-exchange";
            export const routingKeyPrefix = process.env.NOTIF_ROUTING_KEY_PREFIX || "notif";
            export const queueNamePrefix = process.env.NOTIF_QUEUE_PREFIX || "notif_stream";

            // Optional: include additional events by default (comma-separated)
            // e.g. "status,guard_started,guard_failed"
            export const defaultTypes = parseArray(process.env.NOTIF_DEFAULT_TYPES, []);
        }
    }

    // Database config
    export namespace appDb {
        export const host = process.env.APP_PG_HOST || process.env.AUDIT_PG_HOST || 'localhost';
        export const port = parseNumber(process.env.APP_PG_PORT || process.env.AUDIT_PG_PORT, 5432);
        export const database = process.env.APP_PG_DATABASE || process.env.AUDIT_PG_DATABASE || 'holokai';
        export const user = process.env.APP_PG_USER || process.env.AUDIT_PG_USER || 'holo';
        export const password = process.env.APP_PG_PASSWORD || process.env.AUDIT_PG_PASSWORD || 'holopassword';
        export const ssl = parseBoolean(process.env.APP_PG_SSL || process.env.AUDIT_PG_SSL, false);
        export const maxConnections = parseNumber(process.env.APP_PG_MAX_CONNECTIONS || process.env.AUDIT_PG_MAX_CONNECTIONS, 20);
        export const idleTimeout = parseNumber(process.env.APP_PG_IDLE_TIMEOUT || process.env.AUDIT_PG_IDLE_TIMEOUT, 30000);

        export const config = {
            host,
            port,
            database,
            user,
            password,
            ssl,
            max: maxConnections,
            idleTimeoutMillis: idleTimeout
        };
    }

    // Database config
    export namespace auditDb {
        export const host = process.env.AUDIT_PG_HOST || process.env.APP_PG_HOST || 'postgres';
        export const port = parseNumber(process.env.AUDIT_PG_PORT || process.env.APP_PG_PORT, 5432);
        export const database = process.env.AUDIT_PG_DATABASE || process.env.APP_PG_DATABASE || 'holokai';
        export const user = process.env.AUDIT_PG_USER || process.env.APP_PG_USER || 'holo';
        export const password = process.env.AUDIT_PG_PASSWORD || process.env.APP_PG_PASSWORD || 'holopassword';
        export const ssl = parseBoolean(process.env.AUDIT_PG_SSL || process.env.APP_PG_SSL, false);
        export const maxConnections = parseNumber(process.env.AUDIT_PG_MAX_CONNECTIONS || process.env.APP_PG_MAX_CONNECTIONS, 20);
        export const idleTimeout = parseNumber(process.env.AUDIT_PG_IDLE_TIMEOUT || process.env.APP_PG_IDLE_TIMEOUT, 30000);

        export const config = {
            host,
            port,
            database,
            user,
            password,
            ssl,
            max: maxConnections,
            idleTimeoutMillis: idleTimeout
        };
    }

    export namespace redis {
        export const url = process.env.REDIS_URL || 'redis://localhost:6379';
    }

    // Queue config
    export namespace queue {
        export const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        export const reconnectAttempts = parseNumber(process.env.RABBITMQ_RECONNECT_ATTEMPTS, 5);
        export const reconnectDelayMs = parseNumber(process.env.RABBITMQ_RECONNECT_DELAY_MS, 5000);

        export const requestQueue = process.env.RABBITMQ_REQUEST_QUEUE || 'llm_requests';
        export const requestExchange = process.env.RABBITMQ_REQUEST_EXCHANGE || 'llm_requests_exchange';
        export const responseQueue = process.env.RABBITMQ_RESPONSE_QUEUE || 'llm_responses';
        export const responseExchange = process.env.RABBITMQ_RESPONSE_EXCHANGE || 'llm_responses_exchange';


        export const adminExchange = process.env.RABBITMQ_ADMIN_EXCHANGE || 'llm_admin';
        export const directExchange = process.env.RABBITMQ_DIRECT_EXCHANGE || 'direct-exchange';
        export const adminCommandQueue = process.env.RABBITMQ_ADMIN_COMMAND_QUEUE || 'llm_admin_commands';
        export const adminResponseExchange = process.env.RABBITMQ_ADMIN_RESPONSE_EXCHANGE || 'llm_admin_responses';
        export const adminResponseQueue = process.env.RABBITMQ_ADMIN_RESPONSE_QUEUE || 'llm_admin_responses';

        export const platformExchange = process.env.RABBITMQ_PLATFORM_EXCHANGE || 'platform';

        export const auditRequestQueue = process.env.RABBITMQ_AUDIT_REQUEST_QUEUE || 'llm_requests_audit';
        export const auditResponseQueue = process.env.RABBITMQ_AUDIT_RESPONSE_QUEUE || 'llm_responses_audit';
        export const auditRoutingKey = process.env.AUDIT_ROUTING_KEY || "audit";

        export const evaluatorQueue = process.env.RABBITMQ_ANALYSIS_REQUEST_QUEUE || 'evaluator-tasks';
        export const evaluatorRoutingKey = process.env.ANALYSIS_ROUTING_KEY || "evaluator-tasks";

        export const batchQueue = process.env.RABBITMQ_BATCH_QUEUE || 'batch-jobs';
        export const batchRoutingKey = process.env.BATCH_ROUTING_KEY || 'batch-jobs';

        export const queueExpiration = process.env.QUEUE_EXPIRATION || 3600000;

        export const managementQueue = process.env.PROXY_MANAGEMENT_QUEUE || 'proxy_management';

        export const notificationExchange = process.env.RABBITMQ_NOTIFICATION_EXCHANGE || "notifications_exchange";
        export const notificationQueue = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notifications';
        export const auditNotificationQueue = process.env.RABBITMQ_AUDIT_NOTIFICATION_QUEUE || "notifications_audit";

        export const config = {
            url,
            reconnectAttempts,
            reconnectDelayMs
        };
    }

    export namespace worker {
        export const serverId = process.env.WORKER_ID ||
            `worker_${id}`;
        export const adminCommandQueue = `${queue.adminCommandQueue}_${worker.serverId}`;
    }

    export namespace audit {
        export const serverId = process.env.AUDIT_ID ||
            `audit_${id}`;
    }

    export namespace evaluator {
        export const serverId = process.env.ANALYSIS_ID ||
            `evaluator_${id}`;
    }

    export namespace batch {
        export const serverId = process.env.BATCH_ID ||
            `batch_${id}`;
    }

    export interface JWTConfig {
        secret: string;
        expiresIn: string;
        algorithm: 'HS384';
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    export const jwtConfig: JWTConfig = {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        algorithm: 'HS384'
    };

    export const mokuUrl = process.env.MOKU_URL || 'http://localhost:8080';

    export namespace security {
        export const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
        if (!encryptionKey) {
            throw new Error('ENCRYPTION_KEY environment variable is required for decrypting API credentials');
        }
    }
}
