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
