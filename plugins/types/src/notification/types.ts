export type NotificationSeverity = "info" | "warn" | "error";


export const NotificationEventType = {
    REQUEST_STARTED: 'request_started',
    GUARD_STARTED: 'guard_started',
    GUARD_PASSED: 'guard_passed',
    GUARD_FAILED: 'guard_failed',
    STATUS: 'status',
    PROVIDER_REQUEST_STARTED: 'provider_request_started',
    PROVIDER_RESPONSE_COMPLETED: 'provider_response_completed',
    RESPONSE_COMPLETED: 'response_completed',
    PROVIDER_ERROR: 'provider_error',
} as const;

export type NotificationEventType = typeof NotificationEventType[keyof typeof NotificationEventType];

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
