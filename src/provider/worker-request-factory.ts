import type {HoloWorkerRequest, WorkerResponseEnvelope, HttpRequestDetails} from '@holokai/holo-types/worker';
import type {Provider, Application} from '@holokai/holo-types/entities';
import type {ProviderProtocol} from '@holokai/holo-types/provider';
import {pickDefined} from '../core';
import {v4 as uuidv4} from 'uuid';

export interface WorkerRequestParams {
    provider: Provider;
    protocol: ProviderProtocol;
    payload: any;
    sourceId: string;
    isStreaming: boolean;
    requestId?: string | undefined;
    organizationId?: string | undefined;
    httpRequestDetails?: HttpRequestDetails | undefined;
    application?: Application | undefined;
    threadId?: string | undefined;
    branchId?: string | undefined;
    userId?: string | undefined;
    clientIdentifier?: string | undefined;
    tokenType?: string | undefined;
    appSlug?: string | undefined;
}

export function createWorkerRequest(params: WorkerRequestParams): HoloWorkerRequest {
    return pickDefined({
        provider: params.provider,
        protocol: params.protocol,
        payload: params.payload,
        sourceId: params.sourceId,
        isStreaming: params.isStreaming,
        requestId: params.requestId ?? uuidv4(),
        organizationId: params.organizationId ?? '',
        timestamp: new Date().toISOString(),
        httpRequestDetails: params.httpRequestDetails ?? {path: '/', method: 'POST'},
        application: params.application,
        threadId: params.threadId,
        branchId: params.branchId,
        userId: params.userId,
        clientIdentifier: params.clientIdentifier,
        tokenType: params.tokenType,
        appSlug: params.appSlug,
    }) as HoloWorkerRequest;
}

export function createResponseEnvelope(request: HoloWorkerRequest, accessModel: string, workerId?: string): WorkerResponseEnvelope {
    return pickDefined({
        source_id: request.sourceId,
        request_id: request.requestId,
        organization_id: request.organizationId,
        provider: request.provider,
        protocol: request.protocol,
        application: request.application,
        access_model: accessModel,
        user_id: request.userId,
        thread_id: request.threadId,
        client_identifier: request.clientIdentifier,
        worker_id: workerId,
    }) as WorkerResponseEnvelope;
}
