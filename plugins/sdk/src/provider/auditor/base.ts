import {
    HoloWorkerRequest,
    LlmStatus,
    ProviderRequest,
    ProviderResponse,
    WorkerRequestEnvelope,
    WorkerResponseEnvelope
} from "@holokai/types";
import {ClassLogger, pickDefined, stringifyError} from "../../core";
import type {IAuditor} from "@holokai/types/provider";
import {ProviderEnvelope, ProviderEvent} from "@holokai/types/provider";
import type {ProviderRequestMetadata, ProviderResponseMetadata} from "@holokai/types/entities";

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
            organization_id: workerRequest.organizationId,
            application: workerRequest.application,
            provider: workerRequest.provider,
            protocol: workerRequest.protocol,
            user_id: workerRequest.userId,
            thread_id: workerRequest.thread_id,
            timestamp: new Date(workerRequest.timestamp).toISOString(),
            metadata: pickDefined({
                raw_request: workerRequest.payload,
                source_id: workerRequest.sourceId,
                branch_id: workerRequest.branch_id,
                headers: workerRequest.rawRequest?.headers,
                query_params: workerRequest.rawRequest?.query,
                is_streaming: workerRequest.isStreaming || undefined,
                is_passthrough: workerRequest.isPassthrough || undefined,
                guard_result: workerRequest.guardResult,
                token_type: workerRequest.tokenType,
            }),
            ...providerEnvelope
        }) as WorkerRequestEnvelope;
    }

    async createWorkerResponseEnvelope(workerRequest: HoloWorkerRequest, workerId?: string): Promise<WorkerResponseEnvelope> {
        const providerEnvelope = await this.createProviderEnvelope(workerRequest.payload);
        return pickDefined({
            request_id: workerRequest.requestId,
            organization_id: workerRequest.organizationId,
            application: workerRequest.application,
            provider: workerRequest.provider,
            protocol: workerRequest.protocol,
            user_id: workerRequest.userId,
            client_identifier: workerRequest.clientIdentifier,
            worker_id: workerId,
            ...providerEnvelope
        }) as WorkerResponseEnvelope;
    }

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest> {
        const envelope = await this.createWorkerRequestEnvelope(workerRequest);

        const metadata: ProviderRequestMetadata = {
            ...envelope.metadata,
        };

        const providerRequest: Omit<ProviderRequest, 'id'> = {
            request_id: envelope.request_id,
            organization_id: envelope.organization_id,
            application_id: envelope.application?.id,
            provider_id: envelope.provider.id,
            protocol_id: envelope.protocol.id,
            protocol_capability: envelope.protocol.capability,
            user_id: envelope.user_id,
            client_identifier: workerRequest.clientIdentifier,
            access_model: envelope.access_model,
            thread_id: envelope.thread_id,
            timestamp: envelope.timestamp,
            metadata,
        } as Omit<ProviderRequest, 'id'>;

        this.toHoloRequest(workerRequest, providerRequest);
        this.mapProviderPayload(workerRequest, providerRequest);

        return pickDefined(providerRequest) as ProviderRequest;
    }

    async auditResponse(
        responseEnvelope: WorkerResponseEnvelope,
        providerEvent: ProviderEvent
    ): Promise<ProviderResponse> {
        const metrics = providerEvent.type === 'done' || providerEvent.type === 'error' ? await this.mapResponseMetrics(providerEvent) : {};

        const metadata: ProviderResponseMetadata = pickDefined({
            response_raw: providerEvent as any,
            error_message: providerEvent.type === 'error' ? stringifyError(providerEvent.error) : undefined,
            worker_id: responseEnvelope.worker_id,
            usage_raw: (metrics as any).usage_raw,
        }) as ProviderResponseMetadata;

        return pickDefined({
            request_id: responseEnvelope.request_id,
            organization_id: responseEnvelope.organization_id,
            application_id: responseEnvelope.application?.id,
            provider_id: responseEnvelope.provider.id,
            protocol_id: responseEnvelope.protocol.id,
            capability: responseEnvelope.protocol.capability,
            user_id: responseEnvelope.user_id,
            client_identifier: responseEnvelope.client_identifier,
            access_model: responseEnvelope.access_model,
            status: await this.mapResponseStatus(providerEvent),
            response: providerEvent.type === 'done' || providerEvent.type === 'text_delta' ? providerEvent.text : JSON.stringify(providerEvent),
            input_tokens: (metrics as any).input_tokens,
            output_tokens: (metrics as any).output_tokens,
            time_to_first_token: (metrics as any).time_to_first_token,
            total_processing_time: (metrics as any).total_processing_time,
            cost: 0,
            created_at: providerEvent.ts ? new Date(providerEvent.ts).toISOString() : new Date().toISOString(),
            metadata,
        }) as ProviderResponse;
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

    protected abstract toHoloRequest(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void;

    protected abstract mapProviderPayload(workerRequest: HoloWorkerRequest, llmRequest: Omit<ProviderRequest, 'id'>): void;

    protected abstract createProviderEnvelope(
        payload: any
    ): Promise<ProviderEnvelope>;
}
