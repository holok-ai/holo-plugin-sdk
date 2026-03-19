export interface ProviderEnvelope {
    access_model: string;
    last_user_prompt?: string;
    system_prompt?: string;
}

export interface ProviderRequestMetadata {
    options?: Record<string, any>;
    headers?: Record<string, any>;
    query_params?: Record<string, any>;
    branch_id?: string;
    source_id?: string;
    token_type?: string;
    guard_ids?: string[];
    guard_result?: { passed: boolean; errors?: string[] };
    is_streaming?: boolean;
    is_passthrough?: boolean;

    [key: string]: any;
}

export interface ProviderRequest {
    id: string;
    organization_id?: string;
    request_id: string;
    application_id: string;
    provider_id: string;
    protocol_id?: string;
    protocol_capability?: string;
    user_id?: string;
    client_identifier?: string;
    access_model: string;
    has_tools?: boolean;
    thread_id?: string;
    created_at: string;
    request_raw?: Record<string, any>;
    system_prompt?: string;
    last_user_prompt?: string;
    metadata: ProviderRequestMetadata;
}

export interface ProviderAuditRequest extends ProviderRequest {
    application_name?: string;
    provider_name?: string;
    protocol_name?: string;
}
