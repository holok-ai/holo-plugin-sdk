import {HoloApiRequest} from "../api/types";
import {v4 as uuidv4} from "uuid";
import logger from "../utils/logger";
import {pickDefined} from "@holokai/sdk";
import type {Auth} from "@holokai/types/api";
import type {HoloWorkerRequest, HttpRequestDetails} from "@holokai/types/worker";
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

        const workerRequest = this.create(
            provider,
            protocol,
            payload,
            sourceId,
            auth,
            pickDefined({path, method, headers, query}) as HttpRequestDetails,
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
        httpRequestDetails?: HttpRequestDetails,
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
            httpRequestDetails,
            threadId: thread_id,
            branchId: branch_id,
            ...sanitizedAuth
        }) as HoloWorkerRequest;
    }
}
