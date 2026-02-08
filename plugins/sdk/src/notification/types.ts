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
    id: string;                 // ULID/UUIDv7/DB id used as SSE "id"
    ts: number;                 // epoch ms (simpler than ISO; convert in client if desired)
    organizationId: string;
    appSlug: string;

    userId?: string;
    threadId?: string;
    requestId?: string;

    type: NotificationEventType;
    severity: NotificationSeverity;
    message: string;
    payload?: unknown;
};

export type NotificationQuery = {
    organizationId: string;
    appSlug: string;

    threadIds?: string[];
    requestIds?: string[];
    types?: NotificationEventType[];

    // cursoring
    afterId?: string;   // exclusive
    limit: number;
};

export type NotificationSubscribeFilter = Omit<NotificationQuery, "afterId" | "limit"> & {
    // Optional: allow "replay since last event id"
    afterId?: string;
};