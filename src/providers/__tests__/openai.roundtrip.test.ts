/**
 * Lightweight OpenAI Translation Tests
 */

import { OpenAITranslator } from '../openai/openai.translator';
import { expectValid, compareData } from './utils/simple-helpers';
import { minimalHoloRequest, minimalHoloResponse } from './fixtures/test-data';

describe('OpenAI Translation', () => {
    const translator = new OpenAITranslator();

    describe('Request Round-Trip', () => {
        it('preserves minimal request data', () => {
            const original = minimalHoloRequest;
            
            const openai = expectValid(translator.fromHoloChatRequest(original));
            const back = expectValid(translator.toHoloChatRequest(openai));
            
            compareData(original, back);
        });
    });

    describe('Response Round-Trip', () => {
        it('preserves minimal response data', () => {
            const original = minimalHoloResponse;
            
            const openai = expectValid(translator.toOpenAIResponse(original));
            const back = expectValid(translator.fromOpenAIResponse(openai));
            
            // OpenAI structure is closest to Holo format
            compareData(original, back);
        });
    });
});