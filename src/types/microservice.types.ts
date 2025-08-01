// RequestType import removed as ProxyRequest was replaced with LLMWorkerRequest

export interface AdminHandler {
    (payload: any): Promise<any>;
}

export interface ShutdownHandler {
    (): Promise<void>;
}

export interface ServiceStats {
    startTime: number;
    messagesProcessed: number;
    errors: number;
    uptime?: number;
    serviceId?: string;
    serviceName?: string;

    [key: string]: any;
}

export interface AdminCommand {
    messageId: string;
    action: string;
    serverId: string;
    timestamp: number;

    [key: string]: any;
}

export interface AdminResponse {
    messageId: string;
    serviceId: string;
    serviceName: string;
    timestamp: number;
    success: boolean;
    error?: string;

    [key: string]: any;
}

// ProxyRequest has been replaced with LLMWorkerRequest from provider-request.types.ts
// This provides better type safety and more comprehensive payload structure

export interface ProxyResponse {
    requestId: string;
    type: 'token' | 'done' | 'error';
    token?: any;
    model?: string;
    workerId?: string;
    timestamp: number;
    done?: boolean;
    response?: any;
    fullResponse?: any;
    metrics?: {
        totalTokens?: number;
        processingTime?: number;
        tokensPerSecond?: number;
    };
    // Ollama specific fields
    total_duration?: number;
    eval_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

export interface AuditLogEntry {
    id: string;
    type: string;
    sourceId: string;
    payload: Record<string, any>;
    timestamp: number;
}
