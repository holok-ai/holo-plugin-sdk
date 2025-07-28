import { Request } from 'express';
import { OpenAIWorkerRequest, LLMPayloadTypes } from '../types';

/**
 * Parse Express request body into OpenAI request
 * OpenAI uses a unified chat completions API (no separate generate endpoint)
 */
export const parseOpenAIRequest = (req: Request): OpenAIWorkerRequest => {
    const { 
        model, 
        messages, 
        max_tokens, 
        temperature, 
        top_p, 
        frequency_penalty,
        presence_penalty,
        stop,
        stream,
        tools,
        tool_choice,
        user,
        logit_bias,
        logprobs,
        top_logprobs,
        n,
        response_format,
        seed
    } = req.body;
    
    if (!model) {
        throw new Error('Model is required');
    }
    
    if (!messages || !Array.isArray(messages)) {
        throw new Error('Messages array is required');
    }

    // Validate messages format (OpenAI expects role/content structure)
    for (const message of messages) {
        if (!message.role || !message.content) {
            throw new Error('Each message must have role and content');
        }
        if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) {
            throw new Error('Message role must be "system", "user", "assistant", or "tool"');
        }
    }

    return {
        model,
        messages,
        max_tokens,
        temperature,
        top_p,
        frequency_penalty,
        presence_penalty,
        stop,
        stream: stream ?? false,
        tools,
        tool_choice,
        user,
        logit_bias,
        logprobs,
        top_logprobs,
        n,
        response_format,
        seed
    };
};

/**
 * Parse Express request into OpenAI queue request
 * OpenAI only supports chat-style interactions
 */
export const parseOpenAIMessageRequest = (req: Request, type: 'generate' | 'chat'): LLMPayloadTypes => {
    if (type === 'generate') {
        // For generate requests, convert to OpenAI's messages format
        const { model, prompt, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop, stream } = req.body;
        
        if (!model) {
            throw new Error('Model is required');
        }
        
        if (!prompt) {
            throw new Error('Prompt is required');
        }

        // Convert generate request to messages format
        const messages = [{ role: 'user', content: prompt }];

        return {
            model,
            messages,
            max_tokens,
            temperature,
            top_p,
            frequency_penalty,
            presence_penalty,
            stop,
            stream: stream ?? false
        };
    } else {
        // For chat requests, use the standard parser
        return parseOpenAIRequest(req);
    }
};