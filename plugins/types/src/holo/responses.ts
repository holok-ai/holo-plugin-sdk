import {HoloMessage} from "./messages";

export interface HoloResponseFormatJsonSchema {
    type: 'json_schema';
    schema: Record<string, unknown>;
    strict?: boolean;
}

export interface HoloResponseFormatJsonObject {
    type: 'json_object';
}

export interface HoloResponseFormatText {
    type: 'text';
}

export type HoloResponseFormat =
    | HoloResponseFormatText
    | HoloResponseFormatJsonObject
    | HoloResponseFormatJsonSchema;

export interface HoloUsage {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    service_tier?: 'standard' | 'priority' | 'batch' | 'auto' | 'default' | 'flex' | 'scale';
    timings?: {
        total?: number;
        load?: number;
        prompt_eval?: number;
        eval?: number;
    };
}

export type HoloFinishReason =
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | null;

export interface HoloResponse {
    id?: string;
    model: string;
    messages: HoloMessage[];
    created?: number | Date;
    finish_reason?: HoloFinishReason;
    service_tier?: string;
    usage?: HoloUsage;
}

export type HoloStreamingDeltaType =
    | 'message_start'
    | 'content_delta'
    | 'message_delta'
    | 'message_stop';

export interface HoloStreamingDelta {
    provider: string;
    type: HoloStreamingDeltaType;
    index?: number;
    choice?: number;
    delta: Partial<HoloMessage>;
    usage?: HoloUsage | null;
    provider_delta?: any;
}

export interface HoloStreamChunk {
    id?: string;
    model?: string;
    created?: number;
    delta?: HoloStreamingDelta;
    done?: boolean;
    finish_reason?: HoloFinishReason;
    usage?: HoloUsage;
}
