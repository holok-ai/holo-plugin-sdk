import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/sdk/holo";

export interface ProviderConfig {
    id: string;
    provider_type: string;
    api_key: string;
    model: string;
    plugin_id: string | null; // null for legacy hardcoded providers
    base_url?: string;
    headers?: Record<string, string>;
    timeout?: number;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    retry?: {
        max_attempts?: number;
        backoff?: 'exponential' | 'linear';
    };
}

export interface ProviderCapabilities {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    functionCalling: boolean;
    maxTokens: number;
}


export interface IProviderTranslator {
    toHoloRequest(request: any): Promise<Partial<HoloRequest>>;

    fromHoloRequest(request: HoloRequest): Promise<Partial<any>>;

    toHoloMessages(messages: any[]): Promise<Partial<HoloMessage>[]>;

    fromHoloMessages(messages: HoloMessage[]): Promise<Partial<any>[]>;

    toHoloResponse(response: any): Promise<Partial<HoloResponse>>;

    fromHoloResponse(response: HoloResponse): Promise<Partial<any>>;

    fromHoloStreamChunks(chunks: HoloStreamChunk[]): Promise<unknown>;
}
