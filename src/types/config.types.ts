export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
}

export interface RabbitConfig {
    url: string;
    reconnectAttempts: number;
    reconnectDelayMs: number;
}

export interface AppConfig {
    serverId: string;
    port: number;
    host?: string;
    cors?: {
        enabled: boolean;
        origins: string[];
        methods: string[];
        headers: string[];
    };
    dbConfig: DatabaseConfig;
    queueConfig: RabbitConfig;
    requestExchange: string;
    requestQueue: string;
    responseExchange: string;
    responseQueue: string;
    requestAuditQueue?: string;
    responseAuditQueue?: string;
    queueExpiration: number;
}
