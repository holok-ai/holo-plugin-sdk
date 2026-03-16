import {describe, it} from 'vitest';
import {runRoundTripContract} from '@holokai/test-utils';
import adapter from '../sdk-adapter.js';
import chatStreaming from '../fixtures/chat-simple.streaming.fixture.js';
import chatNonStreaming from '../fixtures/chat-simple.nonstreaming.fixture.js';
import responseStreaming from '../fixtures/response-simple.streaming.fixture.js';
import responseNonStreaming from '../fixtures/response-simple.nonstreaming.fixture.js';

const fixtures = [chatStreaming, chatNonStreaming, responseStreaming, responseNonStreaming];

describe('openai roundtrip conformance', () => {
    for (const fixture of fixtures) {
        it(fixture.name, () => runRoundTripContract(fixture, adapter));
    }
});
