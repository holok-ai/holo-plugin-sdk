import {describe, it, expect} from 'vitest';
import {HoloClient} from '../../src/client/client.js';
import {HoloApiError} from '../../src/client/errors.js';
import {getTestConfig, providerMatrix} from '@holokai/test-utils';

describe('sdk integration: smoke matrix', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    for (const {family, model} of providerMatrix) {
        it(`${family}: minimal prompt`, async () => {
            try {
                const res = await client().chat.create({
                    model,
                    messages: [{role: 'user', content: 'Say "ok"'}],
                    max_tokens: 5,
                });

                expect(res.id).toBeTruthy();
                expect(res.output).toBeDefined();
            } catch (e) {
                if (e instanceof HoloApiError && e.status === 400) {
                    // Provider not configured in this environment — acceptable skip
                    return;
                }
                throw e;
            }
        });
    }
});
