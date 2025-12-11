export interface BaseEntity {
    id: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    last_modified_by?: string;
}

export interface Provider extends BaseEntity {
    organization_id: string;
    name: string;
    type: string;
    description?: string;
    config: Record<string, any>;
    status?: { enabled?: boolean };
}

export interface Evaluator extends BaseEntity {
    name: string;
    description?: string | null;
    prompt_id?: string | null;  // uuid
    parameters: Record<string, any>;
    evaluator_type: string;
    enabled: boolean;
    available: boolean;
    deleted?: boolean;
    active?: boolean;  // Generated column - read-only
}

export interface EvaluatorData {
    id: string;
    created_at: Date;
    evaluator_id: string;
    llmresponse_id: string;
    results: Record<string, any>;
    scoring: Record<string, any>;
}

export interface Model extends BaseEntity {
    organization_id: string;
    name: string;
    description?: string;
    capabilities: Record<string, any>;
    parameters: Record<string, any>;
    metadata: Record<string, any>;
    status: { enabled: boolean; available: boolean };
}

export interface Application extends BaseEntity {
    name: string;
    provider_id: string;
    model_id: string;
    system_prompt: string;
    url_slug: string;
    active?: boolean;
    organization_id: string;
    team_id?: string;
}

//Object that corresponds to the database llm_requests table
export interface LlmRequest {
    organization_id?: string | undefined;
    id: string;
    request_id: string;
    request_type: string;
    model_slug: string;
    user_prompt?: string;
    options?: Record<string, any>;
    source_id?: string;
    user_id?: string;
    thread_id?: string;
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
    organization_id?: string | undefined;
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
    usage_raw?: Record<string, any>;
    input_tokens?: number;
    output_tokens?: number;
    time_to_first_token?: number | undefined;
    total_processing_time?: number;
    cost: number;
    score?: number;
    worker_id: string;
}

export interface Prompt extends BaseEntity {
    organization_id: string;
    name: string;
    description?: string;
    provider?: string;  // Added to match database field
    providerType: 'ollama' | 'claude' | 'openai' | 'gemini' | 'grok';
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
    safety_settings?: Record<string, any>;
    grok_settings?: Record<string, any>;
    tags: string[];
    version: string;
    is_active: boolean;
}

export interface AnalysisResult {
    id: string;  // uuid
    created_at: Date;
    analysis_name: string | null;
    reference: Record<string, any>;  // jsonb
    results: Record<string, any>;    // jsonb
}
