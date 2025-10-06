import {ArkErrors} from "arktype";
import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "../holo";
import {ProviderChatRequest, ProviderMessage, ProviderResponse} from "./index";

export interface IProviderTranslator {
    toHoloRequest(request: ProviderChatRequest): Promise<Partial<HoloRequest> | ArkErrors>;

    fromHoloRequest(request: HoloRequest): Promise<Partial<ProviderChatRequest> | ArkErrors>;

    toHoloMessages(messages: ProviderMessage[]): Promise<Partial<HoloMessage>[]>;

    fromHoloMessages(messages: HoloMessage[]): Promise<Partial<ProviderMessage>[]>;

    toHoloResponse(response: ProviderResponse): Promise<Partial<HoloResponse>>;

    fromHoloResponse(response: HoloResponse): Promise<Partial<ProviderResponse>>;

    fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown>;
}
