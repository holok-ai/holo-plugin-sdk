import type {NotificationEvent, NotificationSeverity} from '@holokai/holo-types/notification';
import {NotificationEventType} from "@holokai/holo-types/notification";
import type {Auth} from '@holokai/holo-types/api';
import type {HoloWorkerRequest} from '@holokai/holo-types/worker';
import {pickDefined} from "../core";
import {v4 as uuidv4} from "uuid";
import {ProviderDoneEvent, ProviderErrorEvent, ProviderEventType, WorkerResponseEnvelope} from "@holokai/holo-types";

export class NotificationEventFactory {
    static fromAuthAndRequest(type: NotificationEventType, auth: Auth, request: HoloWorkerRequest, message: string, payload?: any, severity: NotificationSeverity = "info"): NotificationEvent {
        const {organizationId, application, userId} = auth;
        const {requestId, threadId, branchId} = request;
        const appSlug = application?.url_slug;
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
            threadId: threadId,
            branchId: branchId,
        }) as NotificationEvent;
    }

    static fromRequest(type: NotificationEventType, request: HoloWorkerRequest, message: string, payload?: any, severity: NotificationSeverity = "info"): NotificationEvent {
        const {organizationId, userId, appSlug, requestId, threadId, branchId} = request;
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
            threadId: threadId,
            branchId: branchId,
        }) as NotificationEvent;
    }

    static fromProviderEvent(envelope: WorkerResponseEnvelope, event: ProviderDoneEvent | ProviderErrorEvent): NotificationEvent {

        return pickDefined({
            type: NotificationEventType.RESPONSE_COMPLETED,
            id: uuidv4(),
            ts: Date.now(),
            organizationId: envelope.organization_id,
            userId: envelope.user_id,
            appSlug: envelope.application?.url_slug,
            severity: event.type === ProviderEventType.ERROR ? 'error' : 'info',
            message: NotificationEventType.RESPONSE_COMPLETED,
            requestId: envelope.request_id,
            payload: pickDefined({
                status: event.type === ProviderEventType.DONE ? 'success' : 'error',
                eventType: event.type,
                error: event.type === ProviderEventType.ERROR ? event.error : undefined
            }),
            threadId: envelope.thread_id,
            branchId: envelope.branch_id
        }) as NotificationEvent;
    }
}
