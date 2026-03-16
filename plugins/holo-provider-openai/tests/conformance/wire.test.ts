import {describe, it} from 'vitest';
import {runWireContract} from '@holokai/test-utils';
import chatStreaming from '../fixtures/chat-simple.streaming.fixture.js';
import chatNonStreaming from '../fixtures/chat-simple.nonstreaming.fixture.js';
import responseStreaming from '../fixtures/response-simple.streaming.fixture.js';
import responseNonStreaming from '../fixtures/response-simple.nonstreaming.fixture.js';

const fixtures = [chatStreaming, chatNonStreaming, responseStreaming, responseNonStreaming];

describe('openai wire conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runWireContract('openai', fixture));
    }
});
