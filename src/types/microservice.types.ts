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

export interface ProxyRequest {
    id: string; // UUIDv4
    type: 'generate' | 'chat';
    sourceId: string; // Server ID for response routing
    payload: {
        model: string;
        provider?: string;
        options?: Record<string, any>;
        stream?: boolean;
        // For 'generate' type requests
        prompt?: string;
        // For 'chat' type requests
        messages?: Array<{ role: string; content: string }>;
    };
    timestamp: number;
}

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
