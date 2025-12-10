import {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/sdk/holo";
import {LLMWorkerRequest, LLMWorkerResponse} from "../types";
import {RequestType} from "./request.type";

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

/**
 * Model information interface
 */
export interface ModelInfo {
    id: string;
    name?: string;
    description?: string;
    size?: number;
    parameterCount?: string;
    quantization?: string;
    family?: string;
    parentModel?: string;
    format?: string;

    [key: string]: any; // Allow additional properties
}


export interface AIRequestStat {
    type: RequestType;
    startTime: number;
    endTime: number;
    duration: number;
    success: number;
    error: number;
}


export interface IProvider {
    name: string;
    config: ProviderConfig;

    init(): Promise<void>;

    getModels(): Promise<ModelInfo[]>;

    processRequest(request: LLMWorkerRequest): Promise<AIRequestStat | null>;

    handleLLMRequest(sourceId: string, requestId: string, payload: any, type: RequestType): Promise<AIRequestStat>;

    onResponseChunk(responseChunk: LLMWorkerResponse): Promise<void>;
}
