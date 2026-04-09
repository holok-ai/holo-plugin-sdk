import {VERSION} from '../core/version';
import {HoloApiError, HoloTimeoutError} from './errors';

interface TransportRequestOptions {
    method: string;
    path: string;
    body?: unknown | undefined;
    signal?: AbortSignal | undefined;
    headers?: Record<string, string> | undefined;
}

interface TransportStreamOptions {
    path: string;
    body: unknown;
    signal?: AbortSignal | undefined;
    headers?: Record<string, string> | undefined;
}

interface TransportStreamResult {
    body: ReadableStream<Uint8Array>;
    response: Response;
}

// Internal interface — not exported from barrel.
// Future middleware (retries, logging, tracing, auth refresh) can implement this interface
// and wrap FetchTransport, forming a composable pipeline.
interface HoloTransport {
    request<T>(options: TransportRequestOptions): Promise<T>;

    streamRequest(options: TransportStreamOptions): Promise<TransportStreamResult>;
}

function getUserAgent(): string {
    return `holo-sdk-js/${VERSION}`;
}

class FetchTransport implements HoloTransport {
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly _fetch: typeof globalThis.fetch;
    private readonly timeout?: number;
    private readonly userAgent: string;

    constructor(options: {
        baseUrl: string;
        token: string;
        fetch?: typeof globalThis.fetch | undefined;
        timeout?: number | undefined;
    }) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.token = options.token;
        this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
        if (options.timeout !== undefined) this.timeout = options.timeout;
        this.userAgent = getUserAgent();
    }

    async request<T>(options: TransportRequestOptions): Promise<T> {
        const url = `${this.baseUrl}/holo/api/v1${options.path}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.token}`,
            'User-Agent': this.userAgent,
            ...options.headers,
        };
        const isBinary = options.body instanceof ArrayBuffer
            || options.body instanceof Uint8Array
            || (typeof Buffer !== 'undefined' && Buffer.isBuffer(options.body));
        if (options.body && !isBinary) headers['Content-Type'] = 'application/json';
        if (isBinary) headers['Content-Type'] = 'application/gzip';

        const init: RequestInit = {method: options.method, headers};
        if (options.body) init.body = isBinary ? options.body as BodyInit : JSON.stringify(options.body);

        const effectiveSignal = this.applyTimeout(options.signal);
        if (effectiveSignal) init.signal = effectiveSignal;

        try {
            const response = await this._fetch(url, init);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            return response.json() as Promise<T>;
        } catch (e) {
            throw this.classifyAbortError(e, options.signal);
        }
    }

    async streamRequest(options: TransportStreamOptions): Promise<TransportStreamResult> {
        const url = `${this.baseUrl}/holo/api/v1${options.path}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'User-Agent': this.userAgent,
            ...options.headers,
        };

        const init: RequestInit = {method: 'POST', headers, body: JSON.stringify(options.body)};

        const effectiveSignal = this.applyTimeout(options.signal);
        if (effectiveSignal) init.signal = effectiveSignal;

        try {
            const response = await this._fetch(url, init);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            if (!response.body) {
                throw new HoloApiError('No response body for stream', 500);
            }

            return {body: response.body, response};
        } catch (e) {
            throw this.classifyAbortError(e, options.signal);
        }
    }

    private async handleErrorResponse(response: Response): Promise<never> {
        let errorBody: unknown;
        let code: string | undefined;
        const text = await response.text();
        try {
            errorBody = JSON.parse(text);
            const body = errorBody as Record<string, unknown>;
            if (typeof body === 'object' && body !== null) {
                code = typeof body.code === 'string' ? body.code
                    : typeof body.error === 'object' && body.error !== null
                        ? String((body.error as Record<string, unknown>).code ?? '')
                        : undefined;
            }
        } catch {
            errorBody = text;
        }
        throw new HoloApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            code || undefined,
            errorBody,
        );
    }

    private applyTimeout(externalSignal?: AbortSignal): AbortSignal | undefined {
        if (!this.timeout && !externalSignal) return undefined;
        if (!this.timeout) return externalSignal;

        const timeoutSignal = AbortSignal.timeout(this.timeout);
        if (!externalSignal) return timeoutSignal;

        return AbortSignal.any([externalSignal, timeoutSignal]);
    }

    private classifyAbortError(e: unknown, externalSignal?: AbortSignal): unknown {
        if (e instanceof HoloApiError || e instanceof HoloTimeoutError) return e;

        if (e instanceof DOMException && e.name === 'AbortError') {
            if (externalSignal?.aborted) return e;
            if (this.timeout) return new HoloTimeoutError(this.timeout);
        }
        if (e instanceof DOMException && e.name === 'TimeoutError') {
            if (this.timeout) return new HoloTimeoutError(this.timeout);
        }

        return e;
    }
}

export {FetchTransport};
export type {HoloTransport, TransportRequestOptions, TransportStreamOptions, TransportStreamResult};
