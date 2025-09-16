/**
 * Lightweight Cross-Provider Translation Tests
 */

import { ClaudeTranslator } from '../claude/claude.translator';
import { OllamaTranslator } from '../ollama/ollama.translator';
import { OpenAITranslator } from '../openai/openai.translator';
import { expectValid } from './utils/simple-helpers';
import { minimalHoloRequest, minimalHoloResponse } from './fixtures/test-data';

describe('Cross-Provider Translation', () => {
    const claude = new ClaudeTranslator();
    const ollama = new OllamaTranslator();
    const openai = new OpenAITranslator();

    describe('Request Consistency', () => {
        it('handles basic requests across all providers', () => {
            const request = minimalHoloRequest;

            const claudeReq = expectValid(claude.fromHoloChatRequest(request));
            const ollamaReq = expectValid(ollama.fromHoloChatRequest(request));
            const openaiReq = expectValid(openai.fromHoloChatRequest(request));

            // All should preserve core fields
            expect(claudeReq.model).toBe(request.model);
            expect(ollamaReq.model).toBe(request.model);
            expect(openaiReq.model).toBe(request.model);
        });
    });

    describe('Response Consistency', () => {
        it('handles basic responses across all providers', () => {
            const response = minimalHoloResponse;

            const claudeResp = expectValid(claude.toClaudeResponse(response));
            const ollamaResp = expectValid(ollama.toOllamaResponse(response));
            const openaiResp = expectValid(openai.toOpenAIResponse(response));

            // Verify translations succeed (provider-specific formats vary)
            expect(claudeResp).toBeDefined();
            expect(ollamaResp).toBeDefined();
            expect(openaiResp).toBeDefined();
        });
    });

    describe('Round-Trip Consistency', () => {
        it('maintains consistency across all providers', () => {
            const original = minimalHoloRequest;

            // Test all providers can round-trip
            const providers = [
                { name: 'Claude', t: claude },
                { name: 'Ollama', t: ollama },
                { name: 'OpenAI', t: openai }
            ];

            providers.forEach(({ t }) => {
                // Forward translation: Holo -> Provider
                const forward = expectValid(t.fromHoloChatRequest(original));
                expect(forward).toBeDefined();

                // Reverse translation: Provider -> Holo
                const back = expectValid(t.toHoloChatRequest(forward as any));
                expect(back).toBeDefined();
                expect(back.model).toBe(original.model);
            });
        });
    });

    describe('Error Handling', () => {
        it('handles invalid input gracefully', () => {
            const invalid = { messages: [{ role: 'user' as const, content: 'No model' }] } as any;

            // Should not crash, may succeed with defaults or fail gracefully
            expect(() => claude.fromHoloChatRequest(invalid)).not.toThrow();
            expect(() => ollama.fromHoloChatRequest(invalid)).not.toThrow();
            expect(() => openai.fromHoloChatRequest(invalid)).not.toThrow();
        });

        it('handles empty messages', () => {
            const empty = { model: 'test', messages: [], max_tokens: 100 };

            const results = [
                claude.fromHoloChatRequest(empty),
                ollama.fromHoloChatRequest(empty),
                openai.fromHoloChatRequest(empty)
            ];

            results.forEach(result => {
                expectValid(result); // Should all succeed
            });
        });
    });
});
