import {beforeAll, describe, expect, it} from 'vitest';
import {client, getModel, skipOnRateLimit} from './test-providers';

describe('sdk integration: chat.create', () => {
    let model: string;
    beforeAll(async () => { model = await getModel(); });

    it('returns a complete response', async () => {
        try {
            const res = await client().chat.create({
                model,
                messages: [{role: 'user', content: 'Say hello in exactly one word.'}],
                max_tokens: 10,
            });

            expect(res.id).toBeTruthy();
            expect(res.output).toBeDefined();
            expect(res.output.length).toBeGreaterThan(0);
            expect(res.finish_reason).toBe('stop');
            expect(res.usage).toBeDefined();
        } catch (e) {
            skipOnRateLimit(e);
        }
    });
});
