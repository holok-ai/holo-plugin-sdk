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