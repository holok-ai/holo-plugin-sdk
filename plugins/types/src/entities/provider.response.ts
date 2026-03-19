import type {FinishReason} from "./finish.reason";

export const ProviderResponseStatus = {
    SUCCESS: 'success',
    ERROR: 'error',
    TIMEOUT: 'timeout',
    PARTIAL: 'partial',
    RATE_LIMITED: 'rate_limited',
    INVALID_REQUEST: 'invalid_request'
} as const;

export type ProviderResponseStatus = typeof ProviderResponseStatus[keyof typeof ProviderResponseStatus];

export interface ProviderResponseMetrics {
    input_tokens: number,
    output_tokens: number,
    total_tokens: number,
    time_to_first_token: number,
    total_processing_time: number

    usage_raw?: Record<string, any>
}

export interface ProviderResponseMetadata {
    token_breakdown?: Record<string, number>;
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
    status: ProviderResponseStatus;
    response?: string;
    response_raw?: Record<string, any>;
    usage_raw?: Record<string, any>;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    time_to_first_token: number;
    total_processing_time: number;
    finish_reason?: FinishReason;
    cost: number;
    score?: number;
    created_at: string;
    metadata: ProviderResponseMetadata;
}

export interface ProviderResponseView extends ProviderResponse {
    organization_name?: string;
    application_name?: string;
    plugin_name?: string;
    plugin_version?: string;
    provider_name?: string;
    protocol_name?: string;
}
