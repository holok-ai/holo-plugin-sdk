import {Application, Protocol, Provider} from "../entities";

export interface WorkerRequestEnvelope {
    request_id: string;
    organization_id: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    user_id?: string;
    request_raw: Record<string, any>;
    access_model: string;
    last_user_prompt?: string;
    system_prompt?: string;
    thread_id?: string;
    created_at: string;
    metadata: Record<string, any>;
}

export interface WorkerResponseEnvelope {
    source_id: string;
    request_id: string;
    organization_id: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    user_id?: string;
    client_identifier?: string;
    access_model: string;
    worker_id?: string;
    payload?: any;
    thread_id?: string;
    branch_id?: string;
}
