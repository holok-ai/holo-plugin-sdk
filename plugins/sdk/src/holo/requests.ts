// ---------- Metadata ----------
import {HoloMessage} from "./messages";
import {HoloTool, HoloToolChoice} from "./tools";
import {HoloResponseFormat} from "./responses";

export interface HoloRequestMetadata {
    user_id?: string | null;
}

export enum RequestType {
    GENERATE = 'generate',
    CHAT = 'chat',
    RESPONSES = 'responses'
}

// ---------- Holo Request (portable chat surface) ----------
export interface HoloRequest {
    // 🟢 COMMON (All Providers)
    request_type?: RequestType;           // CAN be set, but default is chat, so set to generate if using ollama
    model: string;                        // Required
    messages?: HoloMessage[];
    temperature?: number;                 // 0.0–2.0 (provider-dependent caps)
    top_p?: number;                       // 0.0–1.0
    stream?: boolean;
    tools?: HoloTool[];

    // 🟡 MAPPED (≥2 Providers)
    system?: string;                      // System prompt (top-level)
    max_tokens?: number;                  // Claude/OpenAI
    stop_sequences?: string[];            // Normalize to array
    response_format?: HoloResponseFormat;
    service_tier?: 'auto' | 'default' | 'standard_only';  // OpenAI / Claude
    tool_choice?: HoloToolChoice;
    top_k?: number;                       // Claude/Ollama
    frequency_penalty?: number;           // OpenAI/Ollama
    presence_penalty?: number;            // OpenAI/Ollama
    seed?: number;                        // OpenAI/Ollama
    metadata?: HoloRequestMetadata | null;
}