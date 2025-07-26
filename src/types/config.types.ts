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
    workerId?: string;
    auditId?: string;
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

    adminExchange: string;
    adminResponseExchange: string;
    adminCommandQueue: string;
    adminResponseQueue: string;

    auditRequestExchange: string;
    auditResponseExchange: string;
    auditRequestQueue: string;
    auditResponseQueue: string;

    queueExpiration: number;
}
