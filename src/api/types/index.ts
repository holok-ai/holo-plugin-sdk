import {Request, Response} from 'express';

// Base API types
export interface ApiRequest extends Request {
    user?: {
        id: string;
        email: string;
        roles: string[];
    };
}

export interface ApiResponse<T = any> extends Response {
    json: (body: T) => this;
}

// Response types
export interface ApiSuccessResponse<T = any> {
    success: true;
    data: T;
    timestamp: string;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: any;
    };
    timestamp: string;
}

export type ApiResult<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Worker and monitoring types
export interface WorkerStatus {
    workerId: string;
    status: 'active' | 'idle' | 'error' | 'offline';
    currentTasks: number;
    totalProcessed: number;
    lastActivity: Date;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

export interface DashboardData {
    requestsPerMinute: number;
    activeWorkers: number;
    queueStatus: QueueStatus;
    errorRate: number;
}
