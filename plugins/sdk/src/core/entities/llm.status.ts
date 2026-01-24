// Enum for LLM response status matching database llm_status type
export enum LlmStatus {
    SUCCESS = 'success',
    ERROR = 'error',
    TIMEOUT = 'timeout',
    PARTIAL = 'partial',
    RATE_LIMITED = 'rate_limited',
    INVALID_REQUEST = 'invalid_request'
}