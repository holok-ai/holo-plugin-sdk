import {describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import {getTestConfig} from '@holokai/holo-test';

describe('sdk integration: cancellation', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    it('abort mid-stream does not throw unhandled errors', async () => {
        try {
        const stream = await client().chat.stream({
            model: 'gpt-4o',
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
            if (e instanceof HoloApiError && e.status === 429) return;
            throw e;
        }
    });
});
