import {Response} from 'express';

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