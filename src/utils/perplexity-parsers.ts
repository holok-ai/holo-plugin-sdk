import {Request} from 'express';
import {LLMPayloadTypes, OpenAIWorkerRequest, RequestType} from '../types';
import {ErrorMessages} from './error-messages';
import logger from './logger';

/**
 * Parses an Express request body into an OpenAI request format.
 * OpenAI uses a unified chat completions API (no separate generate endpoint), so this handles
 * all OpenAI requests with proper message format validation and parameter extraction.
 *
 * @param req - Express request object containing the request body
 * @returns Parsed OpenAIWorkerRequest with validated messages and OpenAI-specific parameters
 * @throws Error when required fields (model, messages) are missing or message format is invalid
 */
export const parsePerplexityRequest = (req: Request): OpenAIWorkerRequest => {
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

    logger.debug('Parsing Perplexity request', {
        model,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        stream: stream ?? false,
        maxTokens: max_tokens || 'unspecified',
        hasTools: !!tools,
        hasUser: !!user
    });

    if (!model) {
        logger.error('Perplexity request validation failed: missing model');
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }

    if (!messages || !Array.isArray(messages)) {
        logger.error('Perplexity request validation failed: missing or invalid messages array');
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

    logger.debug('Successfully parsed Perplexity request', {
        model,
        messageCount: messages.length,
        stream: parsedRequest.stream,
        maxTokens: parsedRequest.max_tokens
    });

    return parsedRequest;
};

/**
 * Routes Express requests to OpenAI parser with automatic generate-to-messages conversion.
 * OpenAI only supports chat-style interactions, so generate requests are automatically
 * converted to messages format with the prompt as a user message.
 *
 * @param req - Express request object containing the request body
 * @param type - RequestType enum indicating GENERATE (converted) or CHAT (direct) request
 * @returns Parsed LLMPayloadTypes in OpenAI's messages format
 * @throws Error when required fields are missing or request format is invalid
 */
export const parsePerplexityMessageRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    logger.debug('Routing Perplexity request', {type});

    if (type === RequestType.GENERATE) {
        // For generate requests, convert to OpenAI's messages format
        const {
            model,
            prompt,
            temperature,
            max_tokens,
            top_p,
            frequency_penalty,
            presence_penalty,
            stop,
            stream
        } = req.body;

        logger.debug('Parsing Perplexity generate request (converting to messages format)', {
            model,
            promptLength: prompt?.length,
            stream: stream ?? false,
            maxTokens: max_tokens || 'unspecified'
        });

        if (!model) {
            logger.error('Perplexity generate request validation failed: missing model');
            throw new Error(ErrorMessages.MODEL_REQUIRED);
        }

        if (!prompt) {
            logger.error('Perplexity generate request validation failed: missing prompt');
            throw new Error(ErrorMessages.PROMPT_REQUIRED);
        }

        // Convert generate request to messages format
        const messages = [{role: 'user', content: prompt}];

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
        return parsePerplexityRequest(req);
    }
};
