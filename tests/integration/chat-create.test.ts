import {describe, expect, it} from 'vitest';
import {HoloClient} from '../../src/client';
import {getTestConfig} from '@holokai/holo-test';

describe('sdk integration: chat.create', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    it('returns a complete response', async () => {
        const res = await client().chat.create({
            model: 'gpt-4o',
            messages: [{role: 'user', content: 'Say hello in exactly one word.'}],
            max_tokens: 10,
        });

        expect(res.id).toBeTruthy();
        expect(res.output).toBeDefined();
        expect(res.output.length).toBeGreaterThan(0);
        expect(res.finish_reason).toBe('stop');
        expect(res.usage).toBeDefined();
        expect(res.usage?.input_tokens).toBeGreaterThan(0);
        expect(res.usage?.output_tokens).toBeGreaterThan(0);
    });
});
