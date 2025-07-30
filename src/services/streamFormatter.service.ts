import { injectable } from "tsyringe";
import { ResponseStream } from "./response.service";
import { LLMWorkerResponse, Provider } from "../types";
import { ErrorMessages } from "../utils/error-messages";
import { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";
import { ChatCompletionChunk } from "openai/resources/chat/completions/completions";

import logger from "../utils/logger";

@injectable()
export class StreamFormatter {

    async formatAndSend(responseChunk: LLMWorkerResponse,  res: ResponseStream){
        try {
            logger.debug("Calling format and send");
            switch(responseChunk.provider) {
                case Provider.OLLAMA:
                    this.streamOllama(responseChunk, res);
                    break;
                case Provider.CLAUDE:
                    this.streamClaude(responseChunk, res);
                    break;
                case Provider.OPENAI:
                    this.streamOpenAI(responseChunk, res);
                    break;
                default:
                    logger.error(`No stream formatter for provider: ${responseChunk.provider}`);
                    throw new Error(ErrorMessages.unsupportedProvider(responseChunk.provider));
            }
        } catch (error) {
            logger.error(`StreamFormatter error: ${(error as Error).message}`, {
                requestId: responseChunk.requestId,
                provider: responseChunk.provider,
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

    streamOllama(responseChunk: LLMWorkerResponse, res:ResponseStream){
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

    streamClaude(responseChunk: LLMWorkerResponse, res: ResponseStream){
        try {
            const chunk = responseChunk.payload as MessageStreamEvent;
            res.push(`event: ${chunk.type}\n`);
            res.push(`data: ${JSON.stringify(chunk)} \n\n`);
            if(chunk.type === 'message_stop'){
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

    streamOpenAI(responseChunk: LLMWorkerResponse, res: ResponseStream){
        try {
            const chunk = responseChunk.payload as ChatCompletionChunk;
            
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