export type NotificationSeverity = "info" | "warn" | "error";

export type NotificationEventType =
    | "request_started"
    | "guard_started"
    | "guard_passed"
    | "guard_failed"
    | "status"
    | "provider_request_started"
    | "provider_response_completed"
    | "response_completed"
    | "provider_error";

export interface NotificationEvent {
    id: string;
    ts: number;

    organizationId: string;
    userId: string;
    appSlug?: string;
    threadId?: string;
    requestId?: string;
    branchId?: string;

    type: NotificationEventType;
    severity: NotificationSeverity;
    message: string;
    payload?: unknown;
}

export interface NotificationQuery {
    organizationId: string;
    userId: string;
    appSlug?: string;

    threadIds?: string[];
    requestIds?: string[];
    branchIds?: string[];
    types?: NotificationEventType[];

    afterId?: string;
    limit: number;
}

export type NotificationSubscribeFilter = Omit<NotificationQuery, "limit"> & {
    limit?: number;
};

export interface INotificationSub {
    id: string;
    filter: NotificationSubscribeFilter;
    q: AsyncIterable<NotificationEvent>;
    appSlug?: string;
}

export interface INotificationService {
    publish(event: NotificationEvent): Promise<void>;

    subscribe(filter: NotificationSubscribeFilter): Promise<INotificationSub>;

    unsubscribe(id: string): Promise<boolean>;
}

export interface INotificationStore {
    query(params: NotificationQuery): Promise<NotificationEvent[]>;

    insert(event: NotificationEvent): Promise<void>;
}
