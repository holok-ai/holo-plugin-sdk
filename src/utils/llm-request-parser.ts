import {Request} from 'express';
import {LLMPayloadTypes, Provider, RequestType} from '../types';
import {ErrorMessages} from './error-messages';
import {parseOllamaRequest} from './ollama-parsers';
import {parseClaudeMessageRequest} from './claude-parsers';
import {parseOpenAIMessageRequest} from './openai-parsers';
import logger from './logger';
import {parsePerplexityMessageRequest} from "./perplexity-parsers";

/**
 * Unified LLM request parser that routes requests to the appropriate provider-specific parser.
 * Acts as the main entry point for parsing all LLM requests, dispatching to Ollama, Claude,
 * or OpenAI parsers based on the provider parameter.
 *
 * @param req - Express request object containing the request body
 * @param provider - Provider enum indicating which LLM provider to route the request to
 * @param type - RequestType enum indicating whether this is a GENERATE or CHAT request
 * @returns Parsed LLMPayloadTypes from the appropriate provider-specific parser
 * @throws Error when provider is not supported or parsing fails
 */
export const parseLLMRequest = (
    req: Request,
    provider: Provider,
    type: RequestType
): LLMPayloadTypes => {
    logger.debug('Unified LLM request parser routing', {provider, type});

    // Route to appropriate provider parser
    switch (provider) {
        case Provider.OLLAMA:
            return parseOllamaRequest(req, type);
        case Provider.CLAUDE:
            return parseClaudeMessageRequest(req, type);
        case Provider.OPENAI:
            return parseOpenAIMessageRequest(req, type);
        case Provider.PERPLEXITY:
            return parsePerplexityMessageRequest(req, type);
        default:
            logger.error('Unsupported provider in unified parser', {provider});
            throw new Error(ErrorMessages.unsupportedProvider(provider));
    }
};
