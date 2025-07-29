import { Request } from 'express';
import { ClaudeWorkerRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import logger from './logger';

/**
 * Parses an Express request body into a Claude request format.
 * Claude uses a unified messages API (no separate generate endpoint), so this handles
 * all Claude requests with proper message format validation and parameter extraction.
 * 
 * @param req - Express request object containing the request body
 * @returns Parsed ClaudeWorkerRequest with validated messages and Claude-specific parameters
 * @throws Error when required fields (model, messages) are missing or message format is invalid
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
    
    logger.debug('Parsing Claude request', {
        model,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        stream: stream ?? false,
        maxTokens: max_tokens || 4096,
        hasSystem: !!system,
        hasTools: !!tools
    });
    
    if (!model) {
        logger.error('Claude request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        logger.error('Claude request validation failed: missing or invalid messages array');
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

    const parsedRequest = {
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
    
    logger.debug('Successfully parsed Claude request', {
        model,
        messageCount: messages.length,
        stream: parsedRequest.stream,
        maxTokens: parsedRequest.max_tokens
    });
    
    return parsedRequest;
};

/**
 * Routes Express requests to Claude parser with automatic generate-to-messages conversion.
 * Claude only supports chat-style interactions, so generate requests are automatically
 * converted to messages format with the prompt as a user message.
 * 
 * @param req - Express request object containing the request body
 * @param type - RequestType enum indicating GENERATE (converted) or CHAT (direct) request
 * @returns Parsed LLMPayloadTypes in Claude's messages format
 * @throws Error when required fields are missing or request format is invalid
 */
export const parseClaudeMessageRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing Claude request', { type });
    
    if (type === RequestType.GENERATE) {
        // For generate requests, convert to Claude's messages format
        const { model, prompt, system, max_tokens, temperature, top_p, top_k, stop_sequences, stream } = req.body;
        
        logger.debug('Parsing Claude generate request (converting to messages format)', {
            model,
            promptLength: prompt?.length,
            stream: stream ?? false,
            hasSystem: !!system
        });
        
        if (!model) {
            logger.error('Claude generate request validation failed: missing model');
            throw new Error(ErrorMessages.MODEL_REQUIRED);
        }
        
        if (!prompt) {
            logger.error('Claude generate request validation failed: missing prompt');
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