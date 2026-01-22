import {env} from "../env";
import {
    HoloResponse,
    HoloResponseFactory,
    HoloWorkerRequest,
    HoloWorkerResponse,
    IProviderTranslator,
    pickDefined
} from "@holokai/sdk";

export class WorkerResponseFactory {
    /**
     * Creates a validated LLMWorkerResponse
     */
    static create(
        sourceId: string,
        requestId: string,
        providerType: string,
        payload: any | any[],
        organizationId?: string,
        fullResponse?: string,
        workerId?: string,
        providerName?: string,
    ): HoloWorkerResponse {
        return pickDefined({
            organizationId,
            sourceId,
            requestId,
            providerType,
            providerName,
            workerId: workerId || env.worker.serverId || 'unknown',
            payload,
            fullResponse,
            timestamp: Date.now()
        }) as HoloWorkerResponse;
    }

    /**
     * Creates an error response for validation/guard failures.
     *
     * Automatically detects if the request expects structured output (JSON schema/object)
     * and formats the error accordingly:
     * - JSON response_format: Returns structured JSON with error details
     * - Chat/text response: Returns natural language error message
     *
     * Handles both streaming and non-streaming responses.
     */
    static async createGuardError(
        request: HoloWorkerRequest,
        errors: string[],
        workerId: string,
        holoTranslator: IProviderTranslator
    ): Promise<HoloWorkerResponse> {
        const payload = request.payload;
        const model = (payload && typeof payload === 'object' && 'model' in payload)
            ? (payload as { model?: string }).model
            : undefined;

        // Check if this is a programmatic API call with structured response format
        const responseFormat = (payload && typeof payload === 'object' && 'response_format' in payload)
            ? (payload as { response_format?: { type: string } }).response_format
            : undefined;
        const isStructuredResponse = responseFormat?.type === 'json_schema' || responseFormat?.type === 'json_object';

        const errorMessage = errors.join('; ');
        const errorId = `guard-error-${request.requestId}`;

        // Format error based on response type
        // For programmatic API calls (JSON schema/object), return structured error
        // For chat clients, return natural language error message
        const formattedError = isStructuredResponse
            ? JSON.stringify({error: 'guard_failure', message: errorMessage, errors})
            : `I could not complete your request due to the following guard issues: ${errorMessage}`;

        if (request.isStreaming) {
            // Create error chunks with target provider type
            const chunks = HoloResponseFactory.createErrorStreamChunks(
                errorId,
                model || 'unknown',
                formattedError,
                request.providerType
            );
            const providerChunks = await holoTranslator.fromHoloStreamChunks(chunks) as any[];

            return this.create(
                request.sourceId,
                request.requestId,
                request.providerType,
                providerChunks,
                request.organizationId,
                JSON.stringify(providerChunks),
                workerId,
                request.providerName
            );
        } else {
            const holoError = await HoloResponseFactory.createErrorResponse(
                errorId,
                model || 'unknown',
                formattedError
            ) as HoloResponse;
            const providerPayload = await holoTranslator.fromHoloResponse(holoError);

            return this.create(
                request.sourceId,
                request.requestId,
                request.providerType,
                providerPayload,
                request.organizationId,
                JSON.stringify(providerPayload),
                workerId,
                request.providerName
            );
        }
    }
}
