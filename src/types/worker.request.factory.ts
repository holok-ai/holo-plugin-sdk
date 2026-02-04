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
        sourceId: string,
        isPassthrough: boolean = false
    ): HoloWorkerRequest {
        const {auth, body, headers, query, path, method} = req;

        const {thread_id, branch_id, ...payload} = body;
        const workerRequest = this.create(
            providerType,
            providerName,
            type,
            payload,
            sourceId,
            auth,
            {path, method, headers: headers || {}, query: query || {}},
            thread_id,
            branch_id
        );

        if (isPassthrough) {
            workerRequest.isPassthrough = true;
            workerRequest.passthroughPath = path.replace(`/api/${providerType}`, '');
        }

        return workerRequest;
    }

    static create(
        providerType: string,
        providerName: string | undefined,
        type: RequestType,
        payload: any,
        sourceId: string,
        auth?: Auth,
        rawRequest?: {path: string; method: string; headers: Record<string, any>; query: Record<string, any>},
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
            rawRequest: rawRequest || {path: '', method: 'POST', headers: {}, query: {}},
            thread_id,
            branch_id,
            ...sanitizedAuth
        }) as HoloWorkerRequest;
    }
}
