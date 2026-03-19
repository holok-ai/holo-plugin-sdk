import type {FixtureScenario} from '@holokai/test-harness';
import {ProviderResponseStatus} from '@holokai/types/entities';

const responsePayload = {
    id: 'resp-test-456',
    object: 'response',
    created_at: 1700000000,
    model: 'gpt-4o',
    output: [
        {
            type: 'message',
            id: 'msg-test-1',
            role: 'assistant',
            content: [
                {
                    type: 'output_text',
                    text: 'Hello from the Responses API!',
                }
            ],
        }
    ],
    usage: {
        input_tokens: 12,
        output_tokens: 7,
        total_tokens: 19,
    },
};

const fixture: FixtureScenario = {
    name: 'openai/response-simple.nonstreaming',
    plugin: 'openai',
    protocol: 'openai.responses',
    streaming: false,

    providerChunks: [responsePayload],
    expectedText: 'Hello from the Responses API!',

    expectedWire: [
        JSON.stringify(responsePayload),
    ],
    expectedStatus: 200,
    expectedHeaders: {'Content-Type': 'application/json'},

    expectedAudit: {
        access_model: 'gpt-4o',
        status: ProviderResponseStatus.SUCCESS,
    },

    tags: ['responses', 'nonstreaming'],
};

export default fixture;
