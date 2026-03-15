export interface ProviderRequestMetadata {
    user_prompt?: string;
    system_prompt?: string;
    options?: Record<string, any>;
    raw_request?: Record<string, any>;
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
    thread_id?: string;
    timestamp: string;
    metadata: ProviderRequestMetadata;
}

export interface ProviderAuditRequest extends ProviderRequest {
    application_name?: string;
    provider_name?: string;
    protocol_name?: string;
}
