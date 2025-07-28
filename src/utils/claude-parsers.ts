import { Request } from 'express';
import { ClaudeWorkerRequest, LLMPayloadTypes } from '../types';

/**
 * Parse Express request body into Claude request
 * Claude uses a unified messages API (no separate generate endpoint)
 */
export const parseClaudeRequest = (req: Request): ClaudeWorkerRequest => {
    const { 
        model, 
        messages, 
        max_tokens, 
        temperature, 
        top_p, 
        top_k,
        stop_sequences,
        stream,
        system,
        metadata,
        tools,
        tool_choice
    } = req.body;
    
    if (!model) {
        throw new Error('Model is required');
    }
    
    if (!messages || !Array.isArray(messages)) {
        throw new Error('Messages array is required');
    }

    // Validate messages format (Claude expects role/content structure)
    for (const message of messages) {
        if (!message.role || !message.content) {
            throw new Error('Each message must have role and content');
        }
        if (!['user', 'assistant'].includes(message.role)) {
            throw new Error('Message role must be either "user" or "assistant"');
        }
    }

    return {
        model,
        messages,
        max_tokens: max_tokens || 4096,
        temperature,
        top_p,
        top_k,
        stop_sequences,
        stream: stream ?? false,
        system,
        metadata,
        tools,
        tool_choice
    };
};

/**
 * Parse Express request into Claude queue request
 * Claude only supports chat-style interactions
 */
export const parseClaudeMessageRequest = (req: Request, type: 'generate' | 'chat'): LLMPayloadTypes => {
    if (type === 'generate') {
        // For generate requests, convert to Claude's messages format
        const { model, prompt, system, max_tokens, temperature, top_p, top_k, stop_sequences, stream } = req.body;
        
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
            max_tokens: max_tokens || 4096,
            temperature,
            top_p,
            top_k,
            stop_sequences,
            stream: stream ?? false,
            system
        };
    } else {
        // For chat requests, use the standard parser
        return parseClaudeRequest(req);
    }
};