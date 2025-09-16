import {ClaudeChatRequest, HoloRequest, OllamaChatRequest, OpenAIChatRequest} from "./types";
import type {type} from "arktype";


export interface ITranslator {
    toHoloChatRequest(request: ClaudeChatRequest | OllamaChatRequest | OpenAIChatRequest): HoloRequest | type.errors;

    fromHoloChatRequest(request: HoloRequest): ClaudeChatRequest | OllamaChatRequest | OpenAIChatRequest | type.errors;
}
