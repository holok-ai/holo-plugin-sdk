import {describe, it, expect, vi} from 'vitest';
import {HoloClient} from '../../src/client/client.js';
import {HoloApiError} from '../../src/client/errors.js';

function mockFetchOk(body: unknown) {
    return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
    }));
}

function mockFetchError(status: number, body: unknown) {
    return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
        status,
        statusText: 'Error',
        headers: {'Content-Type': 'application/json'},
    }));
}

describe('HoloClient', () => {
    describe('URL normalization', () => {
        it('strips trailing slashes from baseUrl', async () => {
            const fetchFn = mockFetchOk({success: true, data: []});
            const client = new HoloClient({baseUrl: 'https://holo.example.com/', token: 'tok', fetch: fetchFn});
            await client.models.list();
            const url = fetchFn.mock.calls[0]![0] as string;
            expect(url).toBe('https://holo.example.com/holo/api/v1/models');
        });

        it('strips multiple trailing slashes', async () => {
            const fetchFn = mockFetchOk({success: true, data: []});
            const client = new HoloClient({baseUrl: 'https://holo.example.com///', token: 'tok', fetch: fetchFn});
            await client.models.list();
            const url = fetchFn.mock.calls[0]![0] as string;
            expect(url).toBe('https://holo.example.com/holo/api/v1/models');
        });
    });

    describe('getDefaults()', () => {
        it('returns empty when no defaults set', () => {
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'tok', fetch: vi.fn()});
            expect(client.getDefaults()).toEqual({});
        });

        it('returns model and application when set', () => {
            const client = new HoloClient({
                baseUrl: 'http://localhost', token: 'tok', fetch: vi.fn(),
                defaultModel: 'gpt-4o', defaultApplication: 'my-app',
            });
            expect(client.getDefaults()).toEqual({model: 'gpt-4o', application: 'my-app'});
        });
    });

    describe('request()', () => {
        it('sends GET with auth header', async () => {
            const fetchFn = mockFetchOk({success: true, data: []});
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'my-token', fetch: fetchFn});
            await client.request('GET', '/models');

            const [, init] = fetchFn.mock.calls[0]!;
            expect(init.method).toBe('GET');
            expect(init.headers['Authorization']).toBe('Bearer my-token');
        });

        it('sends POST with JSON body', async () => {
            const fetchFn = mockFetchOk({model: 'gpt-4o', output: [], created: 1, finish_reason: null, usage: {}});
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'tok', fetch: fetchFn});
            const body = {model: 'gpt-4o', messages: [{role: 'user', content: 'hi'}]};
            await client.request('POST', '/chat', body);

            const [, init] = fetchFn.mock.calls[0]!;
            expect(init.method).toBe('POST');
            expect(JSON.parse(init.body)).toEqual(body);
        });

        it('throws HoloApiError on non-2xx response', async () => {
            const fetchFn = mockFetchError(401, {error: 'unauthorized'});
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'bad', fetch: fetchFn});

            const err = await client.request('GET', '/models').catch((e: unknown) => e) as HoloApiError;
            expect(err).toBeInstanceOf(HoloApiError);
            expect(err.status).toBe(401);
            expect(err.body).toEqual({error: 'unauthorized'});
        });
    });

    describe('streamRequest()', () => {
        it('returns body stream on success', async () => {
            const stream = new ReadableStream({start(c) { c.close(); }});
            const fetchFn = vi.fn().mockResolvedValue(new Response(stream, {status: 200}));
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'tok', fetch: fetchFn});

            const result = await client.streamRequest('/chat', {model: 'gpt-4o', messages: []});
            expect(result.body).toBeInstanceOf(ReadableStream);
        });

        it('throws HoloApiError on error response', async () => {
            const fetchFn = mockFetchError(500, {error: 'internal'});
            const client = new HoloClient({baseUrl: 'http://localhost', token: 'tok', fetch: fetchFn});

            await expect(client.streamRequest('/chat', {})).rejects.toThrow(HoloApiError);
        });
    });
});
