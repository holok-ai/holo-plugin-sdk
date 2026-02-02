import {HoloWorkerRequest, WorkerRequestEnvelope, WorkerResponseEnvelope} from "../../core/worker";
import {ClassLogger, pickDefined} from "../../core";
import {ProviderEnvelope, ProviderEvent} from "../types";
import {LlmRequest, LlmResponse, LlmStatus} from "../../core/entities";


export interface IAuditor {
    readonly provider: string;

    auditRequest(workerRequest: HoloWorkerRequest): Promise<LlmRequest>;

    createWorkerResponseEnvelope(workerRequest: HoloWorkerRequest, workerId?: string): Promise<WorkerResponseEnvelope>;

    auditResponse(
        responseEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent,
    ): Promise<LlmResponse>;
}

export abstract class BaseAuditor extends ClassLogger implements IAuditor {
    abstract readonly provider: string;

    async createWorkerRequestEnvelope(workerRequest: HoloWorkerRequest): Promise<WorkerRequestEnvelope> {
        const logger = this.mlog(this.createWorkerResponseEnvelope);
        if (!workerRequest.requestId) {
            logger.error(`No requestId for workerRequest: ${JSON.stringify(workerRequest)}`);
        }

        const providerEnvelope = await this.createProviderEnvelope(workerRequest.payload);

        return pickDefined({
            request_id: workerRequest.requestId,
            request_type: workerRequest.type,
            organization_id: workerRequest.organizationId,
            application_id: workerRequest.appSlug ?? 'default',
            user_id: workerRequest.userId,
            provider_slug: workerRequest.providerName,
            timestamp: new Date(workerRequest.timestamp).toISOString(),
            source_id: workerRequest.sourceId,
            thread_id: workerRequest.thread_id,
            branch_id: workerRequest.branch_id,
            raw_request: workerRequest.payload,
            ...providerEnvelope
        }) as WorkerRequestEnvelope;


    }

    async createWorkerResponseEnvelope(workerRequest: HoloWorkerRequest, workerId?: string): Promise<WorkerResponseEnvelope> {
        return pickDefined({
            worker_id: workerId,
            request_id: workerRequest.requestId,
            request_type: workerRequest.type,
            organization_id: workerRequest.organizationId,
            application_id: workerRequest.appSlug ?? 'default',
            user_id: workerRequest.userId,
            provider_slug: workerRequest.providerName,
            ...await this.createProviderEnvelope(workerRequest.payload)
        }) as WorkerResponseEnvelope;
    }

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<LlmRequest> {
        const requestEnvelope = await this.createWorkerRequestEnvelope(workerRequest);

        const llmRequest: Omit<LlmRequest, 'id'> = {
            ...requestEnvelope
        } as Omit<LlmRequest, 'id'>;

        // Call provider-specific mapping methods to extract user_prompt, options, etc.
        this.toHoloRequest(workerRequest, llmRequest);
        this.mapProviderPayload(workerRequest, llmRequest);

        return pickDefined(llmRequest) as LlmRequest;
    }

    // Abstract methods that provider-specific auditors must implement
    protected abstract toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    protected abstract mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    async auditResponse(
        responseEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<LlmResponse> {
        return pickDefined({
            ...responseEnvelope,
            created_at: providerEvent.ts ? new Date(providerEvent.ts).toISOString() : new Date().toISOString(),
            status: LlmStatus.SUCCESS,
            cost: 0,
            response: providerEvent.type === 'done' || providerEvent.type === 'text_delta' ? providerEvent.text : JSON.stringify(providerEvent),
            response_raw: providerEvent as any
        }) as LlmResponse;
    }

    protected abstract createProviderEnvelope(
        payload: any
    ): Promise<ProviderEnvelope>;
}
