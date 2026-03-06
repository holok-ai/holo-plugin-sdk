export interface WorkerRequestEnvelope {
    request_id: string;
    organization_id?: string;
    application_id: string;
    provider_id: string;
    protocol_id?: string;
    capability?: string;
    user_id?: string;
    access_model: string;
    thread_id?: string;
    timestamp: string;
    application_name?: string;
    provider_name?: string;
    protocol_name?: string;
    metadata: Record<string, any>;
}

export interface WorkerResponseEnvelope {
    request_id: string;
    organization_id?: string;
    application_id: string;
    provider_id: string;
    protocol_id?: string;
    capability?: string;
    user_id?: string;
    client_identifier?: string;
    access_model: string;
    worker_id?: string;
    application_name?: string;
    provider_name?: string;
    protocol_name?: string;
}
