export interface Notification {
    id: string;
    ts: number;
    organization_id: string;
    app_slug: string;
    user_id: string | null;
    thread_id: string | null;
    request_id: string | null;
    branch_id: string | null;
    type: string;
    severity: string;
    message: string;
    payload: any | null;
}
