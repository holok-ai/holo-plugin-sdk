/**
 * Test data fixtures for provider translation tests
 * Contains representative samples for each provider format
 */

import type { HoloRequest, HoloResponse } from '../../types';

// ========== HOLO TEST FIXTURES ==========

export const holoRequestFixture: HoloRequest = {
    model: 'claude-3-5-sonnet-20241022',
    messages: [
        {
            role: 'user',
            content: 'What is the capital of France?',
            images: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA==']
        },
        {
            role: 'assistant',
            content: 'The capital of France is Paris.',
            tool_calls: [
                {
                    id: 'call_123',
                    name: 'get_weather',
                    arguments: '{"location": "Paris"}'
                }
            ]
        },
        {
            role: 'tool',
            content: 'Weather in Paris: 22°C, sunny',
            tool_call_id: 'call_123'
        }
    ],
    tools: [
        {
            name: 'get_weather',
            description: 'Get current weather for a location',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city name'
                    }
                },
                required: ['location']
            }
        }
    ],
    tool_choice: {
        type: 'specific',
        name: 'get_weather'
    },
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
    seed: 12345,
    stream: false,
    stop_sequences: ['END', 'STOP'],
    system: 'You are a helpful assistant.',
    response_format: {
        type: 'json_object'
    },
    metadata: {
        user_id: 'test_user'
    }
};

export const holoResponseFixture: HoloResponse = {
    id: 'resp_123',
    object: 'chat.completion',
    model: 'claude-3-5-sonnet-20241022',
    created: 1703123456,
    choices: [
        {
            index: 0,
            message: {
                role: 'assistant',
                content: 'The capital of France is Paris, a beautiful city known for its architecture and culture.',
                refusal: null,
                tool_calls: [
                    {
                        id: 'call_456',
                        name: 'get_weather',
                        arguments: '{"location": "Paris"}'
                    }
                ]
            },
            finish_reason: 'stop',
            logprobs: null
        }
    ],
    usage: {
        input_tokens: 50,
        output_tokens: 25,
        total_tokens: 75,
        cache_read_tokens: 10,
        cache_write_tokens: 5
    },
    system_fingerprint: 'fp_123'
};

// ========== CLAUDE TEST FIXTURES ==========

export const claudeRequestFixture = {
    model: 'claude-3-5-sonnet-20241022',
    messages: [
        {
            role: 'user' as const,
            content: [
                {
                    type: 'text' as const,
                    text: 'What is the capital of France?'
                },
                {
                    type: 'image' as const,
                    source: {
                        type: 'base64' as const,
                        media_type: 'image/jpeg' as const,
                        data: '/9j/4AAQSkZJRgABAQEAAA=='
                    }
                }
            ]
        },
        {
            role: 'assistant' as const,
            content: [
                {
                    type: 'text' as const,
                    text: 'The capital of France is Paris.'
                },
                {
                    type: 'tool_use' as const,
                    id: 'call_123',
                    name: 'get_weather',
                    input: { location: 'Paris' }
                }
            ]
        },
        {
            role: 'user' as const,
            content: [
                {
                    type: 'tool_result' as const,
                    tool_use_id: 'call_123',
                    content: 'Weather in Paris: 22°C, sunny'
                }
            ]
        }
    ],
    tools: [
        {
            name: 'get_weather',
            description: 'Get current weather for a location',
            input_schema: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city name'
                    }
                },
                required: ['location']
            }
        }
    ],
    tool_choice: {
        type: 'tool' as const,
        name: 'get_weather'
    },
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    stream: false,
    stop_sequences: ['END', 'STOP'],
    system: [
        {
            type: 'text' as const,
            text: 'You are a helpful assistant.'
        }
    ],
    metadata: {
        user_id: 'test_user'
    }
};

export const claudeResponseFixture = {
    id: 'msg_123',
    type: 'message' as const,
    role: 'assistant' as const,
    model: 'claude-3-5-sonnet-20241022',
    content: [
        {
            type: 'text' as const,
            text: 'The capital of France is Paris, a beautiful city known for its architecture and culture.'
        },
        {
            type: 'tool_use' as const,
            id: 'call_456',
            name: 'get_weather',
            input: { location: 'Paris' }
        }
    ],
    stop_reason: 'end_turn' as const,
    stop_sequence: null,
    usage: {
        input_tokens: 50,
        output_tokens: 25,
        cache_creation_input_tokens: 5,
        cache_read_input_tokens: 10,
        service_tier: 'default' as const
    }
};

// ========== OLLAMA TEST FIXTURES ==========

export const ollamaRequestFixture = {
    model: 'llama3.1:8b',
    messages: [
        {
            role: 'user',
            content: 'What is the capital of France?',
            images: ['/9j/4AAQSkZJRgABAQEAAA==']
        },
        {
            role: 'assistant',
            content: 'The capital of France is Paris.',
            tool_calls: [
                {
                    function: {
                        name: 'get_weather',
                        arguments: { location: 'Paris' }
                    }
                }
            ]
        }
    ],
    tools: [
        {
            type: 'function',
            function: {
                name: 'get_weather',
                description: 'Get current weather for a location',
                parameters: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'The city name'
                        }
                    },
                    required: ['location']
                }
            }
        }
    ],
    stream: false,
    format: 'json',
    options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        seed: 12345,
        num_predict: 1000,
        stop: ['END', 'STOP']
    },
    system: 'You are a helpful assistant.',
    keep_alive: '5m'
};

export const ollamaResponseFixture = {
    model: 'llama3.1:8b',
    created_at: new Date('2023-12-01T10:30:45Z'),
    message: {
        role: 'assistant',
        content: 'The capital of France is Paris, a beautiful city known for its architecture and culture.',
        tool_calls: [
            {
                function: {
                    name: 'get_weather',
                    arguments: { location: 'Paris' }
                }
            }
        ]
    },
    done: true,
    done_reason: 'stop',
    total_duration: 1234567890,
    load_duration: 12345678,
    prompt_eval_count: 50,
    prompt_eval_duration: 123456789,
    eval_count: 25,
    eval_duration: 234567890,
    context: [123, 456, 789]
};

// ========== OPENAI TEST FIXTURES ==========

export const openaiRequestFixture = {
    model: 'gpt-4-turbo',
    messages: [
        {
            role: 'user' as const,
            content: [
                {
                    type: 'text' as const,
                    text: 'What is the capital of France?'
                },
                {
                    type: 'image_url' as const,
                    image_url: {
                        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAA==',
                        detail: 'auto' as const
                    }
                }
            ]
        },
        {
            role: 'assistant' as const,
            content: 'The capital of France is Paris.',
            tool_calls: [
                {
                    id: 'call_123',
                    type: 'function' as const,
                    function: {
                        name: 'get_weather',
                        arguments: '{"location": "Paris"}'
                    }
                }
            ]
        },
        {
            role: 'tool' as const,
            content: 'Weather in Paris: 22°C, sunny',
            tool_call_id: 'call_123'
        }
    ],
    tools: [
        {
            type: 'function' as const,
            function: {
                name: 'get_weather',
                description: 'Get current weather for a location',
                parameters: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'The city name'
                        }
                    },
                    required: ['location']
                }
            }
        }
    ],
    tool_choice: {
        type: 'specific',
        name: 'get_weather'
    },
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
    seed: 12345,
    stream: false,
    stop_sequences: ['END', 'STOP'],
    user: 'test_user',
    response_format: {
        type: 'json_object' as const
    },
    logprobs: true,
    top_logprobs: 5,
    logit_bias: { '50256': -100 }
};

export const openaiResponseFixture = {
    id: 'chatcmpl-123',
    object: 'chat.completion' as const,
    created: 1703123456,
    model: 'gpt-4-turbo',
    system_fingerprint: 'fp_123',
    choices: [
        {
            index: 0,
            message: {
                role: 'assistant' as const,
                content: 'The capital of France is Paris, a beautiful city known for its architecture and culture.',
                refusal: null,
                tool_calls: [
                    {
                        id: 'call_456',
                        type: 'function' as const,
                        function: {
                            name: 'get_weather',
                            arguments: '{"location": "Paris"}'
                        }
                    }
                ]
            },
            finish_reason: 'stop' as const,
            logprobs: {
                content: [
                    {
                        token: 'The',
                        bytes: [84, 104, 101],
                        logprob: -0.1,
                        top_logprobs: [
                            {
                                token: 'The',
                                bytes: [84, 104, 101],
                                logprob: -0.1
                            }
                        ]
                    }
                ],
                refusal: null
            }
        }
    ],
    usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75,
        completion_tokens_details: {
            reasoning_tokens: 5,
            accepted_prediction_tokens: 3,
            rejected_prediction_tokens: 1,
            audio_tokens: 0
        },
        prompt_tokens_details: {
            cached_tokens: 10,
            audio_tokens: 0
        }
    }
};

// ========== MINIMAL TEST FIXTURES ==========
// Simplified fixtures for basic round-trip tests

export const minimalHoloRequest: HoloRequest = {
    model: 'test-model',
    messages: [
        {
            role: 'user',
            content: 'Hello'
        }
    ],
    max_tokens: 100
};

export const minimalHoloResponse: HoloResponse = {
    id: 'test-123',
    object: 'chat.completion',
    model: 'test-model',
    created: 1703123456,
    choices: [
        {
            index: 0,
            message: {
                role: 'assistant',
                content: 'Hi there!'
            },
            finish_reason: 'stop'
        }
    ],
    usage: {
        input_tokens: 5,
        output_tokens: 3,
        total_tokens: 8
    }
};