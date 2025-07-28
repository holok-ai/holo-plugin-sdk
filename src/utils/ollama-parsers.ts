import { Request } from 'express';
import { OllamaGenerateQueueRequest, OllamaChatQueueRequest, LLMPayloadTypes } from '../types';

/**
 * Parse Express request body into Ollama Generate request
 */
export const parseOllamaGenerateRequest = (req: Request): OllamaGenerateQueueRequest => {
    const { model, prompt, system, template, context, stream, raw, format, images, keep_alive, options } = req.body;
    
    if (!model) {
        throw new Error('Model is required');
    }
    
    if (!prompt) {
        throw new Error('Prompt is required');
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
        throw new Error('Model is required');
    }
    
    if (!messages || !Array.isArray(messages)) {
        throw new Error('Messages array is required');
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
export const parseOllamaRequest = (req: Request, type: 'generate' | 'chat'): LLMPayloadTypes => {
    if (type === 'generate') {
        return parseOllamaGenerateRequest(req);
    } else {
        return parseOllamaChatRequest(req);
    }
};