import type {Request} from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
    sort_by: string;
    sort_dir: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    timestamp: string;
}

const ALLOWED_SORT_DIRS = new Set(['asc', 'desc']);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

export function parsePagination(req: Request, defaultSort = 'created_at'): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
    const sort_by = (req.query.sort_by as string) || defaultSort;
    const rawDir = (req.query.sort_dir as string)?.toLowerCase();
    const sort_dir = ALLOWED_SORT_DIRS.has(rawDir!) ? rawDir as 'asc' | 'desc' : 'desc';

    return {page, limit, offset: (page - 1) * limit, sort_by, sort_dir};
}

export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
    return {
        success: true,
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            total_pages: Math.ceil(total / params.limit),
        },
        timestamp: new Date().toISOString(),
    };
}
