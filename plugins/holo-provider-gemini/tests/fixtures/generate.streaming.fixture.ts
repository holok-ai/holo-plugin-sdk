import type {FixtureScenario} from '@holokai/test-harness';
import {ProviderResponseStatus} from '@holokai/types/entities';

const chunk1 = {
    candidates: [
        {
            content: {
                parts: [{text: 'Hello! '}],
                role: 'model',
            },
            index: 0,
        }
    ],
};

const chunk2 = {
    candidates: [
        {
            content: {
                parts: [{text: 'How can I help?'}],
                role: 'model',
            },
            index: 0,
        }
    ],
};

const doneChunk = {
    candidates: [
        {
            content: {
                parts: [{text: ''}],
                role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
        }
    ],
    usageMetadata: {
        promptTokenCount: 8,
        candidatesTokenCount: 6,
        totalTokenCount: 14,
    },
    modelVersion: 'gemini-2.5-flash',
};

const fixture: FixtureScenario = {
    name: 'gemini/generate.streaming',
    plugin: 'gemini',
    protocol: 'gemini.streamGenerateContent',
    streaming: true,

    providerChunks: [chunk1, chunk2, doneChunk],
    expectedText: 'Hello! How can I help?',

    expectedWire: [
        `data: ${JSON.stringify(chunk1)}\n\n`,
        `data: ${JSON.stringify(chunk2)}\n\n`,
        `data: ${JSON.stringify(doneChunk)}\n\n`,
    ],
    expectedStatus: 200,
    expectedHeaders: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    },

    expectedAudit: {
        access_model: 'gemini-2.5-flash',
        input_tokens: 8,
        output_tokens: 6,
        status: ProviderResponseStatus.SUCCESS,
    },

    tags: ['generate', 'streaming'],
};

export default fixture;
