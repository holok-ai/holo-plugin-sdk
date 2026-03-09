import {HoloApiRequest} from "../api/types";
import {v4 as uuidv4} from "uuid";
import logger from "../utils/logger";
import {pickDefined} from "@holokai/sdk";
import type {Auth} from "@holokai/types/api";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import {Application, Protocol, Provider} from "@holokai/types/entities";

export class WorkerRequestFactory {
    static logger = logger.child({className: 'WorkerRequestFactory'});

    static fromRequest(
        provider: Provider,
        protocol: Protocol,
        req: HoloApiRequest,
        sourceId: string,
        application?: Application,
        isPassthrough: boolean = false
    ): HoloWorkerRequest {
        const {auth, body, headers, query, path, method} = req;

        if (!provider) throw new Error("No provider provided");

        const {thread_id, branch_id, ...payload} = body;

        // Transform OpenAI-specific deprecated parameters
        if (provider.type === 'openai') {
            this.transformOpenAIPayload(payload);
        }


        const workerRequest = this.create(
            provider,
            protocol,
            payload,
            sourceId,
            auth,
            {path, method, headers: headers || {}, query: query || {}},
            thread_id,
            branch_id,
            application
        );

        if (isPassthrough) {
            workerRequest.isPassthrough = true;
            workerRequest.passthroughPath = path.replace(`/api/${provider.type}`, '');
        }

        return workerRequest;
    }

    static create(
        provider: Provider,
        protocol: Protocol,
        payload: any,
        sourceId: string,
        auth?: Auth,
        rawRequest?: { path: string; method: string; headers: Record<string, any>; query: Record<string, any> },
        thread_id?: string,
        branch_id?: string,
        application?: Application
    ) {
        let sanitizedAuth: Record<string, any> = {};
        const providerName = provider.name;

        if (auth) {
            const {organizationId, userId, tokenType, clientIdentifier} = auth;
            const appSlug = application?.url_slug || providerName;
            sanitizedAuth = {
                organizationId,
                userId,
                appSlug,
                applicationId: application?.id,
                applicationName: application?.name,
                providerId: application?.provider_id,
                providerName: application?.provider?.name ?? providerName,
                clientIdentifier,
                tokenType,
            };
        }

        return pickDefined({
            application,
            provider,
            protocol,
            requestId: uuidv4(),
            sourceId,
            payload,
            isStreaming: payload.stream === true,
            timestamp: new Date().toISOString(),
            rawRequest: rawRequest || {path: '', method: 'POST', headers: {}, query: {}},
            thread_id,
            branch_id,
            ...sanitizedAuth
        }) as HoloWorkerRequest;
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
}
