import {describe, it} from 'vitest';
import {runWireContract} from '@holokai/provider-contract-tests';
import messagesStreaming from '../fixtures/messages-simple.streaming.fixture.js';
import messagesNonStreaming from '../fixtures/messages-simple.nonstreaming.fixture.js';

const fixtures = [messagesStreaming, messagesNonStreaming];

describe('claude wire conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runWireContract('claude', fixture));
    }
});
