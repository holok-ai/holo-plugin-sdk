import type {FixtureScenario} from '@holokai/test-harness';
import {ProviderResponseStatus} from '@holokai/types/entities';

const streamEvent1 = {
    type: 'response.output_item.added',
    item: {
        type: 'message',
        id: 'msg-test-1',
        role: 'assistant',
        content: [],
    },
};

const streamEvent2 = {
    type: 'response.output_text.delta',
    delta: 'Hello from ',
};

const streamEvent3 = {
    type: 'response.output_text.delta',
    delta: 'streaming!',
};

const doneEvent = {
    type: 'response.completed',
    response: {
        id: 'resp-test-789',
        object: 'response',
        model: 'gpt-4o',
        output: [
            {
                type: 'message',
                id: 'msg-test-1',
                role: 'assistant',
                content: [{type: 'output_text', text: 'Hello from streaming!'}],
            }
        ],
        usage: {
            input_tokens: 15,
            output_tokens: 4,
            total_tokens: 19,
        },
    },
};

const fixture: FixtureScenario = {
    name: 'openai/response-simple.streaming',
    plugin: 'openai',
    protocol: 'openai.responses',
    streaming: true,

    providerChunks: [streamEvent1, streamEvent2, streamEvent3, doneEvent],
    expectedText: 'Hello from streaming!',

    expectedWire: [
        `event: response.output_item.added\ndata: ${JSON.stringify(streamEvent1)}\n\n`,
        `event: response.output_text.delta\ndata: ${JSON.stringify(streamEvent2)}\n\n`,
        `event: response.output_text.delta\ndata: ${JSON.stringify(streamEvent3)}\n\n`,
        `event: response.completed\ndata: ${JSON.stringify(doneEvent)}\n\n`,
    ],
    expectedStatus: 200,
    expectedHeaders: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    },

    expectedAudit: {
        access_model: 'gpt-4o',
        input_tokens: 15,
        output_tokens: 4,
        status: ProviderResponseStatus.SUCCESS,
    },

    tags: ['responses', 'streaming'],
};

export default fixture;
