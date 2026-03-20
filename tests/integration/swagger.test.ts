import {describe, expect, it} from 'vitest';
import {gatewayUrl} from '@holokai/test-sdk';

describe('sdk integration: swagger', () => {
    const base = gatewayUrl();

    it('serves Swagger UI at /api-docs', async () => {
        const res = await fetch(`${base}/api-docs/`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        const html = await res.text();
        expect(html).toContain('swagger-ui');
    });

    it('serves OpenAPI spec at /api-docs/spec.json', async () => {
        const res = await fetch(`${base}/api-docs/spec.json`);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('application/json');

        const spec = await res.json();
        expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
        expect(spec.info.title).toBe('Holo Gateway API');
        expect(spec.paths).toBeDefined();
        expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
    });

    it('spec defines expected endpoint groups', async () => {
        const res = await fetch(`${base}/api-docs/spec.json`);
        const spec = await res.json();
        const paths = Object.keys(spec.paths);

        expect(paths).toEqual(expect.arrayContaining([
            '/chat',
            '/models',
            '/applications',
        ]));
    });
});
