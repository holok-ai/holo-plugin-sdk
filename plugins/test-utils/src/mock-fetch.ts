interface MockResponse {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
}

export function createMockFetch(responses: MockResponse[]): typeof globalThis.fetch {
    let callIndex = 0;

    return async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
        const mock = responses[callIndex++];
        if (!mock) throw new Error(`No mock response for call ${callIndex - 1}`);

        const status = mock.status ?? 200;
        const statusText = mock.statusText ?? 'OK';
        const headers = new Headers(mock.headers);

        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const body = typeof mock.body === 'string' ? mock.body : JSON.stringify(mock.body);

        return new Response(body, {status, statusText, headers});
    };
}

export function createSseMockFetch(chunks: string[]): typeof globalThis.fetch {
    return async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk));
                }
                controller.close();
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {'Content-Type': 'text/event-stream'},
        });
    };
}
