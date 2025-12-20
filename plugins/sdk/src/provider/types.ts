import {RequestType} from "@holokai/sdk/holo";
import {HoloWorkerRequest} from "../core/worker";

export enum ProviderEvent {

}

export interface ProviderConfig {
    id: string;
    name: string;
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

    init(): void;

    getModels(): Promise<ModelInfo[]>;

    processWorkerRequest(request: HoloWorkerRequest): Promise<AIRequestStat>;

}
