import {describe, it} from 'vitest';
import {runAuditContract} from '@holokai/test-utils';
import generateStreaming from '../fixtures/generate.streaming.fixture.js';
import generateNonStreaming from '../fixtures/generate.nonstreaming.fixture.js';

const fixtures = [generateStreaming, generateNonStreaming];

describe('gemini audit conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runAuditContract('gemini', fixture));
    }
});
