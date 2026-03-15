import {describe, it} from 'vitest';
import {runPipelineContract} from '@holokai/provider-contract-tests';
import generateStreaming from '../fixtures/generate.streaming.fixture.js';
import generateNonStreaming from '../fixtures/generate.nonstreaming.fixture.js';

const fixtures = [generateStreaming, generateNonStreaming];

describe('gemini pipeline conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runPipelineContract('gemini', fixture));
    }
});
