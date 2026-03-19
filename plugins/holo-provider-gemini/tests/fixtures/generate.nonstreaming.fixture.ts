import type {FixtureScenario} from '@holokai/test-harness';
import {ProviderResponseStatus} from '@holokai/types/entities';

const generateResponse = {
    candidates: [
        {
            content: {
                parts: [{text: 'Hello! How can I help you today?'}],
                role: 'model',
            },
            finishReason: 'STOP',
            index: 0,
        }
    ],
    usageMetadata: {
        promptTokenCount: 8,
        candidatesTokenCount: 9,
        totalTokenCount: 17,
    },
    modelVersion: 'gemini-2.5-flash',
};

const fixture: FixtureScenario = {
    name: 'gemini/generate.nonstreaming',
    plugin: 'gemini',
    protocol: 'gemini.generateContent',
    streaming: false,

    providerChunks: [generateResponse],
    expectedText: 'Hello! How can I help you today?',

    expectedWire: [
        JSON.stringify(generateResponse),
    ],
    expectedStatus: 200,
    expectedHeaders: {'Content-Type': 'application/json'},

    expectedAudit: {
        access_model: 'gemini-2.5-flash',
        input_tokens: 8,
        output_tokens: 9,
        status: ProviderResponseStatus.SUCCESS,
    },

    tags: ['generate', 'nonstreaming'],
};

export default fixture;
