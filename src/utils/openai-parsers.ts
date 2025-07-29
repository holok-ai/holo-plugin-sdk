import { Request } from 'express';
import { OpenAIWorkerRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import logger from './logger';

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
    
    logger.debug('Parsing OpenAI request', {
        model,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        stream: stream ?? false,
        maxTokens: max_tokens || 'unspecified',
        hasTools: !!tools,
        hasUser: !!user
    });
    
    if (!model) {
        logger.error('OpenAI request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        logger.error('OpenAI request validation failed: missing or invalid messages array');
        throw new Error(ErrorMessages.MESSAGES_REQUIRED);
    }

    // Validate messages format (OpenAI expects role/content structure)
    for (const message of messages) {
        if (!message.role || !message.content) {
            throw new Error(ErrorMessages.MESSAGE_ROLE_CONTENT_REQUIRED);
        }
        if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) {
            throw new Error(ErrorMessages.invalidMessageRole(['system', 'user', 'assistant', 'tool']));
        }
    }

    const parsedRequest = {
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
    
    logger.debug('Successfully parsed OpenAI request', {
        model,
        messageCount: messages.length,
        stream: parsedRequest.stream,
        maxTokens: parsedRequest.max_tokens
    });
    
    return parsedRequest;
};

/**
 * Parse Express request into OpenAI queue request
 * OpenAI only supports chat-style interactions
 */
export const parseOpenAIMessageRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing OpenAI request', { type });
    
    if (type === RequestType.GENERATE) {
        // For generate requests, convert to OpenAI's messages format
        const { model, prompt, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, stop, stream } = req.body;
        
        logger.debug('Parsing OpenAI generate request (converting to messages format)', {
            model,
            promptLength: prompt?.length,
            stream: stream ?? false,
            maxTokens: max_tokens || 'unspecified'
        });
        
        if (!model) {
            logger.error('OpenAI generate request validation failed: missing model');
            throw new Error(ErrorMessages.MODEL_REQUIRED);
        }
        
        if (!prompt) {
            logger.error('OpenAI generate request validation failed: missing prompt');
            throw new Error(ErrorMessages.PROMPT_REQUIRED);
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