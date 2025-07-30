import 'reflect-metadata';
import {ProxyRequest, ProxyResponse, LLMWorkerResponse} from '../types';
import {LlmRequest, LlmResponse} from "../db/types";
import {container, injectable} from "tsyringe";
import {RequestDB, ResponseDB} from "../db";
import {AppDB} from "../db/app.db";
import logger from "../utils/logger";
import { parseWorkerResponseForAudit, mapWorkerResponseToLlmResponse } from '../utils/audit-parsers';

/**
 * Service for auditing and logging LLM requests and responses
 * Handles mapping between proxy types and database types, with comprehensive logging
 */
@injectable()
export class AuditService {

    constructor(private requestDB: RequestDB, private responseDB: ResponseDB) {
        logger.info('AuditService initialized');
    }

    /**
     * Log LLM request to database with comprehensive audit trail
     * Supports both ProxyRequest and direct LlmRequest formats
     * @param {ProxyRequest | Omit<LlmRequest, 'id'>} content - Request data to log
     */
    async logRequest(content: ProxyRequest): Promise<void>;
    async logRequest(content: Omit<LlmRequest, 'id'>): Promise<void>;
    async logRequest(content: ProxyRequest | Omit<LlmRequest, 'id'>): Promise<void> {
        const startTime = Date.now();
        
        try {
            // Type guard to check if it's a ProxyRequest
            if (this.isProxyRequest(content)) {
                logger.debug(`Logging ProxyRequest - requestId: ${content.requestId}, type: ${content.type}, provider: ${content.payload?.provider || 'unknown'}`);
                const mappedRequest = this.mapProxyRequestToLlmRequest(content);
                await this.insertRequest(mappedRequest);
                logger.info(`Successfully logged ProxyRequest ${content.requestId} in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmRequest - requestId: ${content.request_id}, type: ${content.request_type}`);
                await this.insertRequest(content);
                logger.info(`Successfully logged LlmRequest ${content.request_id} in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            logger.error(`Failed to log request: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: this.isProxyRequest(content) ? content.requestId : content.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Type guard to determine if object is a ProxyRequest
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is ProxyRequest
     * @private
     */
    private isProxyRequest(obj: any): obj is ProxyRequest {
        const isProxy = obj.payload !== undefined && obj.sourceId !== undefined;
        logger.debug(`Type guard check - isProxyRequest: ${isProxy}`);
        return isProxy;
    }

    /**
     * Map ProxyRequest to LlmRequest database format
     * Extracts prompt from messages for chat requests and normalizes data structure
     * @param {ProxyRequest} proxyRequest - Source proxy request
     * @returns {Omit<LlmRequest, 'id'>} Mapped database request object
     * @private
     */
    private mapProxyRequestToLlmRequest(proxyRequest: ProxyRequest): Omit<LlmRequest, 'id'> {
        const {requestId, type, sourceId, payload, timestamp} = proxyRequest;
        const {model, prompt, messages, options} = payload;

        // For 'chat' type requests, use the last message as the prompt
        const promptText = prompt || (messages && messages.length > 0
            ? messages[messages.length - 1].content
            : undefined);

        // Get user ID from options if available
        const userId = (options && options.user) || undefined;

        logger.debug(`Mapping ProxyRequest ${requestId} - model: ${model}, type: ${type}, promptLength: ${promptText?.length || 0}, messageCount: ${messages?.length || 0}`);

        const mappedRequest = {
            request_id: requestId,
            request_type: type,
            model,
            prompt: promptText,
            options,
            source_id: sourceId,
            user_id: userId,
            timestamp: new Date(timestamp).toISOString(),
            metadata: {
                fullRequest: proxyRequest
            }
        };

        logger.debug(`Mapped ProxyRequest ${requestId} - userId: ${userId}, sourceId: ${sourceId}`);
        return mappedRequest;
    }

    /**
     * Insert request record into database
     * @param {Omit<LlmRequest, 'id'>} content - Request data to insert
     * @private
     */
    private async insertRequest(content: Omit<LlmRequest, 'id'>): Promise<void> {
        const startTime = Date.now();
        try {
            await this.requestDB.insert(content);
            logger.debug(`Database insert successful for request ${content.request_id} in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Database insert failed for request ${content.request_id}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: content.request_id,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Log LLM response to database with comprehensive audit trail
     * Supports ProxyResponse, LLMWorkerResponse, and direct LlmResponse formats
     * @param {ProxyResponse | LLMWorkerResponse | Omit<LlmResponse, 'id'>} content - Response data to log
     */
    async logResponse(content: ProxyResponse): Promise<void>;
    async logResponse(content: LLMWorkerResponse): Promise<void>;
    async logResponse(content: Omit<LlmResponse, 'id'>): Promise<void>;
    async logResponse(content: ProxyResponse | LLMWorkerResponse | Omit<LlmResponse, 'id'>): Promise<void> {
        const startTime = Date.now();
        
        try {
            if (this.isProxyResponse(content)) {
                logger.debug(`Logging ProxyResponse - requestId: ${content.requestId}, type: ${content.type}`);
                const mappedResponse = this.mapProxyResponseToLlmResponse(content);
                await this.insertResponse(mappedResponse);
                logger.info(`Successfully logged ProxyResponse ${content.requestId} (${content.type}) in ${Date.now() - startTime}ms`);
            } else if (this.isLLMWorkerResponse(content)) {
                logger.debug(`Logging LLMWorkerResponse - requestId: ${content.requestId}, provider: ${content.provider}`);
                const mappedResponse = this.mapLLMWorkerResponseToLlmResponse(content);
                await this.insertResponse(mappedResponse);
                logger.info(`Successfully logged LLMWorkerResponse ${content.requestId} (${content.provider}) in ${Date.now() - startTime}ms`);
            } else {
                logger.debug(`Logging direct LlmResponse - requestId: ${content.request_id}, type: ${content.response_type}`);
                await this.insertResponse(content);
                logger.info(`Successfully logged LlmResponse ${content.request_id} (${content.response_type}) in ${Date.now() - startTime}ms`);
            }
        } catch (error) {
            const requestId = this.isProxyResponse(content) ? content.requestId : 
                           this.isLLMWorkerResponse(content) ? content.requestId : 
                           content.request_id;
            logger.error(`Failed to log response: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: requestId,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }


    /**
     * Type guard to determine if object is a ProxyResponse
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is ProxyResponse  
     * @private
     */
    private isProxyResponse(obj: any): obj is ProxyResponse {
        const isProxy = obj.requestId !== undefined && obj.type !== undefined;
        logger.debug(`Type guard check - isProxyResponse: ${isProxy}`);
        return isProxy;
    }

    /**
     * Type guard to determine if object is an LLMWorkerResponse
     * @param {any} obj - Object to check
     * @returns {boolean} True if object is LLMWorkerResponse
     * @private
     */
    private isLLMWorkerResponse(obj: any): obj is LLMWorkerResponse {
        const isWorkerResponse = obj.requestId !== undefined && 
                                obj.provider !== undefined && 
                                obj.payload !== undefined &&
                                obj.sourceId !== undefined;
        logger.debug(`Type guard check - isLLMWorkerResponse: ${isWorkerResponse}`);
        return isWorkerResponse;
    }

    /**
     * Map ProxyResponse to LlmResponse database format
     * Extracts metrics from various provider formats and normalizes performance data
     * @param {ProxyResponse} proxyResponse - Source proxy response
     * @returns {Omit<LlmResponse, 'id'>} Mapped database response object
     * @private
     */
    private mapProxyResponseToLlmResponse(proxyResponse: ProxyResponse): Omit<LlmResponse, 'id'> {
        const {
            requestId,
            type,
            token,
            model,
            workerId,
            timestamp,
            done,
            metrics,
            total_duration,
            eval_duration,
            prompt_eval_count,
            eval_count
        } = proxyResponse;

        const isFinalResponse = (type === 'done' || done === true);
        let totalTokens: number | undefined;
        let processingTime: number | undefined;
        let tokensPerSecond: number | undefined;

        // Extract metrics from various possible locations
        if (metrics) {
            totalTokens = metrics.totalTokens;
            processingTime = metrics.processingTime;
            tokensPerSecond = metrics.tokensPerSecond;
            logger.debug(`Extracted metrics from response ${requestId} - tokens: ${totalTokens}, time: ${processingTime}ms, rate: ${tokensPerSecond?.toFixed(2)}/s`);
        }

        // Fallback to Ollama-specific fields
        if (total_duration) {
            processingTime = Math.round(total_duration / 1000000); // Convert nanoseconds to milliseconds

            const promptTokens = prompt_eval_count || 0;
            const responseTokens = eval_count || 0;
            totalTokens = promptTokens + responseTokens;

            if (eval_duration && responseTokens > 0) {
                const evalDurationSeconds = eval_duration / 1000000000;
                tokensPerSecond = responseTokens / evalDurationSeconds;
            }
            
            logger.debug(`Extracted Ollama metrics from response ${requestId} - promptTokens: ${promptTokens}, responseTokens: ${responseTokens}, totalTime: ${processingTime}ms`);
        }

        logger.debug(`Mapping ProxyResponse ${requestId} - type: ${type}, model: ${model}, workerId: ${workerId}, isFinal: ${isFinalResponse}`);

        const mappedResponse = {
            request_id: requestId,
            response_type: type,
            token: type === 'token' ? token : undefined,
            model,
            worker_id: workerId,
            timestamp: new Date(timestamp).toISOString(),
            is_final: isFinalResponse,
            total_tokens: totalTokens,
            processing_time: processingTime,
            tokens_per_second: tokensPerSecond,
            metadata: {
                fullResponse: proxyResponse
            }
        };

        if (isFinalResponse) {
            logger.info(`Final response metrics for ${requestId} - tokens: ${totalTokens || 'N/A'}, time: ${processingTime || 'N/A'}ms, rate: ${tokensPerSecond?.toFixed(2) || 'N/A'}/s`);
        }

        return mappedResponse;
    }

    /**
     * Map LLMWorkerResponse to LlmResponse database format using provider-specific parsers
     * Uses audit parsers to extract relevant fields from provider payloads
     * @param {LLMWorkerResponse} workerResponse - Source worker response
     * @returns {Omit<LlmResponse, 'id'>} Mapped database response object
     * @private
     */
    private mapLLMWorkerResponseToLlmResponse(workerResponse: LLMWorkerResponse): Omit<LlmResponse, 'id'> {
        logger.debug(`Mapping LLMWorkerResponse ${workerResponse.requestId} - provider: ${workerResponse.provider}`);
        
        try {
            // Use provider-specific parsers to extract audit data
            const parsedData = parseWorkerResponseForAudit(workerResponse);
            
            // Map parsed data to database format (now leverages enhanced LLMWorkerResponse fields)
            const mappedResponse = mapWorkerResponseToLlmResponse(workerResponse, parsedData);
            
            // Enhanced logging with new LLMWorkerResponse fields
            const logContext = {
                requestId: workerResponse.requestId,
                workerId: workerResponse.workerId || 'unknown',
                provider: workerResponse.provider,
                isDone: parsedData.isDone,
                hasMetrics: !!workerResponse.metrics,
                hasTimestamp: !!workerResponse.timestamp
            };
            
            logger.debug(`Mapped LLMWorkerResponse with enhanced fields`, logContext);
            
            if (parsedData.isDone) {
                // Use enhanced metrics if available, fallback to parsed data
                const finalTokens = workerResponse.metrics ? 
                    workerResponse.metrics.inputTokens + workerResponse.metrics.outputTokens :
                    parsedData.totalTokens;
                const finalTime = workerResponse.metrics?.totalProcessingTime || parsedData.processingTime;
                const finalRate = workerResponse.metrics && workerResponse.metrics.outputTokens > 0 && workerResponse.metrics.totalProcessingTime > 0 ?
                    workerResponse.metrics.outputTokens / (workerResponse.metrics.totalProcessingTime / 1000) :
                    parsedData.tokensPerSecond;
                    
                logger.info(`Final worker response metrics for ${workerResponse.requestId} - tokens: ${finalTokens || 'N/A'}, time: ${finalTime || 'N/A'}ms, rate: ${finalRate?.toFixed(2) || 'N/A'}/s, timeToFirstToken: ${workerResponse.metrics?.timeToFirstToken || 'N/A'}ms`);
            }
            
            return mappedResponse;
        } catch (error) {
            logger.error(`Failed to map LLMWorkerResponse: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: workerResponse.requestId,
                provider: workerResponse.provider,
                error: error
            });
            
            // Return fallback mapping
            return {
                request_id: workerResponse.requestId,
                response_type: 'token',
                token: undefined,
                model: undefined,
                worker_id: undefined,
                timestamp: new Date().toISOString(),
                is_final: false,
                total_tokens: undefined,
                processing_time: undefined,
                tokens_per_second: undefined,
                metadata: {
                    provider: workerResponse.provider,
                    fullResponse: workerResponse.fullResponse,
                    mappingError: error instanceof Error ? error.message : 'Unknown error',
                    rawPayload: workerResponse.payload
                }
            };
        }
    }

    /**
     * Insert response record into database
     * @param {Omit<LlmResponse, 'id'>} content - Response data to insert
     * @private
     */
    private async insertResponse(content: Omit<LlmResponse, 'id'>): Promise<void> {
        const startTime = Date.now();
        try {
            await this.responseDB.insert(content);
            logger.debug(`Database insert successful for response ${content.request_id} (${content.response_type}) in ${Date.now() - startTime}ms`);
        } catch (error) {
            logger.error(`Database insert failed for response ${content.request_id}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                requestId: content.request_id,
                responseType: content.response_type,
                error: error,
                duration: Date.now() - startTime
            });
            throw error;
        }
    }
}

container.registerSingleton(AppDB);
