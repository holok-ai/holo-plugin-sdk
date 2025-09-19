import {injectable} from "tsyringe";
import {ResponseStream} from "./response.service";
import {LLMWorkerResponse, ProviderType} from "../types";
import {ErrorMessages} from "../utils/error-messages";
import {MessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";
import {ChatCompletionChunk} from "openai/resources/chat/completions/completions";

import logger from "../utils/logger";

@injectable()
export class StreamFormatter {

    async formatAndSend(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            logger.debug("Calling format and send");

            // Handle non-streaming responses
            if (!res.isStreaming) {
                this.handleNonStreamingResponse(responseChunk, res);
                return;
            }

            // Handle streaming responses
            switch (responseChunk.providerType) {
                case ProviderType.OLLAMA:
                    this.streamOllama(responseChunk, res);
                    break;
                case ProviderType.CLAUDE:
                    this.streamClaude(responseChunk, res);
                    break;
                case ProviderType.OPENAI:
                    this.streamOpenAI(responseChunk, res);
                    break;
                case ProviderType.PERPLEXITY:
                    this.streamOpenAI(responseChunk, res);
                    break;
                default:
                    logger.error(`No stream formatter for provider: ${responseChunk.providerType}`);
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(ErrorMessages.unsupportedProvider(responseChunk.providerType));
            }
        } catch (error) {
            logger.error(`StreamFormatter error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                providerType: responseChunk.providerType,
                sourceId: responseChunk.sourceId
            });

            // Try to close the response stream gracefully
            try {
                if (!res.destroyed) {
                    res.push(`data: {"error":"Stream formatting error"}

`);
                    res.end();
                }
            } catch (closeError) {
                logger.error(`Failed to close response stream: ${(closeError as Error).message}`);
            }

            throw error;
        }
    }

    handleNonStreamingResponse(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            // Accumulate chunks for non-streaming response
            logger.debug(`handle non streaming response`);
            res.accumulatedChunks.push(responseChunk);

            // Check if this is the final chunk based on provider-specific completion indicators
            let isComplete = false;
            switch (responseChunk.providerType) {
                case ProviderType.OLLAMA:
                    const ollamaChunk = responseChunk.payload as any;
                    isComplete = ollamaChunk.done === true;
                    break;
                case ProviderType.CLAUDE:
                    const claudeChunk = responseChunk.payload as MessageStreamEvent;
                    isComplete = claudeChunk.type === 'message_stop';
                    break;
                case ProviderType.OPENAI:
                case ProviderType.PERPLEXITY:
                    const openaiChunk = responseChunk.payload as ChatCompletionChunk;
                    const choice = openaiChunk.choices?.[0];
                    isComplete = !!choice?.finish_reason || responseChunk.fullResponse !== undefined;
                    break;
                default:
                    logger.warn(`Unknown provider for non-streaming response: ${responseChunk.providerType}`);
                    isComplete = responseChunk.fullResponse !== undefined;
            }

            if (isComplete) {
                // Send the complete response as JSON
                this.sendCompleteJsonResponse(res);
            }
        } catch (error) {
            logger.error(`Non-streaming response error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                providerType: responseChunk.providerType
            });
            throw error;
        }
    }

    sendCompleteJsonResponse(res: ResponseStream) {
        try {
            // For OpenAI compatibility, reconstruct the complete response
            const firstChunk = res.accumulatedChunks[0];
            if (!firstChunk) {
                logger.error('No chunks accumulated for complete response');
                res.push(JSON.stringify({ error: "No response data available" }));
                res.end();
                return;
            }

            switch (firstChunk.providerType) {
                case ProviderType.OPENAI:
                case ProviderType.PERPLEXITY:
                    this.sendCompleteOpenAIResponse(res);
                    break;
                case ProviderType.CLAUDE:
                    this.sendCompleteClaudeResponse(res);
                    break;
                case ProviderType.OLLAMA:
                    this.sendCompleteOllamaResponse(res);
                    break;
                default:
                    logger.error(`No complete response handler for provider: ${firstChunk.providerType}`);
                    res.push(JSON.stringify({ error: "Unsupported provider" }));
            }

            res.end();
        } catch (error) {
            logger.error(`Complete JSON response error: ${(error as Error).message}`);
            res.push(JSON.stringify({ error: "Failed to construct complete response" }));
            res.end();
        }
    }

    sendCompleteOpenAIResponse(res: ResponseStream) {
        // Merge all OpenAI chunks into a single response
        const chunks = res.accumulatedChunks;
        if (!chunks.length) return;

        // Use the first chunk as the base and merge content
        const firstChunk = chunks[0].payload as ChatCompletionChunk;
        const completeResponse = {
            ...firstChunk,
            choices: firstChunk.choices?.map(choice => ({
                ...choice,
                message: {
                    role: 'assistant',
                    content: chunks
                        .map(chunk => chunk.payload.choices?.[0]?.delta?.content || '')
                        .join('')
                },
                finish_reason: chunks[chunks.length - 1].payload.choices?.[0]?.finish_reason || null
            })) || []
        };

        res.push(JSON.stringify(completeResponse));
    }

    sendCompleteClaudeResponse(res: ResponseStream) {
        // For Claude, construct a complete message response
        const chunks = res.accumulatedChunks;
        let content = '';
        let stopReason = null;

        for (const chunk of chunks) {
            const claudeChunk = chunk.payload as MessageStreamEvent;
            if (claudeChunk.type === 'content_block_delta' && claudeChunk.delta && 'text' in claudeChunk.delta) {
                content += claudeChunk.delta.text;
            } else if (claudeChunk.type === 'message_stop' && 'message' in claudeChunk) {
                stopReason = (claudeChunk as any).message?.stop_reason;
            }
        }

        const completeResponse = {
            type: 'message',
            content: [{ type: 'text', text: content }],
            stop_reason: stopReason,
            usage: chunks[chunks.length - 1].payload.usage || {}
        };

        res.push(JSON.stringify(completeResponse));
    }

    sendCompleteOllamaResponse(res: ResponseStream) {
        // For Ollama, use the final chunk which contains the complete response
        const finalChunk = res.accumulatedChunks[res.accumulatedChunks.length - 1];
        res.push(JSON.stringify(finalChunk.payload));
    }

    streamOllama(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            const chunk = responseChunk.payload as any;
            res.push(JSON.stringify(chunk) + '\n');

            // Close stream when Ollama indicates completion (chunk.done is true)
            if (chunk.done) {
                logger.debug('Ollama streaming complete: closing response stream');
                res.end();
            }
        } catch (error) {
            logger.error(`Ollama streaming error: ${(error as Error).message}`, {
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
                logger.debug('message_stop_event: closing response stream');
                res.end();
            }
        } catch (error) {
            logger.error(`Claude streaming error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                chunkType: (responseChunk.payload as MessageStreamEvent)?.type
            });
            throw error;
        }
    }

    streamOpenAI(responseChunk: LLMWorkerResponse, res: ResponseStream) {
        try {
            const chunk = responseChunk.payload as ChatCompletionChunk;
            logger.debug(`opeanai stream formatter ${JSON.stringify(responseChunk)}`);
            // OpenAI uses SSE format with data: prefix
            res.push(`data: ${JSON.stringify(chunk)}\n\n`);

            // Check if streaming is complete
            const choice = chunk.choices?.[0];
            if (choice?.finish_reason || responseChunk.fullResponse !== undefined) {
                // Send final [DONE] message for OpenAI compatibility
                res.push(`data: [DONE]\n\n`);
                logger.debug('OpenAI streaming complete: closing response stream');
                res.end();
            }
        } catch (error) {
            logger.error(`OpenAI streaming error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                finishReason: (responseChunk.payload as ChatCompletionChunk)?.choices?.[0]?.finish_reason
            });
            throw error;
        }
    }
}
