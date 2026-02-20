import {Auth, pickDefined} from "../core";
import {v4 as uuidv4} from "uuid";
import {HoloWorkerRequest} from "../core/worker";

export type NotificationSeverity = "info" | "warn" | "error";

export type NotificationEventType =
    | "guard_started"
    | "guard_passed"
    | "guard_failed"
    | "status"
    | "provider_request_started"
    | "provider_response_completed"
    | "provider_error";

export type NotificationEvent = {
    id: string; // ULID/UUIDv7/DB id used as SSE "id"
    ts: number; // epoch ms

    organizationId: string;
    userId: string;
    appSlug?: string;
    threadId?: string;
    requestId?: string;
    branchId?: string; // NEW

    type: NotificationEventType;
    severity: NotificationSeverity;
    message: string;
    payload?: unknown;
};

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

export type NotificationQuery = {
    organizationId: string;
    userId: string;
    appSlug?: string;

    threadIds?: string[];
    requestIds?: string[];
    branchIds?: string[];
    types?: NotificationEventType[];

    // cursoring
    afterId?: string; // exclusive
    limit: number;
};

export type NotificationSubscribeFilter = Omit<NotificationQuery, "limit"> & {
    // Optional: allow "replay since last event id"
    limit?: number; // allow optional here for convenience in controller
};