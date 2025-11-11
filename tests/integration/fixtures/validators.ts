/**
 * Response Validation Helpers
 *
 * Validate response structure and content for integration tests.
 */

/**
 * Validate Chat Completion response structure
 */
export function validateChatCompletion(response: any): void {
    expect(response).toBeDefined();
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('choices');
    expect(Array.isArray(response.choices)).toBe(true);
    expect(response.choices.length).toBeGreaterThan(0);

    const choice = response.choices[0];
    expect(choice).toHaveProperty('message');
    expect(choice.message).toHaveProperty('role');
    expect(choice.message.role).toBe('assistant');
    expect(choice.message).toHaveProperty('content');
}

/**
 * Validate Chat Completion has actual content
 */
export function validateChatCompletionContent(response: any, expectedSubstring?: string): void {
    const content = response.choices[0].message.content;
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);

    if (expectedSubstring) {
        expect(content.toLowerCase()).toContain(expectedSubstring.toLowerCase());
    }
}

/**
 * Parse SSE chunks and return parsed events
 */
export function parseSSEChunks(chunks: string[]): any[] {
    const events: any[] = [];

    for (const chunk of chunks) {
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') continue;
                if (data.length === 0) continue;

                try {
                    const parsed = JSON.parse(data);
                    events.push(parsed);
                } catch (e) {
                    // Skip unparseable lines
                }
            }
        }
    }

    return events;
}

/**
 * Validate streaming chat completion chunks
 */
export function validateStreamingChatCompletion(chunks: string[]): void {
    expect(chunks.length).toBeGreaterThan(0);

    const events = parseSSEChunks(chunks);
    expect(events.length).toBeGreaterThan(0);

    // Should have at least one event with role
    const hasRole = events.some(e => e.choices?.[0]?.delta?.role === 'assistant');
    expect(hasRole).toBe(true);

    // Should have at least one event with content
    const hasContent = events.some(e => e.choices?.[0]?.delta?.content);
    expect(hasContent).toBe(true);

    // Should have a finish reason at the end
    const lastEvents = events.slice(-3);
    const hasFinishReason = lastEvents.some(e => e.choices?.[0]?.finish_reason);
    expect(hasFinishReason).toBe(true);
}

/**
 * Validate tool calls in response
 */
export function validateToolCalls(response: any): void {
    const message = response.choices[0].message;
    expect(message).toHaveProperty('tool_calls');
    expect(Array.isArray(message.tool_calls)).toBe(true);
    expect(message.tool_calls.length).toBeGreaterThan(0);

    const toolCall = message.tool_calls[0];
    expect(toolCall).toHaveProperty('id');
    expect(toolCall).toHaveProperty('type');
    expect(toolCall.type).toBe('function');
    expect(toolCall).toHaveProperty('function');
    expect(toolCall.function).toHaveProperty('name');
    expect(toolCall.function).toHaveProperty('arguments');
}

/**
 * Validate Responses API response structure
 */
export function validateResponsesAPI(response: any): void {
    expect(response).toBeDefined();
    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('output');
    expect(Array.isArray(response.output)).toBe(true);
}

/**
 * Validate Responses API streaming events
 */
export function validateResponsesAPIStream(chunks: string[]): void {
    expect(chunks.length).toBeGreaterThan(0);

    const events = parseSSEChunks(chunks);
    expect(events.length).toBeGreaterThan(0);

    // Should have response.created event
    const hasCreated = events.some(e => e.type === 'response.created');
    expect(hasCreated).toBe(true);

    // Should have text delta events
    const hasTextDelta = events.some(e => e.type === 'response.output_text.delta');
    expect(hasTextDelta).toBe(true);

    // Should have completed event
    const hasCompleted = events.some(e => e.type === 'response.completed');
    expect(hasCompleted).toBe(true);
}

/**
 * Extract all text deltas from Responses API stream
 */
export function extractResponsesAPIText(chunks: string[]): string {
    const events = parseSSEChunks(chunks);
    let text = '';

    for (const event of events) {
        if (event.type === 'response.output_text.delta' && event.delta) {
            text += event.delta;
        }
    }

    return text;
}
