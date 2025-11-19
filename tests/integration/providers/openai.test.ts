/**
 * OpenAI Provider Integration Tests
 *
 * REAL integration tests - NO MOCKING.
 * Makes actual HTTP requests to running server which proxies to OpenAI API.
 *
 * Prerequisites:
 * - Server running (npm run start or npm run api:dev)
 * - TEST_AUTH_TOKEN env var set
 * - Server has valid OPENAI_API_KEY configured
 */

import {loadTestConfig, validateConfig} from '../setup/config';
import {TestClient, waitForServer} from '../setup/test-client';
import {
    chatCompletionRequest,
    chatCompletionStreamRequest,
    chatCompletionToolsRequest,
    responsesAPIRequest,
    responsesAPIStreamRequest,
    responsesAPIArrayInputRequest
} from '../fixtures/openai-requests';
import {
    validateChatCompletion,
    validateChatCompletionContent,
    validateStreamingChatCompletion,
    validateToolCalls,
    validateResponsesAPI,
    validateResponsesAPIStream,
    extractResponsesAPIText
} from '../fixtures/validators';

describe('OpenAI Integration Tests', () => {
    let client: TestClient;
    let config: ReturnType<typeof loadTestConfig>;

    beforeAll(async () => {
        // Load and validate configuration
        config = loadTestConfig();
        validateConfig(config);

        // Wait for server to be ready
        console.log(`Waiting for server at ${config.baseUrl}...`);
        const serverReady = await waitForServer(config.baseUrl, 30, 1000);

        if (!serverReady) {
            throw new Error(
                `Server not ready at ${config.baseUrl} after 30 seconds.\n` +
                `Make sure the server is running: npm run start`
            );
        }

        console.log(`✓ Server ready at ${config.baseUrl}`);

        // Initialize test client
        client = new TestClient(config);
    });

    describe('Chat Completions API', () => {
        it('should handle non-streaming chat completion', async () => {
            const response = await client.post('/api/openai/v1/chat/completions', chatCompletionRequest);

            expect(response.status).toBe(200);
            validateChatCompletion(response.data);
            validateChatCompletionContent(response.data, 'test');
        }, 30000);

        it('should handle streaming chat completion', async () => {
            const chunks = await client.stream('/api/openai/v1/chat/completions', chatCompletionStreamRequest);

            validateStreamingChatCompletion(chunks);
        }, 30000);

        it('should handle function calling', async () => {
            const response = await client.post('/api/openai/v1/chat/completions', chatCompletionToolsRequest);

            expect(response.status).toBe(200);
            validateChatCompletion(response.data);

            // Validate tool calls if present (model may choose not to call)
            const message = response.data.choices[0].message;
            if (message.tool_calls && message.tool_calls.length > 0) {
                validateToolCalls(response.data);
                expect(message.tool_calls[0].function.name).toBe('get_weather');
            }
        }, 30000);
    });

    describe('Responses API', () => {
        it('should handle non-streaming response', async () => {
            const response = await client.post('/api/openai/v1/responses', responsesAPIRequest);

            expect(response.status).toBe(200);
            validateResponsesAPI(response.data);

            // Validate has output content
            expect(response.data.output.length).toBeGreaterThan(0);
            const hasTextOutput = response.data.output.some((item: any) =>
                item.type === 'message' && item.content?.some((c: any) => c.type === 'output_text')
            );
            expect(hasTextOutput).toBe(true);
        }, 30000);

        it('should handle streaming response', async () => {
            const chunks = await client.stream('/api/openai/v1/responses', responsesAPIStreamRequest);

            validateResponsesAPIStream(chunks);

            // Validate we got actual text content
            const text = extractResponsesAPIText(chunks);
            expect(text.length).toBeGreaterThan(0);
        }, 30000);

        it('should handle array input format', async () => {
            const response = await client.post('/api/openai/v1/responses', responsesAPIArrayInputRequest);

            expect(response.status).toBe(200);
            validateResponsesAPI(response.data);

            // Should accept array input and return output
            expect(response.data.output.length).toBeGreaterThan(0);
        }, 30000);
    });

    describe('Models Endpoint', () => {
        it('should list available models', async () => {
            const response = await client.get('/api/openai/v1/models');

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('object');
            expect(response.data.object).toBe('list');
            expect(response.data).toHaveProperty('data');
            expect(Array.isArray(response.data.data)).toBe(true);

            // Should have at least some models
            expect(response.data.data.length).toBeGreaterThan(0);
        }, 10000);
    });
});
