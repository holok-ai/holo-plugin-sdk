import type {FixtureScenario} from '@holokai/test-harness';
import {LlmStatus} from '@holokai/types/entities';

const messageResponse = {
    id: 'msg-test-123',
    type: 'message',
    role: 'assistant',
    content: [
        {
            type: 'text',
            text: 'Hello! How can I assist you today?',
        }
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
        input_tokens: 12,
        output_tokens: 10,
    },
};

const fixture: FixtureScenario = {
    name: 'claude/messages-simple.nonstreaming',
    plugin: 'claude',
    protocol: 'claude.messages',
    streaming: false,

    providerChunks: [messageResponse],
    expectedText: 'Hello! How can I assist you today?',

    expectedWire: [
        JSON.stringify(messageResponse),
    ],
    expectedStatus: 200,
    expectedHeaders: {'Content-Type': 'application/json'},

    expectedAudit: {
        access_model: 'claude-sonnet-4-20250514',
        input_tokens: 12,
        output_tokens: 10,
        status: LlmStatus.SUCCESS,
    },

    tags: ['messages', 'nonstreaming'],
};

export default fixture;
