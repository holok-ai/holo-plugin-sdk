import { Provider, LLMWorkerResponse } from '../types';
import { LlmResponse } from '../db/types';
import logger from './logger';

/**
 * Provider-specific payload parsers for audit logging
 * Each parser extracts relevant fields from provider-specific response payloads
 */

export interface ParsedAuditData {
    token?: string | undefined;
    model?: string | undefined;
    isDone: boolean;
    totalTokens?: number | undefined;
    processingTime?: number | undefined;
    tokensPerSecond?: number | undefined;
    finishReason?: string | undefined;
    usage?: any;
    metadata?: any;
}

/**
 * Parse Ollama response payload for audit logging
 * Extracts tokens, completion status, timing, and performance metrics
 */
export function parseOllamaPayload(payload: any): ParsedAuditData {
    logger.debug(`Parsing Ollama payload for audit: ${JSON.stringify(payload)}`);
    
    const isDone = payload.done === true;
    let token: string | undefined;
    let totalTokens: number | undefined;
    let processingTime: number | undefined;
    let tokensPerSecond: number | undefined;

    // Extract token content based on request type
    if (payload.message?.content) {
        // Chat response format
        token = payload.message.content;
    } else if (payload.response) {
        // Generate response format
        token = payload.response;
    }

    // Extract performance metrics (available in final response)
    if (isDone && payload.total_duration) {
        processingTime = Math.round(payload.total_duration / 1000000); // Convert nanoseconds to milliseconds
        
        const promptTokens = payload.prompt_eval_count || 0;
        const responseTokens = payload.eval_count || 0;
        totalTokens = promptTokens + responseTokens;

        if (payload.eval_duration && responseTokens > 0) {
            const evalDurationSeconds = payload.eval_duration / 1000000000;
            tokensPerSecond = responseTokens / evalDurationSeconds;
        }
    }

    const result: ParsedAuditData = {
        token,
        model: payload.model,
        isDone,
        totalTokens,
        processingTime,
        tokensPerSecond,
        finishReason: isDone ? 'stop' : undefined,
        usage: isDone ? {
            prompt_tokens: payload.prompt_eval_count,
            completion_tokens: payload.eval_count,
            total_tokens: totalTokens
        } : undefined,
        metadata: {
            load_duration: payload.load_duration,
            prompt_eval_duration: payload.prompt_eval_duration,
            eval_duration: payload.eval_duration,
            total_duration: payload.total_duration
        }
    };

    logger.debug(`Parsed Ollama payload - token: ${token?.length || 0} chars, isDone: ${isDone}, totalTokens: ${totalTokens}`);
    return result;
}

/**
 * Parse Claude response payload for audit logging
 * Extracts content deltas, completion status, and usage metrics
 */
export function parseClaudePayload(payload: any): ParsedAuditData {
    logger.debug(`Parsing Claude payload for audit - type: ${payload.type}`);
    
    let token: string | undefined;
    let isDone = false;
    let totalTokens: number | undefined;
    let processingTime: number | undefined;
    let finishReason: string | undefined;

    // Handle different Claude event types
    switch (payload.type) {
        case 'content_block_delta':
            token = payload.delta?.text;
            break;
        case 'message_delta':
            finishReason = payload.delta?.stop_reason;
            if (payload.usage) {
                totalTokens = payload.usage.input_tokens + payload.usage.output_tokens;
            }
            break;
        case 'message_stop':
            isDone = true;
            break;
        default:
            // Handle non-streaming response or final message
            if (payload.content && Array.isArray(payload.content)) {
                token = payload.content.map((block: any) => block.text).join('');
                isDone = true;
            }
            if (payload.usage) {
                totalTokens = payload.usage.input_tokens + payload.usage.output_tokens;
            }
            if (payload.stop_reason) {
                finishReason = payload.stop_reason;
            }
    }

    const result: ParsedAuditData = {
        token,
        model: payload.model,
        isDone,
        totalTokens,
        processingTime,
        tokensPerSecond: undefined, // Claude doesn't provide timing for rate calculation
        finishReason,
        usage: payload.usage,
        metadata: {
            type: payload.type,
            id: payload.id,
            role: payload.role,
            stop_sequence: payload.stop_sequence
        }
    };

    logger.debug(`Parsed Claude payload - token: ${token?.length || 0} chars, isDone: ${isDone}, type: ${payload.type}`);
    return result;
}

/**
 * Parse OpenAI response payload for audit logging
 * Extracts content, completion status, and usage metrics
 */
export function parseOpenAIPayload(payload: any): ParsedAuditData {
    logger.debug(`Parsing OpenAI payload for audit - object: ${payload.object}`);
    
    let token: string | undefined;
    let isDone = false;
    let totalTokens: number | undefined;
    let processingTime: number | undefined;
    let finishReason: string | undefined;
    let tokensPerSecond: number | undefined;

    // Handle streaming vs non-streaming responses
    if (payload.object === 'chat.completion.chunk') {
        // Streaming response
        const choice = payload.choices?.[0];
        if (choice) {
            token = choice.delta?.content;
            finishReason = choice.finish_reason;
            isDone = choice.finish_reason !== null;
        }
    } else if (payload.object === 'chat.completion') {
        // Non-streaming response
        const choice = payload.choices?.[0];
        if (choice) {
            token = choice.message?.content;
            finishReason = choice.finish_reason;
            isDone = true;
        }
    }

    // Extract usage metrics
    if (payload.usage) {
        totalTokens = payload.usage.total_tokens;
        
        // Calculate tokens per second if we have timing data
        if (payload.processing_time && payload.usage.completion_tokens) {
            tokensPerSecond = payload.usage.completion_tokens / (payload.processing_time / 1000);
        }
    }

    const result: ParsedAuditData = {
        token,
        model: payload.model,
        isDone,
        totalTokens,
        processingTime,
        tokensPerSecond,
        finishReason,
        usage: payload.usage,
        metadata: {
            id: payload.id,
            object: payload.object,
            created: payload.created,
            system_fingerprint: payload.system_fingerprint
        }
    };

    logger.debug(`Parsed OpenAI payload - token: ${token?.length || 0} chars, isDone: ${isDone}, finishReason: ${finishReason}`);
    return result;
}

/**
 * Main parser function that routes to provider-specific parsers
 * Now logs enhanced LLMWorkerResponse fields: workerId, timestamp, and metrics
 * @param response LLMWorkerResponse to parse
 * @returns ParsedAuditData with extracted fields
 */
export function parseWorkerResponseForAudit(response: LLMWorkerResponse): ParsedAuditData {
    const logContext = {
        provider: response.provider,
        requestId: response.requestId,
        workerId: response.workerId || 'unknown',
        hasTimestamp: !!response.timestamp,
        hasMetrics: !!response.metrics,
        hasFullResponse: !!response.fullResponse
    };
    
    logger.debug(`Parsing worker response for audit`, logContext);
    
    // Log enhanced metrics if available
    if (response.metrics) {
        logger.debug(`Enhanced metrics available - inputTokens: ${response.metrics.inputTokens}, outputTokens: ${response.metrics.outputTokens}, timeToFirstToken: ${response.metrics.timeToFirstToken}ms, totalTime: ${response.metrics.totalProcessingTime}ms`, {
            requestId: response.requestId,
            workerId: response.workerId
        });
    }
    
    try {
        switch (response.provider) {
            case Provider.OLLAMA:
                return parseOllamaPayload(response.payload);
            case Provider.CLAUDE:
                return parseClaudePayload(response.payload);
            case Provider.OPENAI:
                return parseOpenAIPayload(response.payload);
            default:
                logger.warn(`Unknown provider for audit parsing: ${response.provider}`);
                return {
                    token: undefined,
                    model: undefined,
                    isDone: false,
                    metadata: { rawPayload: response.payload }
                };
        }
    } catch (error) {
        logger.error(`Failed to parse worker response for audit: ${error instanceof Error ? error.message : 'Unknown error'}`, {
            provider: response.provider,
            requestId: response.requestId,
            error: error
        });
        
        // Return basic fallback data
        return {
            token: undefined,
            model: undefined,
            isDone: false,
            metadata: { 
                parseError: error instanceof Error ? error.message : 'Unknown error',
                rawPayload: response.payload 
            }
        };
    }
}

/**
 * Map ParsedAuditData to LlmResponse database format
 * Now leverages new LLMWorkerResponse fields: workerId, timestamp, and metrics
 * @param response Original LLMWorkerResponse with enhanced fields
 * @param parsedData Parsed audit data
 * @returns Database-ready LlmResponse object
 */
export function mapWorkerResponseToLlmResponse(
    response: LLMWorkerResponse, 
    parsedData: ParsedAuditData
): Omit<LlmResponse, 'id'> {
    const responseType = parsedData.isDone ? 'done' : 'token';
    
    // Use metrics from LLMWorkerResponse if available, fallback to parsed data
    let totalTokens = parsedData.totalTokens;
    let processingTime = parsedData.processingTime;
    let tokensPerSecond = parsedData.tokensPerSecond;
    
    if (response.metrics) {
        totalTokens = response.metrics.inputTokens + response.metrics.outputTokens;
        processingTime = response.metrics.totalProcessingTime;
        
        // Calculate tokens per second from metrics if available
        if (response.metrics.outputTokens > 0 && response.metrics.totalProcessingTime > 0) {
            tokensPerSecond = response.metrics.outputTokens / (response.metrics.totalProcessingTime / 1000);
        }
    }
    
    return {
        request_id: response.requestId,
        response_type: responseType,
        token: responseType === 'token' ? parsedData.token : undefined,
        model: parsedData.model,
        worker_id: response.workerId || undefined, // Now uses workerId from LLMWorkerResponse
        timestamp: response.timestamp ? new Date(response.timestamp).toISOString() : new Date().toISOString(),
        is_final: parsedData.isDone,
        total_tokens: totalTokens,
        processing_time: processingTime,
        tokens_per_second: tokensPerSecond,
        metadata: {
            provider: response.provider,
            fullResponse: response.fullResponse,
            usage: parsedData.usage,
            finishReason: parsedData.finishReason,
            // Include enhanced metrics if available
            enhancedMetrics: response.metrics ? {
                inputTokens: response.metrics.inputTokens,
                outputTokens: response.metrics.outputTokens,
                timeToFirstToken: response.metrics.timeToFirstToken,
                totalProcessingTime: response.metrics.totalProcessingTime
            } : undefined,
            ...parsedData.metadata
        }
    };
}