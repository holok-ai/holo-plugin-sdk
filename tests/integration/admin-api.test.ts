import {beforeAll, describe, expect, it} from 'vitest';
import {HoloClient} from '../../src/client';
import {getTestConfig} from '@holokai/holo-test';

function client() {
    const {gatewayUrl, token} = getTestConfig();
    return new HoloClient({baseUrl: gatewayUrl, token});
}

describe('admin API', {timeout: 30_000}, () => {
    let c: HoloClient;

    beforeAll(() => {
        c = client();
    });

    describe('plugins', () => {
        it('list returns packages and plugins arrays', async () => {
            const result = await c.admin.plugins.list();
            expect(result.packages).toBeDefined();
            expect(result.plugins).toBeDefined();
            expect(Array.isArray(result.packages)).toBe(true);
        });

        it('status returns plugin info for known family', async () => {
            const result = await c.admin.plugins.status('claude');
            expect(result.plugin).toBeTruthy();
            expect(result.package).toBeTruthy();
        });

        it('status returns null for unknown family', async () => {
            const result = await c.admin.plugins.status('nonexistent');
            expect(result.plugin).toBeNull();
            expect(result.package).toBeNull();
        });
    });

    describe('providers', () => {
        it('list returns paginated providers', async () => {
            const result = await c.admin.providers.list();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('list with pagination params', async () => {
            const result = await c.admin.providers.list({page: 1, limit: 2});
            expect(result.success).toBe(true);
            expect(result.data.length).toBeLessThanOrEqual(2);
        });

        it('get returns provider by ID', async () => {
            const list = await c.admin.providers.list({limit: 1});
            if (list.data.length === 0) return;
            const provider = await c.admin.providers.get(list.data[0].id);
            expect(provider.success).toBe(true);
            expect(provider.data.id).toBe(list.data[0].id);
        });
    });

    describe('models', () => {
        it('list returns paginated models', async () => {
            const result = await c.admin.models.list();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('get returns model by ID', async () => {
            const list = await c.admin.models.list({limit: 1});
            if (list.data.length === 0) return;
            const model = await c.admin.models.get(list.data[0].id);
            expect(model.success).toBe(true);
            expect(model.data.id).toBe(list.data[0].id);
        });
    });

    describe('tokens', () => {
        let createdTokenId: string;

        it('create and list tokens', async () => {
            const created = await c.admin.tokens.create({name: 'sdk-test-token'});
            expect(created.token).toBeTruthy();
            expect(created.record).toBeTruthy();
            createdTokenId = created.record.id;

            const list = await c.admin.tokens.list();
            expect(Array.isArray(list)).toBe(true);
            const found = list.find((t: any) => t.id === createdTokenId);
            expect(found).toBeTruthy();
        });

        it('get token by ID', async () => {
            if (!createdTokenId) return;
            const token = await c.admin.tokens.get(createdTokenId);
            expect(token.id).toBe(createdTokenId);
        });

        it('delete token', async () => {
            if (!createdTokenId) return;
            const result = await c.admin.tokens.remove(createdTokenId);
            expect(result).toBeTruthy();
        });
    });

    describe('cache', () => {
        it('invalidate provider cache', async () => {
            const result = await c.admin.cache.invalidateProvider();
            expect(result.success).toBe(true);
        });
    });

    describe('requests', () => {
        it('list returns paginated audit requests', async () => {
            const result = await c.admin.requests.list();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });
    });

    describe('responses', () => {
        it('list returns paginated audit responses', async () => {
            const result = await c.admin.responses.list();
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        it('filters returns filter options', async () => {
            const result = await c.admin.responses.filters();
            expect(result.success).toBe(true);
        });
    });

    describe('datastores', () => {
        it('list returns array', async () => {
            const result = await c.admin.datastores.list();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('pricing', () => {
        it('recalculate returns result', async () => {
            const now = new Date();
            const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            const to = now.toISOString();
            const result = await c.admin.pricing.recalculate({from, to});
            expect(result.success).toBe(true);
        });
    });
});
