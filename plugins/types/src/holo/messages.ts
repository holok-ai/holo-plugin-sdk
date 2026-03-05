import {HoloContent} from "./content";
import {HoloToolCall} from "./tools";

export interface HoloMessage {
    role: 'user' | 'assistant' | 'tool';
    content: string | HoloContent[];
    tool_calls?: HoloToolCall[];
    tool_call_id?: string;
    name?: string;
}
