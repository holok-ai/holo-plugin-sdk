/**
 * OpenAI Test Request Fixtures
 *
 * Predefined request payloads for integration tests.
 */

export const chatCompletionRequest = {
    model: 'gpt-4o-mini',
    messages: [
        {role: 'user', content: 'Say "Integration test successful" and nothing else'}
    ],
    temperature: 0.7,
    max_tokens: 20,
    stream: false
};

export const chatCompletionStreamRequest = {
    model: 'gpt-4o-mini',
    messages: [
        {role: 'user', content: 'Count to 3 slowly'}
    ],
    temperature: 0.7,
    max_tokens: 50,
    stream: true
};

export const chatCompletionToolsRequest = {
    model: 'gpt-4o-mini',
    messages: [
        {role: 'user', content: 'What is the weather in San Francisco?'}
    ],
    tools: [
        {
            type: 'function',
            function: {
                name: 'get_weather',
                description: 'Get the current weather for a location',
                parameters: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'The city and state, e.g. San Francisco, CA'
                        },
                        unit: {
                            type: 'string',
                            enum: ['celsius', 'fahrenheit']
                        }
                    },
                    required: ['location']
                }
            }
        }
    ],
    tool_choice: 'auto',
    stream: false
};

export const responsesAPIRequest = {
    model: 'gpt-4o-mini',
    input: [
        {role: 'user', content: 'Say "Responses API working" and nothing else'}
    ],
    max_output_tokens: 20,
    stream: false
};

export const responsesAPIStreamRequest = {
    model: 'gpt-4o-mini',
    input: [
        {role: 'user', content: 'Count to 3 slowly'}
    ],
    max_output_tokens: 50,
    stream: true
};

export const responsesAPIArrayInputRequest = {
    model: 'gpt-4o-mini',
    input: [
        {role: 'system', content: 'You are a helpful assistant'},
        {role: 'user', content: 'Say hello'}
    ],
    max_output_tokens: 20,
    stream: false
};

export const responsesAPIToolsRequest = {
    model: 'gpt-4o-mini',
    input: 'What is the weather in New York?',
    tools: [
        {
            type: 'function',
            name: 'get_weather',
            description: 'Get weather for a location',
            parameters: {
                type: 'object',
                properties: {
                    location: {type: 'string'}
                },
                required: ['location']
            }
        }
    ],
    stream: false
};
