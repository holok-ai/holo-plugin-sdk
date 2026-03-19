import {Application, Protocol, Provider} from "../entities";

export interface WorkerEnvelopeBase {
    request_id: string;
    organization_id: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    user_id?: string;
    access_model: string;
    thread_id?: string;
}

export interface WorkerRequestEnvelope extends WorkerEnvelopeBase {
    request_raw: Record<string, any>;
    last_user_prompt?: string;
    system_prompt?: string;
    created_at: string;
    metadata: Record<string, any>;
}

export interface WorkerResponseEnvelope extends WorkerEnvelopeBase {
    source_id: string;
    client_identifier?: string;
    worker_id?: string;
    payload?: any;
    branch_id?: string;
}
