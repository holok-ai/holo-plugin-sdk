// ---------- Messages ----------
import {HoloContent} from "./content";
import {HoloToolCall} from "./tools";

export interface HoloMessage {
    role: 'user' | 'assistant' | 'tool';  // No 'developer' here; use top-level system
    content: string | HoloContent[];      // Plain text or structured portable content

    // Portable tool-calling fields:
    // - Present ONLY when role === 'assistant'
    tool_calls?: HoloToolCall[];

    // - Present ONLY when role === 'tool'
    tool_call_id?: string;
    name?: string;                        // Optional author/attribution (OpenAI-compatible)
}
