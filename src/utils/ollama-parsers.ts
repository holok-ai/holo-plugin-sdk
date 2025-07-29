import { Request } from 'express';
import { OllamaGenerateQueueRequest, OllamaChatQueueRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import logger from './logger';

/**
 * Parse Express request body into Ollama Generate request
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
 * Parse Express request body into Ollama Chat request
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
 * Parse Express request into appropriate Ollama queue request based on endpoint
 */
export const parseOllamaRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing Ollama request', { type });
    
    if (type === RequestType.GENERATE) {
        return parseOllamaGenerateRequest(req);
    } else {
        return parseOllamaChatRequest(req);
    }
};