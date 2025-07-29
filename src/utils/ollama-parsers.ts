import { Request } from 'express';
import { OllamaGenerateQueueRequest, OllamaChatQueueRequest, LLMPayloadTypes, RequestType } from '../types';
import { ErrorMessages } from './error-messages';

/**
 * Parse Express request body into Ollama Generate request
 */
export const parseOllamaGenerateRequest = (req: Request): OllamaGenerateQueueRequest => {
    const { model, prompt, system, template, context, stream, raw, format, images, keep_alive, options } = req.body;
    
    if (!model) {
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!prompt) {
        throw new Error(ErrorMessages.PROMPT_REQUIRED);
    }

    return {
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
};

/**
 * Parse Express request body into Ollama Chat request
 */
export const parseOllamaChatRequest = (req: Request): OllamaChatQueueRequest => {
    const { model, messages, stream, format, keep_alive, tools, options } = req.body;
    
    if (!model) {
        throw new Error(ErrorMessages.MODEL_REQUIRED);
    }
    
    if (!messages || !Array.isArray(messages)) {
        throw new Error(ErrorMessages.MESSAGES_REQUIRED);
    }

    return {
        model,
        messages,
        stream: stream ?? false,
        format,
        keep_alive,
        tools,
        options
    };
};

/**
 * Parse Express request into appropriate Ollama queue request based on endpoint
 */
export const parseOllamaRequest = (req: Request, type: RequestType): LLMPayloadTypes => {
    if (type === RequestType.GENERATE) {
        return parseOllamaGenerateRequest(req);
    } else {
        return parseOllamaChatRequest(req);
    }
};