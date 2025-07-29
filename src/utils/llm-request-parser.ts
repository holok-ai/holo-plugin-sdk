import { Request } from 'express';
import { Provider, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';
import { parseOllamaRequest } from './ollama-parsers';
import { parseClaudeMessageRequest } from './claude-parsers';
import { parseOpenAIMessageRequest } from './openai-parsers';
import logger from './logger';

/**
 * Unified LLM request parser that routes requests to the appropriate provider-specific parser
 */
export const parseLLMRequest = (
    req: Request, 
    provider: Provider, 
    type: RequestType
): LLMPayloadTypes => {
    logger.debug('Unified LLM request parser routing', { provider, type });
    
    // Route to appropriate provider parser
    switch (provider) {
        case Provider.OLLAMA:
            return parseOllamaRequest(req, type);
        case Provider.CLAUDE:
            return parseClaudeMessageRequest(req, type);
        case Provider.OPENAI:
            return parseOpenAIMessageRequest(req, type);
        default:
            logger.error('Unsupported provider in unified parser', { provider });
            throw new Error(ErrorMessages.unsupportedProvider(provider));
    }
};