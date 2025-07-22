import 'reflect-metadata';
import {ProxyRequest, ProxyResponse} from '../types';
import {LlmRequest, LlmResponse} from "../db/types";
import {injectable} from "tsyringe";
import {ResponseDB} from "../db/response.db";
import {RequestDB} from "../db/request.db";

@injectable()
export class AuditService {

    constructor(private requestDB: RequestDB, private responseDB: ResponseDB) {

    }

    // Method overloads
    async logRequest(content: ProxyRequest): Promise<void>;
    async logRequest(content: Omit<LlmRequest, 'id'>): Promise<void>;
    async logRequest(content: ProxyRequest | Omit<LlmRequest, 'id'>): Promise<void> {
        // Type guard to check if it's a ProxyRequest
        if (this.isProxyRequest(content)) {
            const mappedRequest = this.mapProxyRequestToLlmRequest(content);
            await this.insertRequest(mappedRequest);
        } else {
            await this.insertRequest(content);
        }
    }

    private isProxyRequest(obj: any): obj is ProxyRequest {
        return obj.payload !== undefined && obj.sourceId !== undefined;
    }

    private mapProxyRequestToLlmRequest(proxyRequest: ProxyRequest): Omit<LlmRequest, 'id'> {
        const {id, type, sourceId, payload, timestamp} = proxyRequest;
        const {model, prompt, messages, options} = payload;

        // For 'chat' type requests, use the last message as the prompt
        const promptText = prompt || (messages && messages.length > 0
            ? messages[messages.length - 1].content
            : undefined);

        // Get user ID from options if available
        const userId = (options && options.user) || undefined;

        return {
            request_id: id,
            request_type: type,
            model,
            prompt: promptText,
            options,
            source_id: sourceId,
            user_id: userId,
            timestamp: new Date(timestamp),
            metadata: {
                fullRequest: proxyRequest
            }
        };
    }

    private async insertRequest(content: Omit<LlmRequest, 'id'>): Promise<void> {
        return this.requestDB.insert(content);
    }

    // Response method overloads
    async logResponse(content: ProxyResponse): Promise<void>;
    async logResponse(content: Omit<LlmResponse, 'id'>): Promise<void>;
    async logResponse(content: ProxyResponse | Omit<LlmResponse, 'id'>): Promise<void> {
        if (this.isProxyResponse(content)) {
            const mappedResponse = this.mapProxyResponseToLlmResponse(content);
            await this.insertResponse(mappedResponse);
        } else {
            await this.insertResponse(content);
        }
    }


    private isProxyResponse(obj: any): obj is ProxyResponse {
        return obj.requestId !== undefined && obj.type !== undefined;
    }

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
        }

        return {
            request_id: requestId,
            response_type: type,
            token: type === 'token' ? token : undefined,
            model,
            worker_id: workerId,
            timestamp: new Date(timestamp),
            is_final: isFinalResponse,
            total_tokens: totalTokens,
            processing_time: processingTime,
            tokens_per_second: tokensPerSecond,
            metadata: {
                fullResponse: proxyResponse
            }
        };
    }

    private async insertResponse(content: Omit<LlmResponse, 'id'>) {
        return this.responseDB.insert(content);
    }
}
