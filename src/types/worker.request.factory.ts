import {HttpApiRequest} from "../api/types";
import {Auth} from "../admin/types";
import {v4 as uuidv4} from "uuid";
import logger from "../utils/logger";
import {HoloWorkerRequest, pickDefined, RequestType} from "@holokai/sdk";

export class WorkerRequestFactory {
    static logger = logger.child({className: 'WorkerRequestFactory'});

    static fromRequest(
        providerType: string,
        providerName: string | undefined,
        type: RequestType,
        req: HttpApiRequest,
        sourceId: string
    ): HoloWorkerRequest {
        const {auth, body, headers, query} = req;

        // Remove thread_id and branch_id from body before validation as they're not part of provider API schemas
        // thread_id and branch_id are extracted separately in fromRequest() and stored in HoloWorkerRequest
        const {thread_id, branch_id, ...payload} = body;

        // Transform OpenAI-specific deprecated parameters
        if (providerType === 'openai') {
            this.transformOpenAIPayload(payload);
        }

        return this.create(providerType, providerName, type, payload, sourceId, auth, headers, query, thread_id, branch_id);
    }

    private static transformOpenAIPayload(payload: any): void {
        // Transform deprecated max_tokens to max_completion_tokens
        if (payload.max_tokens !== undefined) {
            payload.max_completion_tokens = payload.max_tokens;
            delete payload.max_tokens;
        }

        // Transform deprecated user to safety_identifier
        if (payload.user !== undefined) {
            payload.safety_identifier = payload.user;
            delete payload.user;
        }

        // Handle restricted models that don't support temperature/sampling parameters
        // - o1/o3 series (o1-preview, o1-mini, o1, o3, etc.)
        // - gpt-5 and above (gpt-5, gpt-6, etc.)
        const model = payload.model?.toLowerCase() || '';
        const isO1OrO3Model = model.startsWith('o1') || model.startsWith('o3');
        const isGpt5Plus = /^gpt-([5-9]|\d{2,})/.test(model);
        const isRestrictedModel = isO1OrO3Model || isGpt5Plus;

        if (isRestrictedModel) {
            // Remove unsupported parameters for restricted models
            delete payload.temperature;
            delete payload.top_p;
            delete payload.frequency_penalty;
            delete payload.presence_penalty;

            this.logger.debug(`Removed unsupported parameters for restricted model: ${payload.model}`);
        }
    }

    static create(
        providerType: string,
        providerName: string | undefined,
        type: RequestType,
        payload: any,
        sourceId: string,
        auth?: Auth,
        headers?: Record<string, any>,
        query?: Record<string, any>,
        thread_id?: string,
        branch_id?: string,
    ) {
        let sanitizedAuth = {};

        if (auth) {
            const {organizationId, userId, app} = auth;
            sanitizedAuth = {
                organizationId,
                userId,
                app: app.urlSlug
            };
        }

        return pickDefined({
            providerType,
            providerName,
            sourceId,
            requestId: uuidv4(),
            type,
            payload,
            isStreaming: payload.stream === true,
            timestamp: Date.now(),
            headers,
            query,
            thread_id,
            branch_id,
            ...sanitizedAuth
        }) as HoloWorkerRequest;
    }
}
