import {DatabaseService, db} from './database.service';
import {LlmRequest, LlmResponse, ProxyRequest, ProxyResponse} from '../types';

export class AuditService {
    private db: DatabaseService;

    constructor(databaseService: DatabaseService = db) {
        this.db = databaseService;
    }

    async init(): Promise<void> {
        if (!this.db.isConnected()) {
            await this.db.connect();
        }
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
        const {
            request_id,
            request_type,
            model,
            prompt,
            options,
            source_id,
            user_id,
            timestamp,
            metadata
        } = content;

        const query = `
            INSERT INTO llm_requests
            (request_id, request_type, model, prompt, options, source_id, user_id, timestamp, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await this.db.query(query, [
            request_id,
            request_type,
            model,
            prompt,
            JSON.stringify(options),
            source_id,
            user_id,
            timestamp,
            JSON.stringify(metadata)
        ]);
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

    private async insertResponse(content: Omit<LlmResponse, 'id'>): Promise<void> {
        const {
            request_id,
            response_type,
            token,
            model,
            worker_id,
            timestamp,
            is_final,
            total_tokens,
            processing_time,
            tokens_per_second,
            metadata
        } = content;

        const query = `
            INSERT INTO llm_responses
            (request_id, response_type, token, model, worker_id, timestamp, is_final,
             total_tokens, processing_time, tokens_per_second, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await this.db.query(query, [
            request_id,
            response_type,
            token,
            model,
            worker_id,
            timestamp,
            is_final,
            total_tokens,
            processing_time,
            tokens_per_second,
            JSON.stringify(metadata)
        ]);
    }


    async batchLogResponses(audits: Array<Omit<LlmResponse, 'id'>>): Promise<void> {
        if (audits.length === 0) return;

        await this.db.transaction(async (client) => {
            const query = `
                INSERT INTO llm_responses
                (request_id, response_type, token, model, worker_id, timestamp, is_final,
                 total_tokens, processing_time, tokens_per_second, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            for (const audit of audits) {
                await client.query(query, [
                    audit.request_id,
                    audit.response_type,
                    audit.token,
                    audit.model,
                    audit.worker_id,
                    audit.timestamp,
                    audit.is_final,
                    audit.total_tokens,
                    audit.processing_time,
                    audit.tokens_per_second,
                    JSON.stringify(audit.metadata)
                ]);
            }
        });
    }

    async getRequests(requestId: string): Promise<LlmResponse | null> {
        const query = `
            SELECT *
            FROM llm_requests
            WHERE request_id = $1
            ORDER BY timestamp DESC
            LIMIT 1
        `;

        const rows = await this.db.query(query, [requestId]);
        return rows[0] || null;
    }

    async getResponses(requestId: string): Promise<LlmResponse[]> {
        const query = `
            SELECT *
            FROM llm_responses
            WHERE request_id = $1
            ORDER BY timestamp ASC
        `;

        return this.db.query(query, [requestId]);
    }
}

export const auditService = new AuditService(db);
