import {ClaudeChatRequest, HoloRequest, OllamaChatRequest, OpenAIChatRequest} from "./types";
import type {type} from "arktype";


export interface IProviderTranslator {
    toHoloChatRequest(request: ClaudeChatRequest | OllamaChatRequest | OpenAIChatRequest): Promise<Partial<HoloRequest> | type.errors>;

    fromHoloChatRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest> | Partial<OllamaChatRequest> | Partial<OpenAIChatRequest> | type.errors>;
}
