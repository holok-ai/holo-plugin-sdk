import {LlmStatus} from "./llm.status";

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
