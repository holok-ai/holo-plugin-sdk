/**
 * Lightweight Ollama Translation Tests
 */

import { OllamaTranslator } from '../ollama/ollama.translator';
import { expectValid, compareData } from './utils/simple-helpers';
import { minimalHoloRequest, minimalHoloResponse } from './fixtures/test-data';

describe('Ollama Translation', () => {
    const translator = new OllamaTranslator();

    describe('Request Round-Trip', () => {
        it('preserves minimal request data', () => {
            const original = minimalHoloRequest;
            
            const ollama = expectValid(translator.fromHoloChatRequest(original));
            const back = expectValid(translator.toHoloChatRequest(ollama));
            
            compareData(original, back);
        });
    });

    describe('Response Round-Trip', () => {
        it('preserves minimal response data', () => {
            const original = minimalHoloResponse;
            
            const ollama = expectValid(translator.toOllamaResponse(original));
            const back = expectValid(translator.fromOllamaResponse(ollama));
            
            // Ignore structural differences between providers
            const ignore = ['object', 'choices', 'system_fingerprint', 'service_tier', 'created'];
            compareData(original, back, ignore);
        });
    });
});