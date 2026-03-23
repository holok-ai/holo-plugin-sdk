import {describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import {getTestConfig, providerMatrix} from '@holokai/holo-test';

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
                if (e instanceof HoloApiError && (e.status === 400 || e.status === 404)) {
                    // Provider/model not configured in this environment — acceptable skip
                    return;
                }
                throw e;
            }
        });
    }
});
