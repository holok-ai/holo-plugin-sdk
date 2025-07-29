import { Request } from 'express';
import { OllamaGenerateQueueRequest, OllamaChatQueueRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import logger from './logger';

/**
 * Parses an Express request body into an Ollama Generate request format.
 * Validates required fields (model, prompt) and extracts all Ollama-specific parameters.
 * 
 * @param req - Express request object containing the request body
 * @returns Parsed OllamaGenerateQueueRequest with validated and structured data
 * @throws Error when required fields (model, prompt) are missing
 */
export const parseOllamaGenerateRequest = (req: Request): OllamaGenerateQueueRequest => {
    const { model, prompt, system, template, context, stream, raw, format, images, keep_alive, options } = req.body;
    
    logger.debug('Parsing Ollama generate request', {
        model,
        promptLength: prompt?.length,
        stream: stream ?? false,
        hasSystem: !!system,
        hasOptions: !!options
    });
    
    if (!model) {
        logger.error('Ollama generate request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!prompt) {
        logger.error('Ollama generate request validation failed: missing prompt');
        throw new Error(ErrorMessages.PROMPT_REQUIRED);
    }

    const parsedRequest = {
        model,
        prompt,
        system,
        template,
        context,
        stream: stream ?? false,
        raw,
        format,
        images,
        keep_alive,
        options
    };
    
    logger.debug('Successfully parsed Ollama generate request', {
        model,
        stream: parsedRequest.stream
    });
    
    return parsedRequest;
};

/**
 * Parses an Express request body into an Ollama Chat request format.
 * Validates required fields (model, messages) and ensures messages array is properly formatted.
 * 
 * @param req - Express request object containing the request body
 * @returns Parsed OllamaChatQueueRequest with validated messages and parameters
 * @throws Error when required fields (model, messages) are missing or messages is not an array
 */
export const parseOllamaChatRequest = (req: Request): OllamaChatQueueRequest => {
    const { model, messages, stream, format, keep_alive, tools, options } = req.body;
    
    logger.debug('Parsing Ollama chat request', {
        model,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        stream: stream ?? false,
        hasOptions: !!options
    });
    
    if (!model) {
        logger.error('Ollama chat request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        logger.error('Ollama chat request validation failed: missing or invalid messages array');
        throw new Error(ErrorMessages.MESSAGES_REQUIRED);
    }

    const parsedRequest = {
        model,
        messages,
        stream: stream ?? false,
        format,
        keep_alive,
        tools,
        options
    };
    
    logger.debug('Successfully parsed Ollama chat request', {
        model,
        messageCount: messages.length,
        stream: parsedRequest.stream
    });
    
    return parsedRequest;
};

/**
 * Routes Express requests to the appropriate Ollama parser based on request type.
 * Acts as a unified entry point for parsing Ollama requests, dispatching to generate or chat parsers.
 * 
 * @param req - Express request object containing the request body
 * @param type - RequestType enum indicating whether this is a GENERATE or CHAT request
 * @returns Parsed LLMPayloadTypes (either OllamaGenerateQueueRequest or OllamaChatQueueRequest)
 */
export const parseOllamaRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing Ollama request', { type });
    
    if (type === RequestType.GENERATE) {
        return parseOllamaGenerateRequest(req);
    } else {
        return parseOllamaChatRequest(req);
    }
};