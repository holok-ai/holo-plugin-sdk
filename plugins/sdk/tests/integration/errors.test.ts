import {describe, it, expect} from 'vitest';
import {HoloClient} from '../../src/client/client.js';
import {HoloApiError} from '../../src/client/errors.js';
import {getTestConfig} from '@holokai/test-utils';

describe('sdk integration: errors', () => {
    it('rejects bad token with 4xx', async () => {
        const {gatewayUrl} = getTestConfig();
        const client = new HoloClient({baseUrl: gatewayUrl, token: 'invalid-token'});

        const err = await client.chat.create({
            model: 'gpt-4o',
            messages: [{role: 'user', content: 'hi'}],
        }).catch((e: unknown) => e) as HoloApiError;

        expect(err).toBeInstanceOf(HoloApiError);
        expect(err.status).toBeGreaterThanOrEqual(400);
        expect(err.status).toBeLessThan(500);
    });

    it('rejects bad model', async () => {
        const {gatewayUrl, token} = getTestConfig();
        const client = new HoloClient({baseUrl: gatewayUrl, token});

        const err = await client.chat.create({
            model: 'nonexistent-model-xyz',
            messages: [{role: 'user', content: 'hi'}],
        }).catch((e: unknown) => e) as HoloApiError;

        expect(err).toBeInstanceOf(HoloApiError);
        expect(err.status).toBeGreaterThanOrEqual(400);
        expect(err.status).toBeLessThan(500);
    });
});
