/**
 * Lightweight Claude Translation Tests
 */

import { ClaudeTranslator } from '../claude/claude.translator';
import { expectValid, compareData } from './utils/simple-helpers';
import { minimalHoloRequest, minimalHoloResponse } from './fixtures/test-data';

describe('Claude Translation', () => {
    const translator = new ClaudeTranslator();

    describe('Request Round-Trip', () => {
        it('preserves minimal request data', () => {
            const original = minimalHoloRequest;

            const claude = expectValid(translator.fromHoloChatRequest(original));
            const back = expectValid(translator.toHoloChatRequest(claude));

            compareData(original, back);
        });
    });

    describe('Response Round-Trip', () => {
        it('preserves minimal response data', () => {
            const original = minimalHoloResponse;

            const claude = expectValid(translator.toClaudeResponse(original));
            const back = expectValid(translator.fromClaudeResponse(claude));

            // Ignore structural differences between providers
            const ignore = ['object', 'choices', 'system_fingerprint', 'service_tier', 'created'];
            compareData(original, back, ignore);
        });
    });
});
