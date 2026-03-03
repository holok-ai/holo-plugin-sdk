import {
    HoloWorkerRequest,
    LlmRequest,
    LlmResponse,
    LlmStatus,
    WorkerRequestEnvelope,
    WorkerResponseEnvelope
} from "@holokai/types";
import {ClassLogger, pickDefined, stringifyError} from "../../core";
import type {IAuditor} from "@holokai/types/provider";
import {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";

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
            application_id: workerRequest.appSlug ?? workerRequest.providerName,
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
            application_id: workerRequest.appSlug ?? workerRequest.providerName,
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

    async auditResponse(
        responseEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<LlmResponse> {
        const metrics = providerEvent.type === 'done' || providerEvent.type === 'error' ? await this.mapResponseMetrics(providerEvent) : {};

        return pickDefined({
            ...responseEnvelope,
            ...metrics,
            created_at: providerEvent.ts ? new Date(providerEvent.ts).toISOString() : new Date().toISOString(),
            cost: 0,
            response: providerEvent.type === 'done' || providerEvent.type === 'text_delta' ? providerEvent.text : JSON.stringify(providerEvent),
            response_raw: providerEvent as any,
            status: await this.mapResponseStatus(providerEvent),
            error_message: providerEvent.type === 'error' ? stringifyError(providerEvent.error) : undefined,
        }) as LlmResponse;
    }

    protected async mapResponseMetrics(providerEvent: Extract<ProviderEvent, { type: 'done' | 'error' }>) {
        const metrics = providerEvent.metrics;

        if (!metrics) return {};

        return pickDefined({
            usage_raw: metrics,
            input_tokens: metrics.inputTokens,
            output_tokens: metrics.outputTokens,
            time_to_first_token: metrics.timeToFirstToken,
            total_processing_time: metrics.totalProcessingTime,
        });
    }

    protected async mapResponseStatus(providerEvent: ProviderEvent): Promise<LlmStatus> {
        switch (providerEvent.type) {
            case 'done':
                return LlmStatus.SUCCESS;
            case 'error':
                return LlmStatus.ERROR;
            default:
                return LlmStatus.PARTIAL
        }
    }

    // Abstract methods that provider-specific auditors must implement
    protected abstract toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    protected abstract mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<LlmRequest, 'id'>): void;

    protected abstract createProviderEnvelope(
        payload: any
    ): Promise<ProviderEnvelope>;
}
