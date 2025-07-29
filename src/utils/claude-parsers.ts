import { Request } from 'express';
import { ClaudeWorkerRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';

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
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        throw new Error(ErrorMessages.MESSAGES_REQUIRED);
    }

    // Validate messages format (Claude expects role/content structure)
    for (const message of messages) {
        if (!message.role || !message.content) {
            throw new Error(ErrorMessages.MESSAGE_ROLE_CONTENT_REQUIRED);
        }
        if (!['user', 'assistant'].includes(message.role)) {
            throw new Error(ErrorMessages.invalidMessageRole(['user', 'assistant']));
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
export const parseClaudeMessageRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    if (type === RequestType.GENERATE) {
        // For generate requests, convert to Claude's messages format
        const { model, prompt, system, max_tokens, temperature, top_p, top_k, stop_sequences, stream } = req.body;
        
        if (!model) {
            throw new Error(ErrorMessages.MODEL_REQUIRED);
        }
        
        if (!prompt) {
            throw new Error(ErrorMessages.PROMPT_REQUIRED);
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