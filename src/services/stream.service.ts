import 'reflect-metadata';
import {container, injectable} from 'tsyringe';
import {Transform} from "node:stream";
import {ResponseStream} from "./response.service";
import {LLMWorkerResponse} from "../types";
import {ProviderType} from "../providers/types";
import {ErrorMessages} from "../utils";
import {ClassLogger} from "../types/class.logger";
import {HoloResponseFactory} from "../providers/holo/holo.response.factory";
import {HoloTranslater} from "../providers/holo/holo.translator";
import {OllamaResponse} from "../providers/ollama/types";
import {ClaudeResponse} from "../providers/claude/types";
import {OpenAIResponse} from "../providers/openai/types";


@injectable()
export class StreamService extends ClassLogger {
    private readonly streams: Map<string, ResponseStream>;

    constructor() {
        super();
        this.streams = new Map<string, ResponseStream>();
    }

    async createResponseStream(requestId: string, isStreaming: boolean = true): Promise<Transform> {
        const logger = this.mlog(this.createResponseStream);
        const responseStream = new ResponseStream(requestId, isStreaming);

        // Store the stream in the map
        this.streams.set(requestId, responseStream);
        // Set up auto-cleanup on stream end or error
        responseStream.on('end', () => {
            logger.debug(`Stream ended for request ${requestId}`);
            this.removeStream(requestId)
        });
        responseStream.on('error', () => {
            logger.error(`Stream error for request ${requestId}`);
            this.removeStream(requestId)
        });

        logger.info(`Created response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
        return responseStream;
    }

    async streamData(data: LLMWorkerResponse, res: ResponseStream) {
        const logger = this.mlog(this.streamData);
        const {requestId, providerType, sourceId, payload, fullResponse} = data;
        if (!(providerType in ProviderType)) {
            logger.error(`No stream formatter for provider: ${providerType}`);
            throw new Error(ErrorMessages.unsupportedProvider(providerType));
        }

        try {
            // Handle streaming responses
            switch (providerType) {
                case ProviderType.OLLAMA:
                    this.streamOllama(payload, res);
                    break;
                case ProviderType.CLAUDE:
                    this.streamClaude(payload, res);
                    break;
                case ProviderType.OPENAI:
                    this.streamOpenAI(payload, res, fullResponse);
                    break;
                case ProviderType.PERPLEXITY:
                    this.streamOpenAI(payload, res, fullResponse);
                    break;
            }
        } catch (error) {
            logger.error(`${providerType} streaming error: ${(error as Error).message}`, {
                requestId,
                providerType,
                sourceId
            });

            try {
                if (!res.destroyed) {
                    res.push(`data: {"error":"Stream formatting error"}\n\n`);
                    res.end();
                }
            } catch (closeError) {
                logger.error(`Failed to close response stream: ${(closeError as Error).message}`);
            }

            throw error;
        }
    }

    async endStream(payload: any, res: ResponseStream) {
        res.push(JSON.stringify(payload));
        res.end();
    }

    removeStream(requestId: string) {
        const logger = this.mlog(this.removeStream);
        if (this.streams.has(requestId)) {
            this.streams.delete(requestId);
            logger.info(`Removed response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
        }
    }

    getStream(requestId: string): ResponseStream | undefined {
        return this.streams.get(requestId);
    }

    get activeStreamCount(): number {
        return this.streams.size;
    }

    getActiveStreams(): Map<string, ResponseStream> {
        return this.streams;
    }

    async injectStatusMessage(
        requestId: string,
        model: string,
        message: string,
        providerType: ProviderType,
        isChatMode: boolean = true
    ): Promise<void> {
        const logger = this.mlog(this.injectStatusMessage);
        const stream = this.streams.get(requestId);

        if (!stream || stream.destroyed) {
            logger.warn(`Cannot inject status: stream not found or destroyed`, {requestId});
            return;
        }

        if (!isChatMode) {
            logger.debug(`Skipping status injection for API mode`, {requestId});
            return;
        }

        try {
            const holoChunk = HoloResponseFactory.createStatusChunk(requestId, model, message, providerType);
            const holoTranslator = container.resolve(HoloTranslater);
            const providerChunks = await holoTranslator.fromHoloStreamChunks([holoChunk], providerType);

            if (Array.isArray(providerChunks)) {
                for (const chunk of providerChunks) {
                    const workerResponse: LLMWorkerResponse = {
                        requestId,
                        sourceId: 'status',
                        providerType,
                        payload: chunk,
                        organizationId: '',
                        workerId: 'status',
                        providerName: model
                    };
                    await this.streamData(workerResponse, stream);
                }
            }

            logger.debug(`Injected status message`, {requestId, message, providerType});
        } catch (error) {
            logger.error(`Failed to inject status message: ${(error as Error).message}`, {
                requestId,
                message,
                error
            });
        }
    }

    streamOllama(response: OllamaResponse, res: ResponseStream) {
        const logger = this.mlog(this.streamOllama);
        res.push(JSON.stringify(response) + '\n');

        // Close stream when Ollama indicates completion (chunk.done is true)
        if ("done" in response && response.done) {
            logger.debug('Ollama streaming complete: closing response stream');
            res.end();
        }
    }

    streamClaude(response: ClaudeResponse, res: ResponseStream) {
        const logger = this.mlog(this.streamClaude);

        res.push(`event: ${response.type}\n`);
        res.push(`data: ${JSON.stringify(response)} \n\n`);
        if (response.type === 'message_stop') {
            logger.debug('message_stop_event: closing response stream');
            res.end();
        }
    }

    streamOpenAI(response: OpenAIResponse, res: ResponseStream, fullResponse?: string) {
        const logger = this.mlog(this.streamOpenAI);
        logger.debug(`opeanai stream formatter ${JSON.stringify(response)}`);
        // OpenAI uses SSE format with data: prefix
        res.push(`data: ${JSON.stringify(response)}\n\n`);

        // Check if streaming is complete
        const choice = response.choices?.[0];
        if (choice?.finish_reason || fullResponse !== undefined) {
            // Send final [DONE] message for OpenAI compatibility
            res.push(`data: [DONE]\n\n`);
            logger.debug('OpenAI streaming complete: closing response stream');
            res.end();
        }
    }
}
