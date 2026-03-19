/** Thrown when the Holo API returns a non-2xx HTTP response. */
export class HoloApiError extends Error {
    readonly status: number;
    readonly code?: string;
    /** The parsed response body, if available. */
    readonly body?: unknown;

    constructor(message: string, status: number, code?: string, body?: unknown) {
        super(message);
        this.name = 'HoloApiError';
        this.status = status;
        if (code) this.code = code;
        if (body !== undefined) this.body = body;
    }
}

/** Thrown when a streaming response encounters a protocol-level error. */
export class HoloStreamError extends Error {
    /** The raw SSE event that triggered the error, if available. */
    readonly event?: unknown;

    constructor(message: string, event?: unknown) {
        super(message);
        this.name = 'HoloStreamError';
        this.event = event;
    }
}

/** Thrown when a request exceeds the configured timeout. */
export class HoloTimeoutError extends Error {
    readonly timeoutMs: number;

    constructor(timeoutMs: number) {
        super(`Request timed out after ${timeoutMs}ms`);
        this.name = 'HoloTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
