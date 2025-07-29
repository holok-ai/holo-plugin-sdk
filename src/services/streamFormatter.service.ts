import { injectable } from "tsyringe";
import { ResponseStream } from "./response.service";
import { LLMWorkerResponse, Provider } from "../types";
import { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";
import { ChatCompletionChunk } from "openai/resources/chat/completions/completions";

import logger from "../utils/logger";

@injectable()
export class StreamFormatter {

    async formatAndSend(responseChunk: LLMWorkerResponse,  res: ResponseStream){
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
                logger.error(`No stream formatter for provider: ${responseChunk.provider}`) ;   
        }
    }

    streamOllama(responseChunk: LLMWorkerResponse, res:ResponseStream){
        //TODO: Make sure responseStream is closed correctly
        res.push(JSON.stringify(responseChunk.payload) + '\n'); 
    }

    streamClaude(responseChunk: LLMWorkerResponse, res: ResponseStream){
        const chunk = responseChunk.payload as MessageStreamEvent;
        res.push(`event: ${chunk.type}\n`);
        res.push(`data: ${JSON.stringify(chunk)} \n\n`);
        if(chunk.type === 'message_stop'){
            logger.debug('message_stop_event: closing response stream');
            res.end();
        }
    }

    streamOpenAI(responseChunk: LLMWorkerResponse, res: ResponseStream){
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
    }
}