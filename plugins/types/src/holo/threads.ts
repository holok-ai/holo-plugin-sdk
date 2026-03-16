export type HoloThreadStatus = 'active' | 'archived' | 'deleted';
export type HoloThreadType = 'personal' | 'project';

export interface HoloThread {
    id: string;
    title: string;
    description: string;
    type: HoloThreadType;
    status: HoloThreadStatus;
    project_id: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface HoloThreadMessage {
    id: string;
    request_id: string;
    thread_id: string;
    branch_id: string | null;
    model: string | null;
    provider: string | null;
    role: string;
    user_prompt: string | null;
    response: string | null;
    status: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
    cost: number | null;
    created_at: string;
}

export interface HoloThreadCreateParams {
    title: string;
    description?: string;
    type?: HoloThreadType;
    project_id?: string | null;
    metadata?: Record<string, unknown>;
}

export interface HoloThreadUpdateParams {
    title?: string;
    status?: HoloThreadStatus;
    metadata?: Record<string, unknown>;
}

export interface HoloThreadListParams {
    type?: HoloThreadType;
    project_id?: string;
    page?: number;
    size?: number;
}

export interface HoloThreadMessageListParams {
    page?: number;
    size?: number;
}

export interface HoloPagedResponse<T> {
    data: T[];
    page: number;
    size: number;
    total: number;
}
