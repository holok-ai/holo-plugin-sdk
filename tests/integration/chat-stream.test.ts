import {describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import {getTestConfig} from '@holokai/holo-test';

describe('sdk integration: chat.stream', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    it('streams and produces a final response', async () => {
        try {
            const stream = await client().chat.stream({
                model: 'gpt-4o',
                messages: [{role: 'user', content: 'Say hello in exactly one word.'}],
                max_tokens: 10,
            });

            const res = await stream.finalResponse();
            expect(res.id).toBeTruthy();
            expect(res.finish_reason).toBeTruthy();
            expect(res.usage).toBeDefined();
        } catch (e) {
            if (e instanceof HoloApiError && e.status === 429) return;
            throw e;
        }
    });

    it('create and stream both return output', async () => {
        try {
            const params = {
                model: 'gpt-4o',
                messages: [{role: 'user' as const, content: 'Say hello in one word.'}],
                max_tokens: 10,
            };

            const c = client();
            const createRes = await c.chat.create(params);
            const streamRes = await (await c.chat.stream(params)).finalResponse();

            expect(createRes.output.length).toBeGreaterThan(0);
            expect(streamRes.finish_reason).toBeTruthy();
        } catch (e) {
            if (e instanceof HoloApiError && e.status === 429) return;
            throw e;
        }
    });
});
