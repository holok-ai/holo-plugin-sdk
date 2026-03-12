import {HoloMessage} from "./messages";
import {HoloTool, HoloToolChoice} from "./tools";
import {HoloResponseFormat} from "./responses";

export interface HoloRequestMetadata {
    user_id?: string | null;
}

export const RequestType = {
    GENERATE: 'generate',
    CHAT: 'chat'
} as const;

export type RequestType = typeof RequestType[keyof typeof RequestType];

export interface HoloRequest {
    request_type: RequestType;
    model: string;
    messages?: HoloMessage[];
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    tools?: HoloTool[];
    system?: string;
    max_tokens?: number;
    stop_sequences?: string[];
    response_format?: HoloResponseFormat;
    service_tier?: 'auto' | 'default' | 'standard_only';
    tool_choice?: HoloToolChoice;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    seed?: number;
    metadata?: HoloRequestMetadata | null;
}
