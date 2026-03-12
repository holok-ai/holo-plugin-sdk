import {Application, Protocol, Provider} from "../entities";

export interface WorkerRequestEnvelope {
    request_id: string;
    organization_id: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    user_id?: string;
    access_model: string;
    thread_id?: string;
    timestamp: string;
    metadata: Record<string, any>;
}

export interface WorkerResponseEnvelope {
    request_id: string;
    organization_id: string;
    application?: Application;
    provider: Provider;
    protocol: Protocol;
    user_id?: string;
    client_identifier?: string;
    access_model: string;
    worker_id?: string;
}
