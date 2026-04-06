import {beforeAll, describe, expect, it} from 'vitest';
import {client, getModel, skipOnRateLimit} from './test-providers';

describe('sdk integration: cancellation', () => {
    let model: string;
    beforeAll(async () => { model = await getModel(); });

    it('abort mid-stream does not throw unhandled errors', async () => {
        try {
            const stream = await client().chat.stream({
                model,
                messages: [{role: 'user', content: 'Write a very long essay about the history of computing.'}],
                max_tokens: 500,
            });

            let eventCount = 0;
            for await (const _event of stream) {
                eventCount++;
                if (eventCount >= 2) {
                    stream.abort();
                    break;
                }
            }

            expect(eventCount).toBeGreaterThanOrEqual(1);
        } catch (e) {
            skipOnRateLimit(e);
        }
    });
});
