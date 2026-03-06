import {LlmStatus} from "./llm.status";

export interface ProviderResponseMetadata {
    error_message?: string;
    response_raw?: Record<string, any>;
    usage_raw?: Record<string, any>;
    worker_id?: string;
    token_type?: string;
    [key: string]: any;
}

export interface ProviderResponse {
    id: string;
    organization_id?: string;
    request_id: string;
    application_id: string;
    provider_id: string;
    protocol_id?: string;
    capability?: string;
    user_id?: string;
    client_identifier?: string;
    access_model: string;
    status: LlmStatus;
    response?: string;
    input_tokens?: number;
    output_tokens?: number;
    time_to_first_token?: number;
    total_processing_time?: number;
    cost: number;
    score?: number;
    created_at: string;
    metadata: ProviderResponseMetadata;
}

export interface ProviderAuditResponse extends ProviderResponse {
    application_name?: string;
    provider_name?: string;
    protocol_name?: string;
}
