import { ProviderType } from './provider.types';

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

export interface ModelConfig {
    name: string;
    accessModel: string;
}

export interface SystemPromptConfig {
    content: string;
    mode: 'OVERRIDE' | 'PREPEND' | 'APPEND';
}

export interface GuardConfig {
    id: string;
    content: string;
}

export interface EvaluatorConfig {
    id: string;
    content: string;
}

export interface ApplicationConfig {
    urlSlug: string;
    organizationId: string;
    providerType: ProviderType;
    models: ModelConfig[];
    systemPrompt?: SystemPromptConfig;
    guards?: GuardConfig[];
    evaluators?: EvaluatorConfig[];
}

export interface ProxyConfig {
    entity_type: 'APPLICATION' | 'JWT_TOKEN';
    action: 'NEW' | 'UPDATE' | 'DELETE';
    data: ApplicationConfig[];
}
