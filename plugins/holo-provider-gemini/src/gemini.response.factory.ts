import {pickDefined} from '@holokai/sdk';
import type {IResponseFactory} from '@holokai/types/provider';
import type {HoloErrorCode} from '@holokai/types/holo';

export type GeminiErrorStatus =
    'INVALID_ARGUMENT'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'RESOURCE_EXHAUSTED'
    | 'UNAUTHENTICATED'
    | 'INTERNAL'
    | 'UNAVAILABLE';

export interface GeminiErrorResponse {
    error: {
        code: number;
        message: string;
        status: GeminiErrorStatus;
    };
}

export interface GeminiCandidate {
    content: {
        parts: Array<{ text: string }>;
        role: string;
    };
    finishReason?: string;
    index: number;
}

export interface GeminiUsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
}

export interface GenerateContentResponse {
    candidates: GeminiCandidate[];
    usageMetadata: GeminiUsageMetadata;
    modelVersion?: string;
}

export class GeminiResponseFactory implements IResponseFactory {

    static streamResponseMessage(text: string | string[] = '') {
        const messages: Partial<GenerateContentResponse>[] = [];

        if (Array.isArray(text)) {
            text.forEach(t => {
                messages.push(this.createStreamChunk(t));
            });
        } else {
            messages.push(this.createStreamChunk(text));
        }

        messages.push(this.createFinalChunk());

        return messages;
    }

    static createResponseMessage(text: string | string[] = ''): Partial<GenerateContentResponse> {
        const parts = Array.isArray(text)
            ? text.map(t => ({text: t}))
            : [{text}];

        return pickDefined({
            candidates: [{
                content: {
                    parts,
                    role: 'model'
                },
                finishReason: 'STOP',
                index: 0
            }],
            usageMetadata: this.createUsageMetadata()
        });
    }

    static createStreamChunk(text: string): Partial<GenerateContentResponse> {
        return pickDefined({
            candidates: [{
                content: {
                    parts: [{text}],
                    role: 'model'
                },
                index: 0
            }]
        });
    }

    static createFinalChunk(): Partial<GenerateContentResponse> {
        return pickDefined({
            candidates: [{
                content: {
                    parts: [{text: ''}],
                    role: 'model'
                },
                finishReason: 'STOP',
                index: 0
            }],
            usageMetadata: this.createUsageMetadata()
        });
    }

    static createUsageMetadata(): GeminiUsageMetadata {
        return {
            promptTokenCount: 0,
            candidatesTokenCount: 0,
            totalTokenCount: 0
        };
    }

    static instance(): GeminiResponseFactory {
        return new GeminiResponseFactory();
    }

    mapHoloCode(code: HoloErrorCode): GeminiErrorStatus {
        switch (code) {
            case 'guard_failure':
                return 'INVALID_ARGUMENT';
        }
    }

    createError(message: string, code: HoloErrorCode): GeminiErrorResponse {
        const status = this.mapHoloCode(code);
        return {
            error: {
                code: this.statusToHttpCode(status),
                message,
                status
            }
        };
    }

    private statusToHttpCode(status: GeminiErrorStatus): number {
        switch (status) {
            case 'INVALID_ARGUMENT':
                return 400;
            case 'UNAUTHENTICATED':
                return 401;
            case 'PERMISSION_DENIED':
                return 403;
            case 'NOT_FOUND':
                return 404;
            case 'RESOURCE_EXHAUSTED':
                return 429;
            case 'INTERNAL':
                return 500;
            case 'UNAVAILABLE':
                return 503;
        }
    }
}
