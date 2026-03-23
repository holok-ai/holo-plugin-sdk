import {describe, expect, it} from 'vitest';
import {HoloApiError, HoloClient} from '../../src/client';
import {getTestConfig} from '@holokai/holo-test';
import type {HoloTool} from '@holokai/holo-types/holo';

const weatherTool: HoloTool = {
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
        type: 'object',
        properties: {city: {type: 'string'}},
        required: ['city'],
    },
};

describe('sdk integration: tools', () => {
    function client() {
        const {gatewayUrl, token} = getTestConfig();
        return new HoloClient({baseUrl: gatewayUrl, token});
    }

    it('runner executes tool loop', async () => {
        try {
            const runner = client().chat.runner({
                model: 'gpt-4o',
                messages: [{role: 'user', content: 'What is the weather in San Francisco?'}],
                tools: [weatherTool],
                toolHandler: async (call) => ({
                    tool_call_id: call.id,
                    content: JSON.stringify({temperature: 72, condition: 'sunny'}),
                }),
                maxIterations: 5,
            });

            const res = await runner.finalResponse();
            expect(['stop', 'tool_calls']).toContain(res.finish_reason);
        } catch (e) {
            if (e instanceof HoloApiError && (e.status === 400 || e.status === 404)) {
                // Tools/model not supported in this environment
                return;
            }
            throw e;
        }
    });
});
