import type {NotificationEvent, NotificationEventType, NotificationSeverity} from '@holokai/types/notification';
import type {Auth} from '@holokai/types/api';
import type {HoloWorkerRequest} from '@holokai/types/worker';
import {pickDefined} from "../core";
import {v4 as uuidv4} from "uuid";

export class NotificationEventFactory {
    static fromAuthAndRequest(type: NotificationEventType, auth: Auth, request: HoloWorkerRequest, message: string, payload?: any, severity: NotificationSeverity = "info"): NotificationEvent {
        const {organizationId, app, userId} = auth;
        const {requestId, thread_id, branch_id} = request;
        const appSlug = app?.urlSlug;
        return pickDefined({
            id: uuidv4(),
            ts: Date.now(),
            organizationId,
            userId,
            appSlug,
            type,
            severity,
            message,
            requestId,
            payload,
            threadId: thread_id,
            branchId: branch_id,
        }) as NotificationEvent;
    }
}
