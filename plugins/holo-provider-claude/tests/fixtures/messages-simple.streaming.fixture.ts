import type {FixtureScenario} from '@holokai/test-harness';
import {ProviderResponseStatus} from '@holokai/types/entities';

const chunk1 = {
    type: 'content_block_start',
    index: 0,
    content_block: {type: 'text', text: ''},
};

const chunk2 = {
    type: 'content_block_delta',
    index: 0,
    delta: {type: 'text_delta', text: 'Hello! How can '},
};

const chunk3 = {
    type: 'content_block_delta',
    index: 0,
    delta: {type: 'text_delta', text: 'I assist you?'},
};

const doneChunk = {
    type: 'message_delta',
    delta: {stop_reason: 'end_turn', stop_sequence: null},
    usage: {output_tokens: 8},
};

const fixture: FixtureScenario = {
    name: 'claude/messages-simple.streaming',
    plugin: 'claude',
    protocol: 'claude.messages',
    streaming: true,

    providerChunks: [chunk1, chunk2, chunk3, doneChunk],
    expectedText: 'Hello! How can I assist you?',

    expectedWire: [
        `event: content_block_start\ndata: ${JSON.stringify(chunk1)}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify(chunk2)}\n\n`,
        `event: content_block_delta\ndata: ${JSON.stringify(chunk3)}\n\n`,
        `event: message_delta\ndata: ${JSON.stringify(doneChunk)}\n\n`,
    ],
    expectedStatus: 200,
    expectedHeaders: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    },

    expectedAudit: {
        access_model: 'claude-sonnet-4-20250514',
        status: ProviderResponseStatus.SUCCESS,
    },

    tags: ['messages', 'streaming'],
};

export default fixture;
