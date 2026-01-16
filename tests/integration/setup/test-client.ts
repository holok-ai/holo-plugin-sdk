/**
 * Integration Test HTTP Client
 *
 * Makes REAL HTTP requests to the running server.
 * NO MOCKING - this is the whole point of integration tests.
 */

import {IntegrationTestConfig} from './config';

export interface TestResponse<T = any> {
    status: number;
    data: T;
    headers: Record<string, string>;
}

export class TestClient {
    private config: IntegrationTestConfig;

    constructor(config: IntegrationTestConfig) {
        this.config = config;
    }

    /**
     * Make a POST request (non-streaming)
     */
    async post<T = any>(path: string, body: any, headers?: Record<string, string>): Promise<TestResponse<T>> {
        const url = `${this.config.baseUrl}${path}`;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.authToken}`,
            ...headers
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            let data: T;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                data = await response.json() as T;
            } else {
                data = await response.text() as T;
            }

            return {
                status: response.status,
                data,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.config.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Make a GET request
     */
    async get<T = any>(path: string, headers?: Record<string, string>): Promise<TestResponse<T>> {
        const url = `${this.config.baseUrl}${path}`;

        const requestHeaders: Record<string, string> = {
            'Authorization': `Bearer ${this.config.authToken}`,
            ...headers
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: requestHeaders,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json() as T;

            return {
                status: response.status,
                data,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.config.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Make a streaming POST request (SSE)
     * Collects all chunks and returns them
     */
    async stream(
        path: string,
        body: any,
        headers?: Record<string, string>
    ): Promise<string[]> {
        const url = `${this.config.baseUrl}${path}`;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.authToken}`,
            ...headers
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Stream request failed with status ${response.status}`);
        }

        if (!response.body) {
            throw new Error('No response body for stream');
        }

        const chunks: string[] = [];
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, {stream: true});
                chunks.push(chunk);
            }
        } finally {
            reader.releaseLock();
        }

        return chunks;
    }
}

/**
 * Wait for server to be ready
 * @returns true if server is ready, false if timeout
 */
export async function waitForServer(
    baseUrl: string,
    maxAttempts: number = 30,
    delayMs: number = 1000
): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });

            if (response.ok) {
                return true;
            }
        } catch (error) {
            // Server not ready yet, continue waiting
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    return false;
}
