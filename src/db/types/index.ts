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
    model_slug: string;
    user_prompt?: string;
    options?: Record<string, any>;
    source_id?: string;
    user_id?: string;
    timestamp: string;
    raw_request?: Record<string, any>;
    application_id: string;
    provider_slug: string;
    system_prompt?: string;
}

// Enum for LLM response status matching database llm_status type
export enum LlmStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    TIMEOUT = 'timeout',
    PARTIAL = 'partial',
    RATE_LIMITED = 'rate_limited',
    INVALID_REQUEST = 'invalid_request'
}

// Object that corresponds to the database llm_responses table
export interface LlmResponse {
    id: string;
    created_at: string;
    user_id?: string;
    application_id: string;
    request_id: string;
    provider_slug: string;
    model_slug: string;
    status: LlmStatus;
    error_message?: string;
    response?: string;
    response_raw?: Record<string, any>;
    input_tokens?: number;
    output_tokens?: number;
    time_to_first_token?: number | undefined;
    total_processing_time?: number;
    cost: number;
    score?: number;
    worker_id: string;
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
