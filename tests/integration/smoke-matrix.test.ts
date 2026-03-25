import {beforeAll, describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import {discoverProviders, getTestConfig} from '@holokai/holo-test';
import type {DiscoveredProvider} from '@holokai/holo-test';

describe('sdk integration: smoke matrix', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    let providers: DiscoveredProvider[] = [];

    beforeAll(async () => {
        providers = await discoverProviders(client());
    });

    it('runs smoke test for each provider', async () => {
        expect(providers.length).toBeGreaterThan(0);

        for (const {family, model} of providers) {
            try {
                const res = await client().chat.create({
                    model,
                    messages: [{role: 'user', content: 'Say "ok"'}],
                    max_tokens: 5,
                });

                expect(res.id).toBeTruthy();
                expect(res.output).toBeDefined();
            } catch (e) {
                if (e instanceof HoloApiError && [400, 404, 429].includes(e.status)) {
                    continue;
                }
                throw e;
            }
        }
    });
});
