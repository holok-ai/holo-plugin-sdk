import {describe, it} from 'vitest';
import {runAuditContract} from '@holokai/test-utils';
import messagesStreaming from '../fixtures/messages-simple.streaming.fixture.js';
import messagesNonStreaming from '../fixtures/messages-simple.nonstreaming.fixture.js';

const fixtures = [messagesStreaming, messagesNonStreaming];

describe('claude audit conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runAuditContract('claude', fixture));
    }
});
