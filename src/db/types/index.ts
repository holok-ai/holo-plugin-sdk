export interface BaseEntity {
    id: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    last_modified_by?: string;
}

export interface Provider extends BaseEntity {
    name: string;
    description?: string;
    config: Record<string, any>;
    status?: { enabled?: boolean };
}

export interface Model extends BaseEntity {
    name: string;
    description?: string;
    capabilities: Record<string, any>;
    parameters: Record<string, any>;
    metadata: Record<string, any>;
    status: { enabled: boolean; available: boolean };
}

export interface ProviderModel {
    provider_id: string;
    model_id: string;
    config: Record<string, any>;
    status: { enabled: boolean };
    active: boolean;
    last_active_at?: Date;
    created_at: Date;
    updated_at: Date;
}
//Object that corresponds to the database llm_requests table
export interface LlmRequest {
    id: string;
    request_id: string;
    request_type: string;
    model: string;
    prompt?: string | undefined;
    options?: Record<string, any> | undefined;
    source_id?: string | undefined;
    user_id?: string | undefined;
    timestamp: string;
    metadata?: Record<string, any> | undefined;
}

export interface LlmResponse {
    id: string;
    request_id: string;
    response_type: string;
    token?: string | undefined;
    model?: string | undefined;
    worker_id?: string | undefined;
    timestamp: any;
    is_final?: boolean | undefined;
    total_tokens?: number | undefined;
    processing_time?: number | undefined;
    tokens_per_second?: number | undefined;
    metadata?: Record<string, any> | undefined;
}

export interface Prompt extends BaseEntity {
    name: string;
    description?: string;
    provider: 'ollama' | 'claude' | 'openai' | 'gemini' | 'grok';
    prompt_type: 'chat' | 'completion' | 'image' | 'audio' | 'vision';
    system_prompt?: string;
    user_prompt: string;
    parameters: Record<string, any>;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    stop_sequences: string[];
    model?: string;
    anthropic_version?: string;
    safety_settings?: Record<string, any>;
    grok_settings?: Record<string, any>;
    tags: string[];
    version: string;
    is_active: boolean;
}
