export const HoloErrorCode = {
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
    VALIDATION_ERROR: 'validation_error',
    NOT_FOUND: 'not_found',
    GUARD_FAILURE: 'guard_failure',
    INTERNAL_ERROR: 'internal_error',
    TIMEOUT: 'timeout',
} as const;

export type HoloErrorCode = typeof HoloErrorCode[keyof typeof HoloErrorCode];
