import {describe, it} from 'vitest';
import {runAuditContract} from '@holokai/provider-contract-tests';
import chatStreaming from '../fixtures/chat-simple.streaming.fixture.js';
import chatNonStreaming from '../fixtures/chat-simple.nonstreaming.fixture.js';
import responseStreaming from '../fixtures/response-simple.streaming.fixture.js';
import responseNonStreaming from '../fixtures/response-simple.nonstreaming.fixture.js';

const fixtures = [chatStreaming, chatNonStreaming, responseStreaming, responseNonStreaming];

describe('openai audit conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runAuditContract('openai', fixture));
    }
});
