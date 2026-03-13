import type {FixtureScenario} from '@holokai/test-harness';
import {LlmStatus} from '@holokai/types/entities';

const completionResponse = {
    id: 'chatcmpl-test-123',
    object: 'chat.completion',
    created: 1700000000,
    model: 'gpt-4o',
    choices: [
        {
            index: 0,
            message: {
                role: 'assistant',
                content: 'Hello! How can I help you today?',
            },
            finish_reason: 'stop',
        }
    ],
    usage: {
        prompt_tokens: 10,
        completion_tokens: 8,
        total_tokens: 18,
    },
};

const fixture: FixtureScenario = {
    name: 'openai/chat-simple.nonstreaming',
    plugin: 'openai',
    protocol: 'openai.chatCompletions',
    streaming: false,

    providerChunks: [completionResponse],
    expectedText: 'Hello! How can I help you today?',

    expectedWire: [
        JSON.stringify(completionResponse),
    ],
    expectedStatus: 200,
    expectedHeaders: {'Content-Type': 'application/json'},

    expectedAudit: {
        access_model: 'gpt-4o',
        input_tokens: 10,
        output_tokens: 8,
        status: LlmStatus.SUCCESS,
    },

    tags: ['chat', 'nonstreaming'],
};

export default fixture;
