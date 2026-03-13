import type {FixtureScenario} from '@holokai/test-harness';
import {LlmStatus} from '@holokai/types/entities';
import sdkAdapter from '../sdk-adapter.js';

const chunk1 = {
    id: 'chatcmpl-test-123',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model: 'gpt-4o',
    choices: [
        {
            index: 0,
            delta: {role: 'assistant', content: 'Hello'},
            finish_reason: null,
        }
    ],
};

const chunk2 = {
    id: 'chatcmpl-test-123',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model: 'gpt-4o',
    choices: [
        {
            index: 0,
            delta: {content: '! How can I help?'},
            finish_reason: null,
        }
    ],
};

const doneChunk = {
    id: 'chatcmpl-test-123',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model: 'gpt-4o',
    choices: [
        {
            index: 0,
            delta: {},
            finish_reason: 'stop',
        }
    ],
    usage: {
        prompt_tokens: 10,
        completion_tokens: 6,
        total_tokens: 16,
    },
};

const fixture: FixtureScenario = {
    name: 'openai/chat-simple.streaming',
    plugin: 'openai',
    protocol: 'openai.chatCompletions',
    streaming: true,

    providerChunks: [chunk1, chunk2, doneChunk],
    expectedText: 'Hello! How can I help?',

    expectedWire: [
        `data: ${JSON.stringify(chunk1)}\n\n`,
        `data: ${JSON.stringify(chunk2)}\n\n`,
        `data: ${JSON.stringify(doneChunk)}\n\n`,
        `data: [DONE]\n\n`,
    ],
    expectedStatus: 200,
    expectedHeaders: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    },

    expectedAudit: {
        access_model: 'gpt-4o',
        input_tokens: 10,
        output_tokens: 6,
        status: LlmStatus.SUCCESS,
    },

    sdkAdapter,
    sdkRequest: {
        model: 'gpt-4o',
        messages: [{role: 'user', content: 'Hello!'}],
    },
    expectedSdkResult: [
        {id: 'chatcmpl-test-123', model: 'gpt-4o'},
        {id: 'chatcmpl-test-123', model: 'gpt-4o'},
        {id: 'chatcmpl-test-123', model: 'gpt-4o'},
    ],

    tags: ['chat', 'streaming'],
};

export default fixture;
