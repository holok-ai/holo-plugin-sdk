import {
    HoloWorkerRequest,
    ProviderDoneEvent,
    ProviderEnvelope,
    ProviderErrorEvent,
    ProviderEventType,
    ProviderRequest,
    ProviderResponse,
    ProviderResponseStatus,
    WorkerRequestEnvelope,
    WorkerResponseEnvelope
} from "@holokai/types";
import {ClassLogger, pickDefined} from "../../core";
import type {IAuditor} from "@holokai/types/provider";
import {ProviderEvent} from "@holokai/types/provider";
import type {
    FinishReason,
    ProviderRequestMetadata,
    ProviderResponseMetadata,
    ProviderResponseMetrics
} from "@holokai/types/entities";

// prompt-extraction.ts

export type PromptRole = "user" | "system";

type RoleLike = {
    role?: string;
};

export function normalizeText(text: string): string | null {
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extract text from OpenAI / Anthropic / Ollama-style `content`.
 * Supports:
 * - string
 * - array of blocks with { type: "text" | "input_text", text: string }
 * - array of blocks with { text: string }
 */
export function extractTextContent(content: unknown): string | null {
    if (typeof content === "string") {
        return normalizeText(content);
    }

    if (!Array.isArray(content)) return null;

    const text = content
        .flatMap((part: any) => {
            if (!part || typeof part !== "object") return [];

            if (
                (part.type === "text" || part.type === "input_text") &&
                typeof part.text === "string"
            ) {
                return [part.text];
            }

            if (typeof part.text === "string") {
                return [part.text];
            }

            return [];
        })
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n");

    return normalizeText(text);
}

/**
 * Extract text from Gemini-style `parts`.
 * Supports:
 * - string
 * - array of parts with { text: string }
 */
export function extractTextParts(parts: unknown): string | null {
    if (typeof parts === "string") {
        return normalizeText(parts);
    }

    if (!Array.isArray(parts)) return null;

    const text = parts
        .flatMap((part: any) => {
            if (!part || typeof part !== "object") return [];
            if (typeof part.text === "string") return [part.text];
            return [];
        })
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n");

    return normalizeText(text);
}

/**
 * Find the first/last message with the given role and extract text from it.
 */
export function extractPromptByRole<T extends RoleLike>(
    items: T[] | undefined,
    role: PromptRole,
    strategy: "first" | "last",
    getText: (item: T) => string | null,
): string | null {
    if (!items || !Array.isArray(items)) return null;

    const iterable = strategy === "last" ? [...items].reverse() : items;

    for (const item of iterable) {
        if (!item || typeof item !== "object") continue;
        if (item.role !== role) continue;

        const text = getText(item);
        if (text) return text;

        return null;
    }

    return null;
}

/**
 * For top-level system prompt-like fields.
 * Returns string as-is, otherwise JSON stringifies structured values.
 */
export function extractTopLevelPrompt(value: unknown): string | null {
    if (value == null) return null;

    if (typeof value === "string") {
        return normalizeText(value);
    }

    try {
        return JSON.stringify(value);
    } catch {
        return null;
    }
}

export abstract class BaseAuditor extends ClassLogger implements IAuditor {
    abstract readonly provider: string;

    async createWorkerRequestEnvelope(workerRequest: HoloWorkerRequest): Promise<WorkerRequestEnvelope> {
        const logger = this.mlog(this.createWorkerRequestEnvelope);
        if (!workerRequest.requestId) {
            logger.error(`No requestId for workerRequest: ${JSON.stringify(workerRequest)}`);
        }

        const {access_model, system_prompt, last_user_prompt} = await this.createProviderEnvelope(workerRequest);
        const {httpRequestDetails} = workerRequest;

        return pickDefined({
            request_id: workerRequest.requestId,
            organization_id: workerRequest.organizationId,
            application: workerRequest.application,
            provider: workerRequest.provider,
            protocol: workerRequest.protocol,
            user_id: workerRequest.userId,
            thread_id: workerRequest.threadId,
            created_at: new Date(workerRequest.timestamp).toISOString(),
            request_raw: JSON.stringify(workerRequest.payload) as unknown,
            access_model,
            system_prompt,
            last_user_prompt,
            metadata: pickDefined({
                source_id: workerRequest.sourceId,
                branch_id: workerRequest.branchId,
                httpRequestDetails,
                is_streaming: workerRequest.isStreaming || undefined,
                is_passthrough: workerRequest.isPassthrough || undefined,
                guard_result: workerRequest.guardResult,
                token_type: workerRequest.tokenType,
            })
        }) as WorkerRequestEnvelope;
    }

    async createWorkerResponseEnvelope(workerRequest: HoloWorkerRequest, workerId?: string): Promise<WorkerResponseEnvelope> {
        const providerEnvelope = await this.createProviderEnvelope(workerRequest);
        return pickDefined({
            source_id: workerRequest.sourceId,
            request_id: workerRequest.requestId,
            organization_id: workerRequest.organizationId,
            application: workerRequest.application,
            provider: workerRequest.provider,
            protocol: workerRequest.protocol,
            user_id: workerRequest.userId,
            client_identifier: workerRequest.clientIdentifier,
            worker_id: workerId,
            payload: workerRequest.payload,
            thread_id: workerRequest.threadId,
            branch_id: workerRequest.branchId,
            ...providerEnvelope
        }) as WorkerResponseEnvelope;
    }

    async auditRequest(workerRequest: HoloWorkerRequest): Promise<ProviderRequest> {
        const envelope = await this.createWorkerRequestEnvelope(workerRequest);

        const metadata: ProviderRequestMetadata = {
            ...envelope.metadata,
            options: await this.extractRequestOptions(workerRequest)
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
            request_raw: envelope.request_raw,
            access_model: envelope.access_model,
            system_prompt: envelope.system_prompt,
            last_user_prompt: envelope.last_user_prompt,
            has_tools: this.hasTools(workerRequest.payload),
            thread_id: envelope.thread_id,
            created_at: envelope.created_at,
            metadata
        } as Omit<ProviderRequest, 'id'>;

        return pickDefined(providerRequest) as ProviderRequest;
    }

    async auditResponse(
        envelope: WorkerResponseEnvelope,
        providerEvent: ProviderDoneEvent | ProviderErrorEvent
    ): Promise<ProviderResponse> {
        const metrics = await this.mapResponseMetrics(providerEvent, envelope.protocol.name);
        const responseRaw = providerEvent.type === ProviderEventType.DONE
            ? providerEvent.message
            : providerEvent.type === 'error'
                ? await this.extractNativeError(providerEvent)
                : undefined;

        const {
            usage_raw,
            input_tokens,
            output_tokens,
            total_tokens,
            time_to_first_token,
            total_processing_time
        } = metrics;

        const metadata: ProviderResponseMetadata = pickDefined({
            worker_id: envelope.worker_id,
        }) as ProviderResponseMetadata;

        return pickDefined({
            request_id: envelope.request_id,
            organization_id: envelope.organization_id,
            application_id: envelope.application?.id,
            provider_id: envelope.provider.id,
            protocol_id: envelope.protocol.id,
            capability: envelope.protocol.capability,
            user_id: envelope.user_id,
            client_identifier: envelope.client_identifier,
            access_model: envelope.access_model,
            status: await this.mapResponseStatus(providerEvent, envelope),
            finish_reason: await this.extractFinishReason(providerEvent, envelope),
            response: providerEvent.text,
            response_raw: responseRaw,
            usage_raw,
            input_tokens,
            output_tokens,
            total_tokens,
            time_to_first_token,
            total_processing_time,
            cost: 0,
            created_at: providerEvent.ts ? new Date(providerEvent.ts).toISOString() : new Date().toISOString(),
            metadata,
        }) as ProviderResponse;
    }

    protected async mapResponseMetrics(providerEvent: ProviderDoneEvent | ProviderErrorEvent, protocolName: string): Promise<ProviderResponseMetrics> {
        const {metrics} = providerEvent;

        const eventMetrics = {
            input_tokens: metrics.inputTokens,
            output_tokens: metrics.outputTokens,
            total_tokens: metrics.inputTokens + metrics.outputTokens,
            time_to_first_token: metrics.timeToFirstToken,
            total_processing_time: metrics.totalProcessingTime,
        };

        if (providerEvent.type === ProviderEventType.ERROR) {
            return eventMetrics;
        }

        const providerMetrics = await this.mapProviderResponseMetrics(providerEvent, protocolName);

        return {
            ...eventMetrics,
            ...providerMetrics
        };
    }

    protected abstract mapProviderResponseMetrics(providerEvent: ProviderDoneEvent, protocolName: string): Promise<Partial<ProviderResponseMetrics>>

    protected async mapResponseStatus(providerEvent: ProviderEvent, _envelope: WorkerResponseEnvelope): Promise<ProviderResponseStatus> {
        switch (providerEvent.type) {
            case 'done':
                return ProviderResponseStatus.SUCCESS;
            case 'error':
                return ProviderResponseStatus.ERROR;
            default:
                return ProviderResponseStatus.PARTIAL
        }
    }

    protected hasTools(payload: any): boolean {
        return Array.isArray(payload?.tools) && payload.tools.length > 0;
    }

    protected abstract extractFinishReason(
        providerEvent: ProviderDoneEvent | ProviderErrorEvent,
        envelope: WorkerResponseEnvelope
    ): Promise<FinishReason | undefined>;

    protected async extractNativeError(providerEvent: ProviderErrorEvent): Promise<any> {
        const err = providerEvent.error;
        return err?.error ?? err;
    }

    protected abstract extractRequestOptions(workerRequest: HoloWorkerRequest): Promise<Record<string, any>>;

    protected abstract createProviderEnvelope(
        workerRequest: HoloWorkerRequest
    ): Promise<ProviderEnvelope>;
}
