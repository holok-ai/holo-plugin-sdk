import {describe, it} from 'vitest';
import {runPipelineContract} from '@holokai/provider-contract-tests';
import messagesStreaming from '../fixtures/messages-simple.streaming.fixture.js';
import messagesNonStreaming from '../fixtures/messages-simple.nonstreaming.fixture.js';

const fixtures = [messagesStreaming, messagesNonStreaming];

describe('claude pipeline conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runPipelineContract('claude', fixture));
    }
});
