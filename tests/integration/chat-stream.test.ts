import {beforeAll, describe, expect, it} from 'vitest';
import {client, getModel, skipOnRateLimit} from './test-providers';

describe('sdk integration: chat.stream', () => {
    let model: string;
    beforeAll(async () => { model = await getModel(); });

    it('streams and produces a final response', async () => {
        try {
            const stream = await client().chat.stream({
                model,
                messages: [{role: 'user', content: 'Say hello in exactly one word.'}],
                max_tokens: 10,
            });

            const res = await stream.finalResponse();
            expect(res.id).toBeTruthy();
            expect(res.finish_reason).toBeTruthy();
            expect(res.usage).toBeDefined();
        } catch (e) {
            skipOnRateLimit(e);
        }
    });

    it('create and stream both return output', async () => {
        try {
            const params = {
                model,
                messages: [{role: 'user' as const, content: 'Say hello in one word.'}],
                max_tokens: 10,
            };

            const c = client();
            const createRes = await c.chat.create(params);
            const streamRes = await (await c.chat.stream(params)).finalResponse();

            expect(createRes.output.length).toBeGreaterThan(0);
            expect(streamRes.finish_reason).toBeTruthy();
        } catch (e) {
            skipOnRateLimit(e);
        }
    });
});
