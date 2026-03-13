import OpenAI from 'openai';
import type {ChatCompletionCreateParamsStreaming} from 'openai/resources/chat/completions';
import type {ResponseCreateParamsStreaming} from 'openai/resources/responses/responses';
import type {SdkAdapter, FixtureScenario} from '@holokai/test-harness';

const adapter: SdkAdapter = {
    family: 'openai',

    async call(fixture: FixtureScenario, port: number) {
        const client = new OpenAI({
            apiKey: 'test-key',
            baseURL: `http://localhost:${port}/v1`,
        });

        if (fixture.protocol === 'openai.chatCompletions') {
            if (fixture.streaming) {
                const stream = await client.chat.completions.create({
                    ...fixture.sdkRequest,
                    stream: true,
                } as ChatCompletionCreateParamsStreaming);
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return chunks;
            }
            return client.chat.completions.create({
                ...fixture.sdkRequest,
                stream: false,
            });
        }

        if (fixture.protocol === 'openai.responses') {
            if (fixture.streaming) {
                const stream = await client.responses.create({
                    ...fixture.sdkRequest,
                    stream: true,
                } as ResponseCreateParamsStreaming);
                const events = [];
                for await (const event of stream) {
                    events.push(event);
                }
                return events;
            }
            return client.responses.create({
                ...fixture.sdkRequest,
                stream: false,
            });
        }

        throw new Error(`Unsupported protocol: ${fixture.protocol}`);
    },

    routes(fixture: FixtureScenario) {
        if (fixture.protocol === 'openai.chatCompletions') {
            return {method: 'POST', path: '/v1/chat/completions'};
        }
        if (fixture.protocol === 'openai.responses') {
            return {method: 'POST', path: '/v1/responses'};
        }
        return undefined;
    },
};

export default adapter;
