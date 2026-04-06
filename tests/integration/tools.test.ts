import {beforeAll, describe, expect, it} from 'vitest';
import {client, getModel, skipOnRateLimit} from './test-providers';
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
    let model: string;
    beforeAll(async () => { model = await getModel(); });

    it('runner executes tool loop', async () => {
        try {
            const runner = client().chat.runner({
                model,
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
            skipOnRateLimit(e);
        }
    });
});
