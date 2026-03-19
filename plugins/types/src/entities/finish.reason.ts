export const FinishReason = {
    STOP: 'stop',
    TOOL_CALLS: 'tool_calls',
    LENGTH: 'length',
    CONTENT_FILTER: 'content_filter',
    ERROR: 'error',
} as const;

export type FinishReason = typeof FinishReason[keyof typeof FinishReason];
