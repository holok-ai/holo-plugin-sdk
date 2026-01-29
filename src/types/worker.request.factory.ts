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
        const {auth, body} = req;
        // this.logger.info(`parsing request: ${JSON.stringify(body, null, 2)}`)

        // Remove thread_id and branch_id from body before validation as they're not part of provider API schemas
        // thread_id and branch_id are extracted separately in fromRequest() and stored in HoloWorkerRequest
        const {thread_id, branch_id, ...payload} = body;
        return this.create(providerType, providerName, type, payload, sourceId, auth, thread_id, branch_id);
    }

    static create(
        providerType: string,
        providerName: string | undefined,
        type: RequestType,
        payload: any,
        sourceId: string,
        auth?: Auth,
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
            thread_id,
            branch_id,
            ...sanitizedAuth
        }) as HoloWorkerRequest;
    }
}
