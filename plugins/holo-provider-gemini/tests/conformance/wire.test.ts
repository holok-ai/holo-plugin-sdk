import {describe, it} from 'vitest';
import {runWireContract} from '@holokai/provider-contract-tests';
import generateStreaming from '../fixtures/generate.streaming.fixture.js';
import generateNonStreaming from '../fixtures/generate.nonstreaming.fixture.js';

const fixtures = [generateStreaming, generateNonStreaming];

describe('gemini wire conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runWireContract('gemini', fixture));
    }
});
