import {ProviderResponse, ProviderType} from "../providers/types";
import {LLMWorkerResponse} from "./index";
import {pickDefined} from "../utils";
import {env} from "../env";
import {HoloResponseFactory} from "../providers/holo/holo.response.factory";
import {HoloTranslator} from "../providers/holo/holo.translator";
import {LLMWorkerRequest} from "./worker.types";

export class WorkerResponseFactory {
    /**
     * Creates a validated LLMWorkerResponse
     */
    static create(
        sourceId: string,
        requestId: string,
        providerType: ProviderType,
        payload: ProviderResponse | ProviderResponse[],
        organizationId?: string,
        fullResponse?: string,
        workerId?: string,
        providerName?: string,
    ): LLMWorkerResponse {
        const response = pickDefined({
            organizationId,
            sourceId,
            requestId,
            providerType,
            providerName,
            workerId: workerId || env.worker.serverId || 'unknown',
            payload,
            fullResponse,
            timestamp: Date.now()
        }) as LLMWorkerResponse;

        // Validate the response
        // const validated = LLMWorkerResponseValidator(response);
        // if (validated instanceof ArkErrors) {
        //     logger.error('Worker response validation failed', {
        //         errors: validated.summary,
        //         response
        //     });
        // }

        return response as LLMWorkerResponse;
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
        request: LLMWorkerRequest,
        errors: string[],
        workerId: string,
        holoTranslator: HoloTranslator
    ): Promise<LLMWorkerResponse> {
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
            ? JSON.stringify({ error: 'guard_failure', message: errorMessage, errors })
            : `I could not complete your request due to the following guard issues: ${errorMessage}`;

        if (request.isStreaming) {
            // Create error chunks with target provider type
            const chunks = HoloResponseFactory.createErrorStreamChunks(
                errorId,
                model || 'unknown',
                formattedError,
                request.providerType
            );
            const providerChunks = await holoTranslator.fromHoloStreamChunks(chunks, request.providerType) as ProviderResponse[];

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
            );
            const providerPayload = await holoTranslator.fromHoloResponse(holoError, request.providerType) as ProviderResponse;

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
