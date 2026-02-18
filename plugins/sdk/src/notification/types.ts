import {Auth, pickDefined} from "../core";
import {v4 as uuidv4} from "uuid";

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
    appSlug?: string;
    userId?: string;
    threadId?: string;
    requestId?: string;
    branchId?: string; // NEW

    type: NotificationEventType;
    severity: NotificationSeverity;
    message: string;
    payload?: unknown;
};

export class NotificationEventFactory {
    static fromAuth(type: NotificationEventType, auth: Auth, message: string, severity: NotificationSeverity = "info"): NotificationEvent {
        const {organizationId, app, userId} = auth;
        const appSlug = app?.urlSlug;
        return pickDefined({
            id: uuidv4(),
            ts: Date.now(),
            organizationId,
            userId,
            appSlug,
            type,
            severity,
            message
        }) as NotificationEvent;
    }
}

export type NotificationQuery = {
    organizationId: string;
    appSlug: string;

    threadIds?: string[];
    requestIds?: string[];
    branchIds?: string[]; // NEW
    types?: NotificationEventType[];

    // cursoring
    afterId?: string; // exclusive
    limit: number;
};

export type NotificationSubscribeFilter = Omit<NotificationQuery, "limit"> & {
    // Optional: allow "replay since last event id"
    limit?: number; // allow optional here for convenience in controller
};