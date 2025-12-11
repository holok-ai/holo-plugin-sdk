import 'reflect-metadata';
import {container, injectable} from 'tsyringe';
import {ResponseStream} from "./response.service";
import {LLMWorkerResponse} from "../types";
import {ErrorMessages} from "../utils";
import {ClassLogger} from "../types/class.logger";
import {HoloResponseFactory} from "../providers/holo/holo.response.factory";
import {HoloTranslator} from "../providers/holo/holo.translator";
import {OllamaResponse} from "../providers/ollama/types";
import {ClaudeResponse} from "../providers/claude/types";
import {OpenAIChatCompletionResponse} from "../providers/openai/types";


@injectable()
export class StreamService extends ClassLogger {
    private readonly streams: Map<string, ResponseStream>;

    constructor() {
        super();
        this.streams = new Map<string, ResponseStream>();
    }

    get activeStreamCount(): number {
        return this.streams.size;
    }

    async createResponseStream(requestId: string, isStreaming: boolean = true): Promise<ResponseStream> {
        const logger = this.mlog(this.createResponseStream);
        const responseStream = new ResponseStream(requestId, isStreaming);

        this.streams.set(requestId, responseStream);
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
            switch (providerType) {
                case ProviderType.OLLAMA:
                    this.streamOllama(payload, res);
                    break;
                case ProviderType.CLAUDE:
                    this.streamClaude(payload, res);
                    break;
                case ProviderType.OPENAI:
                case ProviderType.PERPLEXITY:
                    const isResponsesAPI = payload.object === 'response' || payload.type?.startsWith('response.');
                    logger.debug(`OpenAI routing: object=${payload.object}, type=${payload.type}, isResponsesAPI=${isResponsesAPI}, isStreaming=${res.isStreaming}`);
                    if (isResponsesAPI) {
                        this.streamOpenAIResponses(payload, res, fullResponse);
                    } else {
                        this.streamOpenAI(payload, res, fullResponse);
                    }
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
            const holoTranslator = container.resolve(HoloTranslator);
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

        const hasError = 'error' in response;
        if (("done" in response && response.done) || hasError) {
            logger.debug('Closing response stream');
            res.end();
        }
    }

    streamClaude(response: ClaudeResponse, res: ResponseStream) {
        const logger = this.mlog(this.streamClaude);
        const payload = response as any;

        const eventLine = `event: ${payload.type}\n`;
        const dataLine = `data: ${JSON.stringify(response)}\n\n`;

        logger.info(`Sending Claude SSE event: ${eventLine.trim()}`);
        logger.debug(`Sending Claude SSE data: ${dataLine.trim()}`);

        res.push(eventLine);
        res.push(dataLine);

        if (payload.type === 'message_stop' || payload.type === 'error') {
            logger.debug('Closing response stream');
            res.end();
        }
    }

    streamOpenAI(response: OpenAIChatCompletionResponse, res: ResponseStream, fullResponse?: string) {
        const logger = this.mlog(this.streamOpenAI);
        logger.debug(`opeanai stream formatter ${JSON.stringify(response)}`);

        if (!res.isStreaming) {
            res.push(JSON.stringify(response));
            res.end();
            return;
        }

        res.push(`data: ${JSON.stringify(response)}\n\n`);

        // const choice = response.choices?.[0];
        const hasError = 'error' in response;
        const hasUsage = response.usage !== null && response.usage !== undefined;

        if (hasUsage || fullResponse !== undefined || hasError) {
            if (!hasError) {
                res.push(`data: [DONE]\n\n`);
            }
            logger.debug('Closing response stream');
            res.end();
        }
    }

    streamOpenAIResponses(payload: any, res: ResponseStream, _fullResponse?: string) {
        const logger = this.mlog(this.streamOpenAIResponses);

        if (!res.isStreaming) {
            res.push(JSON.stringify(payload));
            res.end();
            return;
        }

        res.push(`data: ${JSON.stringify(payload)}\n\n`);

        if (payload.type === 'response.completed' || payload.type === 'response.failed' || payload.type === 'error') {
            if (payload.type !== 'error') {
                res.push(`data: [DONE]\n\n`);
            }
            logger.debug('Closing Responses API stream');
            res.end();
        }
    }
}
