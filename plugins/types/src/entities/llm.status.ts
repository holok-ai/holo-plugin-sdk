export const LlmStatus = {
    SUCCESS: 'success',
    ERROR: 'error',
    TIMEOUT: 'timeout',
    PARTIAL: 'partial',
    RATE_LIMITED: 'rate_limited',
    INVALID_REQUEST: 'invalid_request'
} as const;

export type LlmStatus = typeof LlmStatus[keyof typeof LlmStatus];
