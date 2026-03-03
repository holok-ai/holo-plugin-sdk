export interface WorkerRequestEnvelope {
    request_id: string;
    request_type: string;
    organization_id?: string;
    application_id: string;
    source_id?: string;
    user_id?: string;
    thread_id?: string;
    branch_id?: string;
    timestamp: string;
    model_slug: string;
    provider_slug: string;
    system_prompt?: string;
    raw_request?: Record<string, any>;
}

export interface WorkerResponseEnvelope {
    request_id: string;
    request_type: string;
    organization_id?: string;
    application_id: string;
    worker_id?: string;
    user_id?: string;
    model_slug: string;
    provider_slug: string;
    system_prompt?: string;
}
