import { Request } from 'express';
import { Provider, LLMPayloadTypes, RequestType } from '../types';
import { parseOllamaRequest } from './ollama-parsers';
import { parseClaudeMessageRequest } from './claude-parsers';
import { parseOpenAIMessageRequest } from './openai-parsers';

/**
 * Unified LLM request parser that routes requests to the appropriate provider-specific parser
 */
export const parseLLMRequest = (
    req: Request, 
    provider: Provider, 
    type: RequestType
): LLMPayloadTypes => {
    // Route to appropriate provider parser
    switch (provider) {
        case Provider.OLLAMA:
            return parseOllamaRequest(req, type);
        case Provider.CLAUDE:
            return parseClaudeMessageRequest(req, type);
        case Provider.OPENAI:
            return parseOpenAIMessageRequest(req, type);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
};