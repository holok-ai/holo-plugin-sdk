import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Transform} from "node:stream";
import {ResponseStream} from "./response.service";
import {LLMWorkerResponse} from "../types";
import {ProviderType} from "../providers/types";
import {ErrorMessages} from "../utils";
import {MessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";
import {ChatCompletionChunk} from "openai/resources/chat/completions/completions";
import {ClassLogger} from "../types/class.logger";


@injectable()
export class StreamService extends ClassLogger {
    private readonly streams: Map<string, ResponseStream>;

    constructor() {
        super();
        this.streams = new Map<string, ResponseStream>();
    }

    async createResponseStream(requestId: string, isStreaming: boolean = true): Promise<Transform> {
        let methodName = 'createResponseStream';
        const responseStream = new ResponseStream(requestId, isStreaming);

        // Store the stream in the map
        this.streams.set(requestId, responseStream);
        // Set up auto-cleanup on stream end or error
        responseStream.on('end', () => {
            this.log.debug(`Stream ended for request ${requestId}`, {methodName});
            this.removeStream(requestId)
        });
        responseStream.on('error', () => {
            this.log.error(`Stream error for request ${requestId}`);
            this.removeStream(requestId)
        });

        this.log.info(`Created response stream for request ${requestId}, active streams: ${this.activeStreamCount}`);
        return responseStream;
    }

    async streamData(data: LLMWorkerResponse, res: ResponseStream) {
        let methodName = 'formatAndSend';
        const {requestId, providerType, sourceId} = data;
        try {

            // Handle streaming responses
            switch (data.providerType) {
                case ProviderType.OLLAMA:
                    this.streamOllama(data, res);
                    break;
                case ProviderType.CLAUDE:
                    this.streamClaude(data, res);
                    break;
                case ProviderType.OPENAI:
                    this.streamOpenAI(data, res);
                    break;
                case ProviderType.PERPLEXITY:
                    this.streamOpenAI(data, res);
                    break;
                default:
                    this.log.error(`No stream formatter for provider: ${data.providerType}`, {
                        methodName,
                        requestId
                    });
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(ErrorMessages.unsupportedProvider(data.providerType));
            }
        } catch (error) {
            this.log.error(`StreamFormatter error: ${(error as Error).message}`, {
                requestId,
                providerType,
                sourceId
            }, {methodName});

            try {
                if (!res.destroyed) {
                    res.push(`data: {"error":"Stream formatting error"}

`);
                    res.end();
                }
            } catch (closeError) {
                this.log.error(`Failed to close response stream: ${(closeError as Error).message}`, {methodName});
            }

            throw error;
        }
    }

    async endStream(payload: any, res: ResponseStream) {
        res.push(JSON.stringify(payload));
        res.end();
    }

    removeStream(requestId: string) {
        let methodName = 'removeStream';
        if (this.streams.has(requestId)) {
            this.streams.delete(requestId);
            this.log.info(`Removed response stream for request ${requestId}, active streams: ${this.activeStreamCount}`, {methodName});
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


    streamOllama(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        let methodName = 'streamOllama';
        try {
            const chunk = responseChunk.payload as any;
            res.push(JSON.stringify(chunk) + '\n');

            // Close stream when Ollama indicates completion (chunk.done is true)
            if (chunk.done) {
                this.log.debug('Ollama streaming complete: closing response stream', {methodName});
                res.end();
            }
        } catch (error) {
            this.log.error(`Ollama streaming error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId
            });
            throw error;
        }
    }

    streamClaude(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            const chunk = responseChunk.payload as MessageStreamEvent;
            res.push(`event: ${chunk.type}\n`);
            res.push(`data: ${JSON.stringify(chunk)} \n\n`);
            if (chunk.type === 'message_stop') {
                this.log.debug('message_stop_event: closing response stream');
                res.end();
            }
        } catch (error) {
            this.log.error(`Claude streaming error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                chunkType: (responseChunk.payload as MessageStreamEvent)?.type
            });
            throw error;
        }
    }

    streamOpenAI(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            const chunk = responseChunk.payload as ChatCompletionChunk;
            this.log.debug(`opeanai stream formatter ${JSON.stringify(responseChunk)}`);
            // OpenAI uses SSE format with data: prefix
            res.push(`data: ${JSON.stringify(chunk)}\n\n`);

            // Check if streaming is complete
            const choice = chunk.choices?.[0];
            if (choice?.finish_reason || responseChunk.fullResponse !== undefined) {
                // Send final [DONE] message for OpenAI compatibility
                res.push(`data: [DONE]\n\n`);
                this.log.debug('OpenAI streaming complete: closing response stream');
                res.end();
            }
        } catch (error) {
            this.log.error(`OpenAI streaming error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                finishReason: (responseChunk.payload as ChatCompletionChunk)?.choices?.[0]?.finish_reason
            });
            throw error;
        }
    }
}
