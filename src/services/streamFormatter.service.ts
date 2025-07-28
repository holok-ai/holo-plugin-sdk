import { injectable } from "tsyringe";
import { ResponseStream } from "./response.service";
import { LLMWorkerResponse, Provider } from "../types";
import { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";

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
            default:
                logger.error(`No stream formatter for provider: ${responseChunk.provider}`) ;   
        }
    }

    streamOllama(responseChunk: LLMWorkerResponse, res:ResponseStream){
        res.push(JSON.stringify(responseChunk.payload) + '\n'); 
    }

    streamClaude(responseChunnk: LLMWorkerResponse, res: ResponseStream){
        const chunk = responseChunnk.payload as MessageStreamEvent;
        res.push(`event: ${chunk.type}\n`);
        res.push(`data: ${JSON.stringify(chunk)} \n\n`);
        if(chunk.type === 'message_stop'){
            logger.debug('message_stop_event: closing response stream');
            res.end();
        }
    }
}